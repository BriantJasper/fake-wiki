import type { MetadataRoute } from 'next';
import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const revalidate = 3600;

async function fetchArticleEntries() {
  try {
    return await db
      .select({
        slug: schema.articles.slug,
        createdAt: schema.articles.createdAt,
      })
      .from(schema.articles)
      .orderBy(desc(schema.articles.createdAt))
      .limit(5000);
  } catch {
    // Build-time prerender or DB unreachable: ship a sitemap with just the
    // static routes; the next revalidation populates articles.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await fetchArticleEntries();

  const articleEntries: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${SITE_URL}/wiki/${r.slug}`,
    lastModified: r.createdAt,
    changeFrequency: 'never',
    priority: 0.6,
  }));

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    ...articleEntries,
  ];
}
