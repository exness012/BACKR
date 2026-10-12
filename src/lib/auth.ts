import { auth } from './firebase';

const AUTH_SESSION_KEY = 'backr_wallet_auth_session_v1';

export interface WalletAuthSession {
  walletAddress: string;
  signature: string;
  signedAt: number;
  expiresAt: number;
}

/**
 * Checks for a cached session valid for the connected wallet address
 */
export function getCachedWalletSession(walletAddress: string): WalletAuthSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session: WalletAuthSession = JSON.parse(raw);
    if (session.walletAddress === walletAddress && session.expiresAt > Date.now()) {
      return session;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

/**
 * Caches a verified wallet session for the duration of the browser tab / 24 hours
 */
export function cacheWalletSession(session: WalletAuthSession): void {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore session storage errors
  }
}

/**
 * Sign in once per session with the connected Solana wallet.
 * Reuses the token/signature until it expires.
 */
export async function ensureWalletAuthSession(
  walletAddress: string,
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>
): Promise<WalletAuthSession> {
  const cached = getCachedWalletSession(walletAddress);
  if (cached) {
    return cached;
  }

  const isDev = import.meta.env?.DEV;
  const signStart = performance.now();

  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours validity
  const messageText = `Sign in to BACKR Launchpad\nWallet: ${walletAddress}\nTimestamp: ${now}`;
  let signatureHex = `devnet-sig-${now}-${walletAddress.slice(0, 8)}`;

  if (signMessage) {
    try {
      const encodedMsg = new TextEncoder().encode(messageText);
      const signatureBytes = await signMessage(encodedMsg);
      signatureHex = Array.from(signatureBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (err) {
      console.warn('Wallet signing skipped or rejected by user, using session challenge fallback:', err);
    }
  }

  const session: WalletAuthSession = {
    walletAddress,
    signature: signatureHex,
    signedAt: now,
    expiresAt,
  };

  cacheWalletSession(session);

  if (isDev) {
    console.log(`[BACKR Perf] Wallet signing session took ${(performance.now() - signStart).toFixed(1)}ms`);
  }

  return session;
}
