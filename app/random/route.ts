import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { generateRandomTitle } from '@/lib/ai/router';
import { isValidSlug, titleToSlug } from '@/lib/slug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Random article. Strategy:
 *   - 60% existing slug (re-reading is good; the Atlas should feel populated)
 *   - 40% brand-new title (drives generation, keeps the archive growing)
 *
 * On a fresh DB the existing-slug branch always misses, and we fall through
 * to a fresh title.
 */
export async function GET() {
  const goExisting = Math.random() < 0.6;

  if (goExisting) {
    const existing = await db
      .select({ slug: schema.articles.slug })
      .from(schema.articles)
      .orderBy(sql`random()`)
      .limit(1)
      .catch(() => []);
    if (existing[0]?.slug) {
      return NextResponse.redirect(new URL(`/wiki/${existing[0].slug}`, SITE_URL));
    }
  }

  // Fall through: invent a fresh title.
  let title: string;
  try {
    title = await generateRandomTitle();
  } catch {
    title = 'Untitled Plate';
  }
  const slug = titleToSlug(title);
  if (!isValidSlug(slug)) {
    return NextResponse.redirect(new URL('/', SITE_URL));
  }
  return NextResponse.redirect(new URL(`/wiki/${slug}`, SITE_URL));
}
