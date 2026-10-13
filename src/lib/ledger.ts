import { useState, useEffect, useRef, useCallback } from 'react';
import { Connection, PublicKey, ParsedTransactionWithMeta, ConfirmedSignatureInfo } from '@solana/web3.js';
import { LedgerEntry, Project } from '../types';
import { lamportsToSol, getSolanaConnection } from './solana';

export interface ProjectFundingState {
  raisedSol: number;
  backerCount: number;
  percentFunded: number;
  treasuryBalance: number | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  entries: LedgerEntry[];
  refetch: () => Promise<void>;
}

// In-Memory cache per project for 15s (never in localStorage)
interface ProjectLedgerCacheEntry {
  entries: LedgerEntry[];
  raisedSol: number;
  backerCount: number;
  percentFunded: number;
  treasuryBalance: number | null;
  timestamp: number;
}

const memoryLedgerCache = new Map<string, ProjectLedgerCacheEntry>();
const inFlightLedgerQueries = new Map<string, Promise<{ entries: LedgerEntry[]; treasuryBalance: number | null }>>();

// Shared event listeners for refetch notifications
const ledgerSubscribers = new Set<() => void>();

export function notifyLedgerUpdated(): void {
  // Clear memory cache so all views recompute from chain
  memoryLedgerCache.clear();
  ledgerSubscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore
    }
  });
}

/**
 * Standardize createdAt to seconds epoch
 */
export function getProjectCreatedAtSeconds(createdAt: unknown): number {
  if (typeof createdAt === 'number' && !isNaN(createdAt)) {
    // If in milliseconds (> 10^11) convert to seconds
    return createdAt > 1e11 ? Math.floor(createdAt / 1000) : Math.floor(createdAt);
  }
  if (typeof createdAt === 'string' && createdAt.trim().length > 0) {
    const parsed = Date.parse(createdAt);
    if (!isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }
  if (typeof createdAt === 'object' && createdAt !== null) {
    // Firestore Timestamp { seconds: number, nanoseconds: number }
    const ts = createdAt as { seconds?: number; _seconds?: number };
    if (typeof ts.seconds === 'number') return ts.seconds;
    if (typeof ts._seconds === 'number') return ts._seconds;
  }
  return 0;
}

/**
 * Strips surrounding quotes, double quotes, escape slashes, and log prefixes like "[n]"
 */
export function cleanMemoString(raw: string): string {
  let s = raw.trim();
  // Strip log prefix like "[123] " or Program log: Memo (len 45): "..."
  const prefixMatch = s.match(/^\[\d+\]\s*(.*)$/);
  if (prefixMatch) {
    s = prefixMatch[1].trim();
  }
  // Strip surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  // Unescape quotes if serialized inside a string
  if (s.includes('\\"')) {
    s = s.replace(/\\"/g, '"');
  }
  return s;
}

/**
 * Robust memo extractor from parsed instructions, inner instructions, and log messages.
 * Recognizes MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr and Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFmNo.
 */
export function extractMemoFromTransaction(
  parsedTx: ParsedTransactionWithMeta
): { app?: string; type?: string; project?: string; amount?: number; title?: string; rawText?: string } | null {
  const MEMO_PROG_IDS = new Set([
    'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFmNo',
  ]);

  let foundMemoText: string | null = null;

  const inspectInstruction = (ix: unknown) => {
    if (!ix || typeof ix !== 'object' || foundMemoText) return;
    const inst = ix as { program?: string; programId?: { toBase58?: () => string }; parsed?: unknown; data?: string };
    const progId = inst.programId?.toBase58?.() || '';
    if (inst.program === 'spl-memo' || MEMO_PROG_IDS.has(progId)) {
      if (typeof inst.parsed === 'string') {
        foundMemoText = inst.parsed;
      } else if (inst.parsed && typeof inst.parsed === 'object') {
        foundMemoText = JSON.stringify(inst.parsed);
      } else if (typeof inst.data === 'string') {
        try {
          foundMemoText = Buffer.from(inst.data, 'base64').toString('utf-8');
        } catch {
          // ignore
        }
      }
    }
  };

  // 1. Parsed top-level instructions
  if (parsedTx.transaction?.message?.instructions) {
    for (const ix of parsedTx.transaction.message.instructions) {
      inspectInstruction(ix);
      if (foundMemoText) break;
    }
  }

  // 2. Inner instructions
  if (!foundMemoText && parsedTx.meta?.innerInstructions) {
    for (const inner of parsedTx.meta.innerInstructions) {
      for (const ix of inner.instructions) {
        inspectInstruction(ix);
        if (foundMemoText) break;
      }
      if (foundMemoText) break;
    }
  }

  // 3. Fallback to transaction logs
  if (!foundMemoText && parsedTx.meta?.logMessages) {
    for (const log of parsedTx.meta.logMessages) {
      if (log.includes('{"app"') || log.includes('backr') || log.includes('launchpad')) {
        const start = log.indexOf('{');
        const end = log.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          foundMemoText = log.substring(start, end + 1);
          break;
        }
      }
    }
  }

  if (!foundMemoText) return null;

  const cleaned = cleanMemoString(foundMemoText);
  try {
    const parsedObj = JSON.parse(cleaned);
    if (parsedObj && typeof parsedObj === 'object') {
      return {
        ...parsedObj,
        rawText: cleaned,
      };
    }
  } catch {
    // Attempt relaxed regex parsing if JSON has single quotes or unescaped characters
    try {
      const appMatch = cleaned.match(/"app"\s*:\s*"([^"]+)"/);
      const typeMatch = cleaned.match(/"type"\s*:\s*"([^"]+)"/);
      const projMatch = cleaned.match(/"project"\s*:\s*"([^"]+)"/);
      const amtMatch = cleaned.match(/"amount"\s*:\s*([0-9.]+)/);
      if (projMatch) {
        return {
          app: appMatch ? appMatch[1] : undefined,
          type: typeMatch ? typeMatch[1] : undefined,
          project: projMatch[1],
          amount: amtMatch ? parseFloat(amtMatch[1]) : undefined,
          rawText: cleaned,
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Extracts SOL transfer from SystemProgram instructions and inner instructions
 */
export function extractTransferToTreasury(
  parsedTx: ParsedTransactionWithMeta,
  treasuryAddress: string
): { transferLamports: number; senderAddress: string | null } {
  let transferLamports = 0;
  let senderAddress: string | null = null;

  const inspect = (ix: unknown) => {
    if (!ix || typeof ix !== 'object') return;
    const inst = ix as { program?: string; parsed?: unknown };
    if (inst.program === 'system' && inst.parsed && typeof inst.parsed === 'object') {
      const pObj = inst.parsed as { type?: string; info?: { destination?: string; source?: string; lamports?: number } };
      if (pObj.type === 'transfer' && pObj.info) {
        const info = pObj.info;
        if (
          info.destination === treasuryAddress &&
          info.source !== treasuryAddress &&
          typeof info.lamports === 'number' &&
          info.lamports > 0
        ) {
          transferLamports += info.lamports;
          if (!senderAddress && info.source) {
            senderAddress = info.source;
          }
        }
      }
    }
  };

  if (parsedTx.transaction?.message?.instructions) {
    for (const ix of parsedTx.transaction.message.instructions) {
      inspect(ix);
    }
  }

  if (parsedTx.meta?.innerInstructions) {
    for (const inner of parsedTx.meta.innerInstructions) {
      for (const ix of inner.instructions) {
        inspect(ix);
      }
    }
  }

  return { transferLamports, senderAddress };
}

/**
 * Robust on-chain ledger fetcher with pagination (up to 500 signatures),
 * chunked getParsedTransactions (batch size 25) with exponential backoff retry.
 */
export async function fetchProjectOnChainLedger(
  connection: Connection,
  project: Project | { id: string; treasuryAddress: string; createdAt?: unknown; name?: string }
): Promise<{ entries: LedgerEntry[]; treasuryBalance: number | null }> {
  const projectId = (project.id || '').trim();
  const treasuryAddress = (project.treasuryAddress || '').trim();
  const projectName = project.name || '';
  const createdAtSeconds = getProjectCreatedAtSeconds(project.createdAt);

  if (!treasuryAddress) {
    return { entries: [], treasuryBalance: 0 };
  }

  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(treasuryAddress);
  } catch (err) {
    throw new Error(`Invalid treasury public key: ${treasuryAddress}`);
  }

  // 1. Page confirmed signatures for address (up to 500)
  const allSignatures: ConfirmedSignatureInfo[] = [];
  let beforeSig: string | undefined = undefined;

  while (allSignatures.length < 500) {
    const fetchLimit = Math.min(100, 500 - allSignatures.length);
    const batch = await connection.getSignaturesForAddress(pubkey, {
      limit: fetchLimit,
      before: beforeSig,
    });
    if (!batch || batch.length === 0) break;
    allSignatures.push(...batch);
    if (batch.length < fetchLimit) break;
    beforeSig = batch[batch.length - 1].signature;
  }

  // 2. Fetch live treasury balance
  let treasuryBalance: number | null = null;
  try {
    const balLamports = await connection.getBalance(pubkey, 'confirmed');
    treasuryBalance = lamportsToSol(balLamports);
  } catch (e) {
    console.warn('Could not fetch treasury balance:', e);
  }

  if (allSignatures.length === 0) {
    if (import.meta.env?.DEV) {
      console.groupCollapsed(`[BACKR Chain Ledger] Project: ${projectName || projectId}`);
      console.log('Signatures found: 0');
      console.groupEnd();
    }
    return { entries: [], treasuryBalance };
  }

  // 3. Batch getParsedTransactions with retry and exponential backoff
  const sigStrings = allSignatures.map((s) => s.signature);
  const parsedMap = new Map<string, ParsedTransactionWithMeta | null>();
  const CHUNK_SIZE = 25;

  for (let i = 0; i < sigStrings.length; i += CHUNK_SIZE) {
    const chunk = sigStrings.slice(i, i + CHUNK_SIZE);
    let attempts = 0;
    let success = false;
    let chunkTxs: (ParsedTransactionWithMeta | null)[] = [];

    while (attempts < 3 && !success) {
      try {
        chunkTxs = await connection.getParsedTransactions(chunk, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        success = true;
      } catch (rpcErr) {
        attempts++;
        if (attempts >= 3) {
          throw new Error(
            `Failed to load on-chain transaction data from Solana Devnet: ${
              rpcErr instanceof Error ? rpcErr.message : String(rpcErr)
            }`
          );
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 400));
      }
    }

    chunk.forEach((sig, idx) => {
      parsedMap.set(sig, chunkTxs[idx] || null);
    });
  }

  // 4. Parse & filter verified contributions & milestones
  const verifiedEntries: LedgerEntry[] = [];
  const seenSignatures = new Set<string>();

  // Diagnostic tracking for dev console group
  let countFailedTx = 0;
  let countBeforeCreatedAt = 0;
  let countNoMemo = 0;
  let countWrongProject = 0;
  let countWrongDestOrNoTransfer = 0;
  let countMatched = 0;
  let countHadMemo = 0;

  for (const sigInfo of allSignatures) {
    const parsed = parsedMap.get(sigInfo.signature);

    if (!parsed || !parsed.transaction || (parsed.meta && parsed.meta.err !== null) || sigInfo.err !== null) {
      countFailedTx++;
      continue;
    }

    const blockTimeSec = sigInfo.blockTime ?? parsed.blockTime ?? null;
    // 60-second clock tolerance between device clocks and cluster blockTime
    if (createdAtSeconds > 0 && blockTimeSec !== null) {
      if (blockTimeSec < createdAtSeconds - 60) {
        countBeforeCreatedAt++;
        continue;
      }
    }

    const memoObj = extractMemoFromTransaction(parsed);
    if (!memoObj) {
      countNoMemo++;
      continue;
    }

    countHadMemo++;

    // Strict project ID check: compare trimmed strings with strict equality
    const memoProjId = (memoObj.project || '').trim();
    if (memoProjId !== projectId) {
      countWrongProject++;
      if (import.meta.env?.DEV) {
        console.warn(`[BACKR Project ID Mismatch] Memo project: "${memoProjId}" !== Stored project: "${projectId}"`);
      }
      continue;
    }

    // App name must be backr or launchpad
    const appName = (memoObj.app || '').toLowerCase();
    if (appName !== 'backr' && appName !== 'launchpad') {
      countNoMemo++;
      continue;
    }

    const isContribution = memoObj.type === 'contribution';
    const isMilestone = memoObj.type === 'milestone';
    if (!isContribution && !isMilestone) {
      continue;
    }

    const { transferLamports, senderAddress } = extractTransferToTreasury(parsed, treasuryAddress);

    // If it is a contribution, it must have transferred > 0 SOL to the treasury
    if (isContribution && transferLamports <= 0) {
      countWrongDestOrNoTransfer++;
      continue;
    }

    const accountKeys = parsed.transaction.message.accountKeys;
    const feePayer = accountKeys[0]?.pubkey?.toBase58?.() || 'Unknown';
    const fromAddress = senderAddress || feePayer;

    if (fromAddress === treasuryAddress && !isMilestone) {
      countWrongDestOrNoTransfer++;
      continue;
    }

    if (seenSignatures.has(sigInfo.signature)) {
      continue;
    }
    seenSignatures.add(sigInfo.signature);

    const txTimeMs = blockTimeSec ? blockTimeSec * 1000 : Date.now();
    const amountSol = isContribution ? lamportsToSol(transferLamports) : 0;

    const entry: LedgerEntry = {
      signature: sigInfo.signature,
      slot: sigInfo.slot,
      timestamp: txTimeMs,
      fromAddress,
      toAddress: treasuryAddress,
      amountSol,
      type: isMilestone ? 'milestone' : 'contribution',
      memo: memoObj.rawText,
      projectId,
      projectName: memoObj.title || projectName,
      status: sigInfo.confirmationStatus === 'finalized' ? 'finalized' : 'confirmed',
    };

    verifiedEntries.push(entry);
    countMatched++;
  }

  verifiedEntries.sort((a, b) => b.timestamp - a.timestamp);

  // Development-only diagnostic console group
  if (import.meta.env?.DEV) {
    console.groupCollapsed(`[BACKR On-Chain Ledger] ${projectName || projectId} (Treasury: ${treasuryAddress.slice(0, 8)}…)`);
    console.log('Signatures scanned:', allSignatures.length);
    console.log('Transactions parsed:', parsedMap.size);
    console.log('Had memo instruction/log:', countHadMemo);
    console.log('Matched project id:', countMatched);
    console.log('Skipped summary:', {
      failedTransactions: countFailedTx,
      beforeProjectCreatedAt: countBeforeCreatedAt,
      noMemoFound: countNoMemo,
      wrongProjectId: countWrongProject,
      noTransferToTreasury: countWrongDestOrNoTransfer,
    });
    console.groupEnd();
  }

  return { entries: verifiedEntries, treasuryBalance };
}

/**
 * Fetch with 15s in-memory caching and simultaneous request deduplication
 */
export async function getProjectLedgerCached(
  connection: Connection,
  project: Project
): Promise<ProjectLedgerCacheEntry> {
  const cacheKey = `${project.id}:${project.treasuryAddress}`;
  const now = Date.now();
  const cached = memoryLedgerCache.get(cacheKey);

  if (cached && now - cached.timestamp < 15000) {
    return cached;
  }

  if (inFlightLedgerQueries.has(cacheKey)) {
    const inFlight = await inFlightLedgerQueries.get(cacheKey)!;
    return computeStatsFromEntries(project, inFlight.entries, inFlight.treasuryBalance);
  }

  const queryPromise = fetchProjectOnChainLedger(connection, project);
  inFlightLedgerQueries.set(cacheKey, queryPromise);

  try {
    const result = await queryPromise;
    const computed = computeStatsFromEntries(project, result.entries, result.treasuryBalance);
    memoryLedgerCache.set(cacheKey, computed);
    return computed;
  } finally {
    inFlightLedgerQueries.delete(cacheKey);
  }
}

function computeStatsFromEntries(
  project: Project,
  entries: LedgerEntry[],
  treasuryBalance: number | null
): ProjectLedgerCacheEntry {
  const contributionRows = entries.filter((e) => e.type === 'contribution' && e.amountSol > 0);
  const raisedSol = Math.round(contributionRows.reduce((acc, r) => acc + r.amountSol, 0) * 1000) / 1000;

  const distinctSenders = new Set(
    contributionRows
      .filter((r) => r.fromAddress && r.fromAddress !== project.treasuryAddress && r.fromAddress !== 'Unknown')
      .map((r) => r.fromAddress)
  );
  const backerCount = distinctSenders.size;

  const goal = project.goalSol || 0;
  const percentFunded = goal > 0 ? Math.min(100, Math.max(0, Math.round((raisedSol / goal) * 100))) : 0;

  return {
    entries,
    raisedSol,
    backerCount,
    percentFunded,
    treasuryBalance,
    timestamp: Date.now(),
  };
}

/**
 * Unified shared hook: useProjectFunding(project)
 * Recomputes funding solely from Solana Devnet on every load.
 * Never stores progress in localStorage, state-only mock counters, or database fields.
 * Refetches on page open, on window focus, every 30 seconds, and on demand.
 */
export function useProjectFunding(project: Project | null | undefined): ProjectFundingState {
  const connection = getSolanaConnection();

  const [raisedSol, setRaisedSol] = useState(0);
  const [backerCount, setBackerCount] = useState(0);
  const [percentFunded, setPercentFunded] = useState(0);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchFunding = useCallback(async () => {
    if (!project || !project.id || !project.treasuryAddress) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsError(false);
      setError(null);

      const stats = await getProjectLedgerCached(connection, project);
      if (isMountedRef.current) {
        setRaisedSol(stats.raisedSol);
        setBackerCount(stats.backerCount);
        setPercentFunded(stats.percentFunded);
        setTreasuryBalance(stats.treasuryBalance);
        setEntries(stats.entries);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        console.error(`[BACKR Ledger Error] Project: ${project.id}:`, err);
        setIsError(true);
        setError(err instanceof Error ? err.message : 'Couldn\'t load on-chain data');
        setIsLoading(false);
      }
    }
  }, [project?.id, project?.treasuryAddress, project?.goalSol, project?.createdAt]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    fetchFunding();

    // Refetch on window focus
    const handleFocus = () => {
      fetchFunding();
    };
    window.addEventListener('focus', handleFocus);

    // Refetch every 30 seconds
    const interval = setInterval(fetchFunding, 30000);

    // Subscribe to external refetch notifications (e.g. after contribution)
    const handleSubscriber = () => {
      fetchFunding();
    };
    ledgerSubscribers.add(handleSubscriber);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
      ledgerSubscribers.delete(handleSubscriber);
    };
  }, [fetchFunding]);

  return {
    raisedSol,
    backerCount,
    percentFunded,
    treasuryBalance,
    isLoading,
    isError,
    error,
    entries,
    refetch: fetchFunding,
  };
}

/**
 * Shared hook to compute platform totals across projects recomputed directly from Solana devnet
 */
export function usePlatformTotalFunding(projects: Project[]) {
  const connection = getSolanaConnection();
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalBackers, setTotalBackers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchTotals = useCallback(async () => {
    if (!projects || projects.length === 0) {
      setTotalRaised(0);
      setTotalBackers(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsError(false);
      const results = await Promise.allSettled(
        projects.slice(0, 10).map((p) => getProjectLedgerCached(connection, p))
      );

      let sumRaised = 0;
      const allSupporters = new Set<string>();

      for (const res of results) {
        if (res.status === 'fulfilled') {
          sumRaised += res.value.raisedSol;
          res.value.entries
            .filter((e) => e.type === 'contribution' && e.amountSol > 0)
            .forEach((e) => {
              if (e.fromAddress && e.fromAddress !== 'Unknown') {
                allSupporters.add(e.fromAddress);
              }
            });
        }
      }

      setTotalRaised(Math.round(sumRaised * 1000) / 1000);
      setTotalBackers(allSupporters.size);
      setIsLoading(false);
    } catch {
      setIsError(true);
      setIsLoading(false);
    }
  }, [projects]);

  useEffect(() => {
    fetchTotals();
    const interval = setInterval(fetchTotals, 30000);
    const sub = () => {
      fetchTotals();
    };
    ledgerSubscribers.add(sub);
    return () => {
      clearInterval(interval);
      ledgerSubscribers.delete(sub);
    };
  }, [fetchTotals]);

  return {
    totalRaised,
    totalBackers,
    isLoading,
    isError,
    refetch: fetchTotals,
  };
}

/**
 * Backward compatibility helpers
 */
export async function fetchProjectLedger(
  connection: Connection,
  project: Project
): Promise<LedgerEntry[]> {
  const res = await getProjectLedgerCached(connection, project);
  return res.entries;
}

export async function fetchTreasuryBalance(
  connection: Connection,
  treasuryAddress: string
): Promise<number | null> {
  try {
    const pubkey = new PublicKey(treasuryAddress);
    const lamports = await connection.getBalance(pubkey, 'confirmed');
    return lamportsToSol(lamports);
  } catch {
    return null;
  }
}

export function getTotalRaised(projects: Project[]): number {
  let sum = 0;
  for (const p of projects) {
    const cached = memoryLedgerCache.get(`${p.id}:${p.treasuryAddress}`);
    if (cached) sum += cached.raisedSol;
  }
  return Math.round(sum * 1000) / 1000;
}

export function getTotalUniqueBackers(projectIds?: string[]): number {
  const set = new Set<string>();
  for (const entry of memoryLedgerCache.values()) {
    entry.entries
      .filter((e) => e.type === 'contribution' && e.amountSol > 0)
      .forEach((e) => {
        if (e.fromAddress && e.fromAddress !== 'Unknown') set.add(e.fromAddress);
      });
  }
  return set.size;
}

export function subscribeProjectStats(cb: () => void): () => void {
  ledgerSubscribers.add(cb);
  return () => {
    ledgerSubscribers.delete(cb);
  };
}

