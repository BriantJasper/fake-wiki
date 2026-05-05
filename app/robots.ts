import type { MetadataRoute } from 'next';
import { getSiteUrlStatic } from '@/lib/site-url';

const SITE_URL = getSiteUrlStatic();

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
