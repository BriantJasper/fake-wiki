import { headers } from 'next/headers';

/**
 * Resolve the canonical site URL at request time.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL env var (if set to something other than localhost)
 *   2. Vercel's auto-set VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL
 *   3. The Host header from the incoming request
 *   4. Fallback to localhost:3000 for local dev
 */
export async function getSiteUrl(): Promise<string> {
  // 1. Explicit env var (skip if it still contains localhost)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Vercel auto-populated vars
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  // 3. Derive from the request's Host header
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? 'https';
      return `${proto}://${host}`;
    }
  } catch {
    // headers() not available (e.g. during build / static generation)
  }

  // 4. Local dev fallback
  return 'http://localhost:3000';
}

/**
 * Build-safe variant that doesn't call headers() — suitable for contexts
 * where dynamic request info is unavailable (sitemap, robots, static metadata).
 */
export function getSiteUrlStatic(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return 'http://localhost:3000';
}
