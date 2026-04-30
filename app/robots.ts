import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/wiki/', '/about'],
        // Random and the SSE endpoint should not be crawled — they trigger
        // generation and cost real money. Cached articles indexed via /wiki/.
        disallow: ['/api/', '/random'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
