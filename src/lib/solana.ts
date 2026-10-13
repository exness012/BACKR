import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';

export const DEVNET_ENDPOINT =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOLANA_RPC_URL) ||
  clusterApiUrl('devnet');
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// In-Memory RPC Cache & In-Flight Request Deduplication to prevent 429 rate limits
interface CacheEntry {
  data: string;
  timestamp: number;
  ttl: number;
}

const rpcCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<Response>>();

// TTL in milliseconds by RPC method to safeguard devnet node limits
const METHOD_TTL: Record<string, number> = {
  getLatestBlockhash: 4000, // 4s (blockhash valid ~60s on-chain)
  getBalance: 12000, // 12s
  getSignaturesForAddress: 25000, // 25s
  getParsedTransaction: 600000, // 10 min (immutable on-chain)
  getParsedTransactions: 600000, // 10 min
  getAccountInfo: 20000, // 20s
};

export const customSolanaFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Pass through non-POST or non-string body requests
  if (!init || init.method !== 'POST' || typeof init.body !== 'string') {
    return fetch(input, init);
  }

  let rpcBody: { method?: string; params?: unknown; id?: unknown } | null = null;
  try {
    rpcBody = JSON.parse(init.body);
  } catch {
    return fetch(input, init);
  }

  const method = rpcBody?.method;
  const ttl = method ? METHOD_TTL[method] : undefined;

  // Intercept cacheable read methods
  if (method && ttl && rpcBody) {
    const cacheKey = `${url}:${method}:${JSON.stringify(rpcBody.params || [])}`;
    const now = Date.now();
    const cached = rpcCache.get(cacheKey);

    if (cached && now - cached.timestamp < cached.ttl) {
      return new Response(cached.data, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Deduplicate concurrent identical requests
    if (inFlightRequests.has(cacheKey)) {
      try {
        const inFlightRes = await inFlightRequests.get(cacheKey)!;
        return inFlightRes.clone();
      } catch {
        // Fallback to fresh execution if in-flight failed
      }
    }

    // Execute with proxy and fallback
    const executeFetch = async (retries = 3, delayMs = 600): Promise<Response> => {
      try {
        let res: Response;
        try {
          res = await fetch('/api/solana-rpc', init);
          if (!res.ok && res.status !== 429) {
            res = await fetch(input, init);
          }
        } catch {
          res = await fetch(input, init);
        }

        if (res.status === 429 && retries > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
          return executeFetch(retries - 1, delayMs * 1.5);
        }

        if (res.ok) {
          const text = await res.text();
          rpcCache.set(cacheKey, {
            data: text,
            timestamp: Date.now(),
            ttl,
          });
          return new Response(text, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        }

        return res;
      } catch (err) {
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
          return executeFetch(retries - 1, delayMs * 1.5);
        }
        throw err;
      }
    };

    const promise = executeFetch().finally(() => {
      inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, promise);
    const result = await promise;
    return result.clone();
  }

  // Direct requests (transactions): try proxy first to bypass client rate limit
  const executeDirect = async (retries = 3, delayMs = 800): Promise<Response> => {
    try {
      let res: Response;
      try {
        res = await fetch('/api/solana-rpc', init);
        if (!res.ok && res.status !== 429) {
          res = await fetch(input, init);
        }
      } catch {
        res = await fetch(input, init);
      }

      if (res.status === 429 && retries > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
        return executeDirect(retries - 1, delayMs * 1.5);
      }
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
        return executeDirect(retries - 1, delayMs * 1.5);
      }
      throw err;
    }
  };

  return executeDirect();
};

let sharedConnection: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!sharedConnection) {
    sharedConnection = new Connection(DEVNET_ENDPOINT, {
      commitment: 'confirmed',
      fetch: customSolanaFetch,
    });
  }
  return sharedConnection;
}

export function shortenAddress(address?: string | null, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a standard memo instruction for on-chain tagging
 */
export function createMemoInstruction(payer: PublicKey, memoContent: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoContent, 'utf-8'),
  });
}

/**
 * Build & send contribution transaction:
 * 1. SystemProgram.transfer of SOL to treasuryAddress
 * 2. Memo Program instruction with JSON metadata
 */
export async function createContributionTransaction(
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amountSol: number,
  projectId: string,
  projectName?: string
): Promise<Transaction> {
  const transaction = new Transaction();

  // 1. Transfer SOL to project treasury
  const transferInstruction = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports: solToLamports(amountSol),
  });
  transaction.add(transferInstruction);

  // 2. Attach on-chain Memo
  const memoPayload = JSON.stringify({
    app: 'backr',
    type: 'contribution',
    project: projectId.trim(),
    amount: amountSol,
    title: projectName || '',
  });
  const memoInstruction = createMemoInstruction(fromPubkey, memoPayload);
  transaction.add(memoInstruction);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  (transaction as unknown as { lastValidBlockHeight: number }).lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}

/**
 * Build & send milestone verification transaction:
 * 1. Memo Program instruction from founder
 */
export async function createMilestoneMemoTransaction(
  connection: Connection,
  founderPubkey: PublicKey,
  projectId: string,
  milestoneId: string,
  milestoneOrder: number,
  proofNote: string
): Promise<Transaction> {
  const transaction = new Transaction();

  const memoPayload = JSON.stringify({
    app: 'backr',
    type: 'milestone',
    project: projectId.trim(),
    milestoneId,
    milestone: milestoneOrder,
    proof: proofNote || '',
  });

  const memoInstruction = createMemoInstruction(founderPubkey, memoPayload);
  transaction.add(memoInstruction);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = founderPubkey;
  (transaction as unknown as { lastValidBlockHeight: number }).lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}
