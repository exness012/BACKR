import { useState, useEffect } from 'react';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { LedgerEntry, Project } from '../types';
import { lamportsToSol } from './solana';

const VERIFIED_TXS_STORAGE_KEY = 'launchpad_verified_contributions_v5';

// Clean up legacy storage versions on startup so stale test numbers are discarded
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('launchpad_verified_contributions_v1');
    localStorage.removeItem('launchpad_verified_contributions_v2');
    localStorage.removeItem('launchpad_verified_contributions_v3');
    localStorage.removeItem('launchpad_verified_contributions_v4');
    localStorage.removeItem('launchpad_recent_txs_v1');
  } catch {
    // Ignore storage errors
  }
}

function loadVerifiedFromStorage(): LedgerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VERIFIED_TXS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Strict validation: must have signature, projectId, and valid type
    return parsed.filter(
      (e: unknown): e is LedgerEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as LedgerEntry).signature === 'string' &&
        typeof (e as LedgerEntry).projectId === 'string' &&
        Boolean((e as LedgerEntry).projectId)
    );
  } catch {
    return [];
  }
}

function saveVerifiedToStorage(entries: LedgerEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VERIFIED_TXS_STORAGE_KEY, JSON.stringify(entries.slice(0, 300)));
  } catch {
    // Ignore storage quota
  }
}

// In-memory verified ledger registry & listeners
let verifiedRegistry: LedgerEntry[] = loadVerifiedFromStorage();
const statsListeners = new Set<() => void>();

export function subscribeProjectStats(callback: () => void): () => void {
  statsListeners.add(callback);
  return () => {
    statsListeners.delete(callback);
  };
}

function notifyStatsListeners(): void {
  statsListeners.forEach(cb => {
    try {
      cb();
    } catch {
      // Ignore callback errors
    }
  });
}

/**
 * Record a verified contribution or milestone that was confirmed on Solana Devnet
 */
export function recordConfirmedSessionTx(entry: LedgerEntry): void {
  if (!entry.projectId) return;
  const existingIdx = verifiedRegistry.findIndex(t => t.signature === entry.signature);
  if (existingIdx === -1) {
    verifiedRegistry = [entry, ...verifiedRegistry];
  } else {
    verifiedRegistry[existingIdx] = entry;
  }
  saveVerifiedToStorage(verifiedRegistry);
  notifyStatsListeners();
}

/**
 * Raised = sum of verified contribution rows for this project only.
 * Strictly 0 if no verified contributions exist for this project.
 */
export function getProjectRaised(projectId: string): number {
  if (!projectId) return 0;
  const rows = verifiedRegistry.filter(
    e => e.projectId === projectId && e.type === 'contribution' && e.amountSol > 0
  );
  const sum = rows.reduce((acc, r) => acc + r.amountSol, 0);
  return Math.round(sum * 1000) / 1000;
}

/**
 * Backers = count of unique sender wallets among verified contribution rows for this project only.
 * Ignores self-transfers from the treasury.
 */
export function getProjectBackers(projectId: string): number {
  if (!projectId) return 0;
  const rows = verifiedRegistry.filter(
    e => e.projectId === projectId && e.type === 'contribution' && e.amountSol > 0
  );
  const senders = new Set(
    rows
      .filter(r => r.fromAddress && r.fromAddress !== 'Unknown' && r.fromAddress !== r.toAddress)
      .map(r => r.fromAddress)
  );
  return senders.size;
}

/**
 * Progress bar = (raised / goal) * 100, computed solely from verified contribution rows.
 */
export function getProjectProgress(projectId: string, goalSol: number): number {
  if (!goalSol || goalSol <= 0) return 0;
  const raised = getProjectRaised(projectId);
  return Math.min(100, Math.max(0, Math.round((raised / goalSol) * 100)));
}

/**
 * Total SOL raised across all projects (or a provided subset of projects)
 */
export function getTotalRaised(projects?: Project[]): number {
  if (!projects || projects.length === 0) {
    const relevantRows = verifiedRegistry.filter(e => e.type === 'contribution' && e.amountSol > 0);
    const sum = relevantRows.reduce((acc, r) => acc + r.amountSol, 0);
    return Math.round(sum * 1000) / 1000;
  }
  const sum = projects.reduce((acc, p) => acc + getProjectRaised(p.id), 0);
  return Math.round(sum * 1000) / 1000;
}

/**
 * Total unique backers across all verified contributions
 */
export function getTotalUniqueBackers(projectIds?: string[]): number {
  const relevantRows = projectIds && projectIds.length > 0
    ? verifiedRegistry.filter(e => e.projectId && projectIds.includes(e.projectId) && e.type === 'contribution' && e.amountSol > 0)
    : verifiedRegistry.filter(e => e.type === 'contribution' && e.amountSol > 0);

  const senders = new Set(
    relevantRows
      .filter(r => r.fromAddress && r.fromAddress !== 'Unknown' && r.fromAddress !== r.toAddress)
      .map(r => r.fromAddress)
  );
  return senders.size;
}

/**
 * React hook to reactively subscribe to project stats
 */
export function useProjectStats(projectId: string, goalSol: number) {
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeProjectStats(() => {
      setTick(t => t + 1);
    });
  }, [projectId]);

  const raisedSol = getProjectRaised(projectId);
  const backerCount = getProjectBackers(projectId);
  const percentFunded = getProjectProgress(projectId, goalSol);

  return { raisedSol, backerCount, percentFunded };
}

export interface ProjectChainData {
  entries: LedgerEntry[];
  raisedSol: number;
  backerCount: number;
  treasuryBalance: number | null;
}

interface LedgerQueryCacheEntry {
  data: LedgerEntry[];
  timestamp: number;
}
const ledgerQueryCache = new Map<string, LedgerQueryCacheEntry>();
const inFlightLedgerQueries = new Map<string, Promise<LedgerEntry[]>>();

/**
 * Fetch real on-chain transaction history for a treasury address directly from Solana Devnet.
 * Strictly filters to verified Launchpad contributions & milestones matching the specific project ID.
 * Never includes airdrops, self-transfers, or transfers for other projects.
 * Results are cached for 15s and duplicate requests are deduplicated.
 */
export async function fetchProjectLedger(
  connection: Connection,
  projectOrTreasury: Project | string,
  projectMeta?: { id?: string; createdAt?: number; name?: string }
): Promise<LedgerEntry[]> {
  let treasuryAddress: string;
  let projectId: string | undefined;
  let projectCreatedAt: number | undefined;
  let projectName: string | undefined;

  if (typeof projectOrTreasury === 'string') {
    treasuryAddress = projectOrTreasury;
    projectId = projectMeta?.id;
    projectCreatedAt = projectMeta?.createdAt;
    projectName = projectMeta?.name;
  } else {
    treasuryAddress = projectOrTreasury.treasuryAddress;
    projectId = projectOrTreasury.id;
    projectCreatedAt = projectOrTreasury.createdAt;
    projectName = projectOrTreasury.name;
  }

  const cacheKey = `${treasuryAddress}:${projectId || ''}:${projectCreatedAt || 0}`;
  const now = Date.now();
  const cached = ledgerQueryCache.get(cacheKey);
  if (cached && now - cached.timestamp < 15000) {
    return cached.data;
  }

  if (inFlightLedgerQueries.has(cacheKey)) {
    return inFlightLedgerQueries.get(cacheKey)!;
  }

  const queryPromise = (async () => {
    try {
      const res = await executeFetchProjectLedger(
        connection,
        treasuryAddress,
        projectId,
        projectCreatedAt,
        projectName
      );
      ledgerQueryCache.set(cacheKey, { data: res, timestamp: Date.now() });
      return res;
    } finally {
      inFlightLedgerQueries.delete(cacheKey);
    }
  })();

  inFlightLedgerQueries.set(cacheKey, queryPromise);
  return queryPromise;
}

async function executeFetchProjectLedger(
  connection: Connection,
  treasuryAddress: string,
  projectId?: string,
  projectCreatedAt?: number,
  projectName?: string
): Promise<LedgerEntry[]> {
  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(treasuryAddress);
  } catch {
    return [];
  }

  // Fetch confirmed signatures from Solana Devnet (limit 25 as per perf requirement)
  let confirmedSignatures: { signature: string; slot: number; err: unknown; blockTime?: number | null; confirmationStatus?: string }[] = [];
  try {
    confirmedSignatures = await connection.getSignaturesForAddress(pubkey, { limit: 25 });
  } catch (error) {
    console.warn('Devnet getSignaturesForAddress rate limit or network notice:', error);
    return verifiedRegistry.filter(
      tx => projectId ? tx.projectId === projectId : tx.toAddress === treasuryAddress
    );
  }

  // Strict pre-filter:
  // 1. meta.err is null (successful)
  // 2. blockTime is greater than or equal to projectCreatedAt (ignore anything before project existed)
  const validSigs = (confirmedSignatures || []).filter(s => {
    if (s.err !== null) return false;
    if (projectCreatedAt && s.blockTime) {
      // 60-second tolerance for block timestamp differences
      if (s.blockTime * 1000 < (projectCreatedAt - 60000)) {
        return false;
      }
    }
    return true;
  });

  if (validSigs.length === 0) {
    // Return any session-confirmed entries strictly for this project
    return verifiedRegistry.filter(
      tx => projectId ? tx.projectId === projectId : tx.toAddress === treasuryAddress
    );
  }

  const sigStrings = validSigs.map(s => s.signature);

  // Batch fetch parsed transactions
  let parsedTxs: (ParsedTransactionWithMeta | null)[] = [];
  try {
    parsedTxs = await connection.getParsedTransactions(sigStrings, {
      maxSupportedTransactionVersion: 0,
    });
  } catch {
    try {
      parsedTxs = await Promise.all(
        sigStrings.slice(0, 10).map(sig =>
          connection.getParsedTransaction(sig, { maxSupportedTransactionVersion: 0 }).catch(() => null)
        )
      );
    } catch {
      return verifiedRegistry.filter(
        tx => projectId ? tx.projectId === projectId : tx.toAddress === treasuryAddress
      );
    }
  }

  const onChainEntries: LedgerEntry[] = [];
  const seenSignatures = new Set<string>();

  for (let i = 0; i < validSigs.length; i++) {
    const sigInfo = validSigs[i];
    const parsed = parsedTxs[i];

    // 1. Successful check
    if (!parsed || !parsed.transaction || (parsed.meta && parsed.meta.err !== null)) {
      continue;
    }

    // 2. Block time check (ignore anything before project was created)
    const blockTimeSec = sigInfo.blockTime ?? parsed.blockTime ?? null;
    const txTimeMs = blockTimeSec ? blockTimeSec * 1000 : Date.now();
    if (projectCreatedAt && blockTimeSec && (txTimeMs < projectCreatedAt - 60000)) {
      continue;
    }

    // 4. Extract Launchpad Memo instruction: strict equality requirement
    let launchpadMemo: { app?: string; type?: string; project?: string; amount?: number; title?: string } | null = null;
    let memoRawText: string | undefined = undefined;

    const inspectMemo = (ix: unknown) => {
      if (!ix || typeof ix !== 'object') return;
      const instruction = ix as { program?: string; programId?: { toBase58?: () => string }; parsed?: unknown; data?: string };
      const progIdStr = instruction.programId?.toBase58?.();
      if (instruction.program === 'spl-memo' || progIdStr === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') {
        try {
          let raw: string = '';
          if (typeof instruction.parsed === 'string') {
            raw = instruction.parsed;
          } else if (instruction.parsed && typeof instruction.parsed === 'object') {
            raw = JSON.stringify(instruction.parsed);
          } else if (typeof instruction.data === 'string') {
            // Raw base58 / base64 memo data fallback
            try {
              raw = Buffer.from(instruction.data, 'base64').toString('utf-8');
            } catch {
              // Ignore
            }
          }

          if (raw) {
            memoRawText = raw;
            const parsedObj = JSON.parse(raw);
            if (parsedObj && typeof parsedObj === 'object') {
              launchpadMemo = parsedObj;
            }
          }
        } catch {
          // Plain text memo or invalid JSON
        }
      }
    };

    for (const ix of parsed.transaction.message.instructions) {
      inspectMemo(ix);
    }
    if (parsed.meta?.innerInstructions) {
      for (const inner of parsed.meta.innerInstructions) {
        for (const ix of inner.instructions) {
          inspectMemo(ix);
        }
      }
    }

    // Also scan program logs if memo was logged in runtime
    if (!launchpadMemo && parsed.meta?.logMessages) {
      for (const log of parsed.meta.logMessages) {
        if (log.includes('{"app":"launchpad"') || log.includes('{"app":"backr"')) {
          try {
            const startIdx = log.includes('{"app":"launchpad"')
              ? log.indexOf('{"app":"launchpad"')
              : log.indexOf('{"app":"backr"');
            const jsonStr = log.substring(startIdx);
            const parsedObj = JSON.parse(jsonStr);
            if (parsedObj && typeof parsedObj === 'object') {
              launchpadMemo = parsedObj;
              memoRawText = jsonStr;
              break;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // STRICT MEMO REQUIREMENT:
    // Transfers without a matching BACKR / Launchpad memo are ignored completely (airdrops, simple transfers, other dapps)
    if (!launchpadMemo || (launchpadMemo.app !== 'launchpad' && launchpadMemo.app !== 'backr')) {
      continue;
    }

    // STRICT PROJECT MATCHING:
    // If querying for a specific project, strictly match project === P.id (exact match, NEVER includes())
    if (projectId) {
      if (launchpadMemo.project !== projectId) {
        continue;
      }
    } else {
      // For global query, project must be a non-empty string
      if (!launchpadMemo.project || typeof launchpadMemo.project !== 'string') {
        continue;
      }
    }

    const memoProjectId = launchpadMemo.project;
    const isMilestone = launchpadMemo.type === 'milestone';
    const isContribution = launchpadMemo.type === 'contribution';

    if (!isMilestone && !isContribution) {
      continue;
    }

    // 3 & 5. Find SystemProgram transfer whose destination equals treasuryAddress and source is NOT treasuryAddress
    let transferLamports = 0;
    let senderAddress: string | null = null;

    const inspectTransfer = (ix: unknown) => {
      if (!ix || typeof ix !== 'object') return;
      const instruction = ix as { program?: string; parsed?: unknown };
      if (instruction.program === 'system' && instruction.parsed && typeof instruction.parsed === 'object') {
        const parsedObj = instruction.parsed as { type?: string; info?: { destination?: string; source?: string; lamports?: number } };
        if (parsedObj.type === 'transfer' && parsedObj.info) {
          const info = parsedObj.info;
          // Destination must equal treasuryAddress, and source must NOT be treasuryAddress itself (ignore self-transfers)
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

    for (const ix of parsed.transaction.message.instructions) {
      inspectTransfer(ix);
    }
    if (parsed.meta?.innerInstructions) {
      for (const inner of parsed.meta.innerInstructions) {
        for (const ix of inner.instructions) {
          inspectTransfer(ix);
        }
      }
    }

    // If it's a contribution, it MUST have a positive SOL transfer to treasury from a non-treasury source
    if (isContribution && transferLamports <= 0) {
      continue;
    }

    const accountKeys = parsed.transaction.message.accountKeys;
    const feePayer = accountKeys[0]?.pubkey?.toBase58?.() || 'Unknown';
    const fromAddress = senderAddress || feePayer;

    // Ignore self-transfers
    if (fromAddress === treasuryAddress && !isMilestone) {
      continue;
    }

    // The amount counted is strictly the lamports of that specific transfer instruction
    const amountSol = lamportsToSol(transferLamports);

    if (seenSignatures.has(sigInfo.signature)) {
      continue;
    }
    seenSignatures.add(sigInfo.signature);

    const verifiedEntry: LedgerEntry = {
      signature: sigInfo.signature,
      slot: sigInfo.slot,
      timestamp: txTimeMs,
      fromAddress,
      toAddress: treasuryAddress,
      amountSol: isContribution ? amountSol : 0,
      type: isMilestone ? 'milestone' : 'contribution',
      memo: memoRawText,
      projectId: memoProjectId,
      projectName: launchpadMemo.title || projectName,
      status: sigInfo.confirmationStatus === 'finalized' ? 'finalized' : 'confirmed',
    };

    onChainEntries.push(verifiedEntry);
    recordConfirmedSessionTx(verifiedEntry);
  }

  // Merge any session-confirmed transactions for this project not already in onChainEntries
  const sessionMatches = verifiedRegistry.filter(
    tx => (projectId ? tx.projectId === projectId : true) && !seenSignatures.has(tx.signature)
  );

  const merged = [...sessionMatches, ...onChainEntries];
  return merged.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Fetch live balance of a treasury address from Solana Devnet.
 * strictly separate and NEVER used as raised funds.
 */
export async function fetchTreasuryBalance(connection: Connection, address: string): Promise<number | null> {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return lamportsToSol(lamports);
  } catch {
    return null;
  }
}

/**
 * Compute real on-chain stats (raised SOL, backer count, treasury balance).
 * Raised = sum of verified contribution rows for this project only.
 * Backers = count of unique sender wallets among those rows.
 * Treasury balance is strictly separate and NEVER used as raised funds.
 */
export async function fetchProjectChainData(
  connection: Connection,
  projectOrTreasury: Project | string,
  projectMeta?: { id?: string; createdAt?: number; name?: string }
): Promise<ProjectChainData> {
  const projectId = typeof projectOrTreasury === 'string' ? projectMeta?.id : projectOrTreasury.id;
  const treasuryAddress = typeof projectOrTreasury === 'string' ? projectOrTreasury : projectOrTreasury.treasuryAddress;

  const [entriesResult, balResult] = await Promise.allSettled([
    fetchProjectLedger(connection, projectOrTreasury, projectMeta),
    fetchTreasuryBalance(connection, treasuryAddress),
  ]);

  const entries = entriesResult.status === 'fulfilled'
    ? entriesResult.value
    : (projectId ? verifiedRegistry.filter(e => e.projectId === projectId) : []);
  const treasuryBalance = balResult.status === 'fulfilled' ? balResult.value : null;

  // Raised = sum of verified contribution rows for this project only
  const contributionRows = entries.filter(e => e.type === 'contribution' && e.amountSol > 0 && e.projectId === projectId);
  const raisedSol = contributionRows.reduce((acc, entry) => acc + entry.amountSol, 0);

  // Backers = count of unique sender wallets among those rows (excluding treasury)
  const distinctBackers = new Set(
    contributionRows
      .filter(entry => entry.fromAddress && entry.fromAddress !== treasuryAddress && entry.fromAddress !== 'Unknown')
      .map(entry => entry.fromAddress)
  );

  return {
    entries,
    raisedSol: Math.round(raisedSol * 1000) / 1000,
    backerCount: distinctBackers.size,
    treasuryBalance,
  };
}



