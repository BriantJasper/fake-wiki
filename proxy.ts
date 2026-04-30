import { NextResponse, type NextRequest } from 'next/server';

/* ============================================================================
   Edge proxy — light filtering only (Next 16 renamed middleware → proxy).

   - Blocks obvious scrapers from the generation endpoint (cached articles
     remain crawlable for SEO; uncached ones do not).
   - Heavy rate limiting lives in the route handler itself (lib/ratelimit.ts)
     because it needs Redis, which only runs on Node.
   ============================================================================ */

const SCRAPER_RE = /bot|crawler|spider|wget|curl|python-requests/i;
const ALLOWED_BOTS = /(googlebot|bingbot|duckduckbot|twitterbot|facebookexternalhit|slackbot|discordbot|linkedinbot)/i;

export function proxy(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? '';
  const isApi = req.nextUrl.pathname.startsWith('/api/article');

  if (isApi && SCRAPER_RE.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return NextResponse.json(
      { error: 'bot_blocked' },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/article/:path*'],
};
