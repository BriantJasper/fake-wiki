import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';

export const revalidate = 60;

export async function GET() {
  try {
    const rows = await db
      .select({
        slug: schema.articles.slug,
        title: schema.articles.title,
        summary: schema.articles.summary,
        hits: schema.articles.hits,
      })
      .from(schema.articles)
      .orderBy(desc(schema.articles.hits))
      .limit(200);

    return NextResponse.json(
      { articles: rows },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
