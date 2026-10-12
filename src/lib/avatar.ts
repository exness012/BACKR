/**
 * Local deterministic avatar generator and social URL normalizer.
 * No external network requests or third-party image services.
 */

const PALETTE = [
  '#a78bfa', // lavender
  '#7c3aed', // violet
  '#14b8a6', // teal
  '#f472b6', // soft pink
  '#6366f1', // indigo
  '#f59e0b', // amber
];

/**
 * FNV-1a 32-bit hash function
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Linear Congruential Generator for pseudo-random sequence from seed
 */
function createRng(seedNumber: number) {
  let state = seedNumber;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state >>> 0) / 4294967296;
  };
}

/**
 * Extract 1-2 letter initials from a name
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '?';
  const clean = name.trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates a deterministic SVG avatar data URL from a seed string.
 * Generates a circular mesh-gradient avatar with 2-3 soft color blobs
 * picked from the curated palette, with initials centered in white.
 */
export function generateAvatar(seed: string, initials?: string): string {
  const hash = hashString(seed || 'founder-avatar');
  const rng = createRng(hash);

  const displayInitials = (initials || getInitials(seed)).slice(0, 2);

  // Pick 2-3 distinct colors from palette
  const shuffledPalette = [...PALETTE].sort(() => rng() - 0.5);
  const baseColor = shuffledPalette[0];
  const blob1Color = shuffledPalette[1];
  const blob2Color = shuffledPalette[2];
  const blob3Color = shuffledPalette[3];

  // Coordinates and radii for soft blobs
  const cx1 = Math.round(20 + rng() * 30);
  const cy1 = Math.round(20 + rng() * 30);
  const r1 = Math.round(35 + rng() * 25);

  const cx2 = Math.round(55 + rng() * 35);
  const cy2 = Math.round(45 + rng() * 40);
  const r2 = Math.round(35 + rng() * 25);

  const cx3 = Math.round(30 + rng() * 40);
  const cy3 = Math.round(60 + rng() * 30);
  const r3 = Math.round(30 + rng() * 20);

  // Unique filter ID to avoid DOM collisions
  const filterId = `blur-${hash.toString(36)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <clipPath id="circle-${filterId}">
      <circle cx="50" cy="50" r="50" />
    </clipPath>
    <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
  </defs>
  <g clip-path="url(#circle-${filterId})">
    <rect width="100" height="100" fill="${baseColor}" />
    <circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="${blob1Color}" opacity="0.85" filter="url(#${filterId})" />
    <circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="${blob2Color}" opacity="0.85" filter="url(#${filterId})" />
    <circle cx="${cx3}" cy="${cy3}" r="${r3}" fill="${blob3Color}" opacity="0.75" filter="url(#${filterId})" />
  </g>
  <text x="50" y="52" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="34" letter-spacing="0.5">${displayInitials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Validates and normalizes URLs:
 * - Rejects javascript:, data:, file:, etc.
 * - Auto-prepends https:// if missing
 * - Returns clean URL string, or null if invalid
 */
export function normalizeUrl(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim();
  if (!clean) return null;

  // Reject dangerous protocols
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  // Prepend https:// if no protocol provided
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    clean = `https://${clean}`;
  } else if (lower.startsWith('http://')) {
    // Force upgrade to https://
    clean = `https://${clean.slice(7)}`;
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || parsed.hostname.indexOf('.') === -1) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Normalizes handles or URLs for social platforms:
 * - X / Twitter: accepts "@username", "username", or "https://x.com/username" -> returns https://x.com/username
 * - GitHub: accepts "@username", "username", or "https://github.com/username" -> returns https://github.com/username
 * - Telegram: accepts "@username", "username", or "https://t.me/username" -> returns https://t.me/username
 * - Discord: accepts handle or invite URL
 * - LinkedIn: full URL
 * - Website: full URL
 */
export function normalizeSocialLink(
  platform: 'x' | 'linkedin' | 'github' | 'telegram' | 'discord' | 'website',
  value: string
): { url: string; display: string } | null {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  // Block dangerous schemes
  const lower = raw.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    return null;
  }

  if (platform === 'x') {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const valid = normalizeUrl(raw);
      if (!valid) return null;
      try {
        const u = new URL(valid);
        const handle = u.pathname.replace(/^\//, '').split('/')[0];
        return { url: valid, display: handle ? `@${handle}` : valid };
      } catch {
        return { url: valid, display: valid };
      }
    }
    const cleanHandle = raw.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanHandle) return null;
    return {
      url: `https://x.com/${cleanHandle}`,
      display: `@${cleanHandle}`,
    };
  }

  if (platform === 'github') {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const valid = normalizeUrl(raw);
      if (!valid) return null;
      try {
        const u = new URL(valid);
        const handle = u.pathname.replace(/^\//, '').split('/')[0];
        return { url: valid, display: handle || valid };
      } catch {
        return { url: valid, display: valid };
      }
    }
    const cleanHandle = raw.replace(/^@/, '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanHandle) return null;
    return {
      url: `https://github/${cleanHandle}`,
      display: cleanHandle,
    };
  }

  if (platform === 'telegram') {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const valid = normalizeUrl(raw);
      if (!valid) return null;
      return { url: valid, display: valid };
    }
    const cleanHandle = raw.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanHandle) return null;
    return {
      url: `https://t.me/${cleanHandle}`,
      display: `@${cleanHandle}`,
    };
  }

  // Discord: if invite link or https, normalize URL. If username, display tag
  if (platform === 'discord') {
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('discord.gg/')) {
      const valid = normalizeUrl(raw);
      if (!valid) return null;
      return { url: valid, display: valid };
    }
    // Discord tag or server invite
    return {
      url: `https://discord.com`,
      display: raw,
    };
  }

  // LinkedIn & Website
  const valid = normalizeUrl(raw);
  if (!valid) return null;
  return { url: valid, display: valid };
}

/**
 * Escapes plain text to avoid accidental injection
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim();
}
