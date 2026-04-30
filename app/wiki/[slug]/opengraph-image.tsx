import { ImageResponse } from 'next/og';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { plateNumber } from '@/lib/design/plate-number';
import { slugToTitle } from '@/lib/slug';

export const runtime = 'nodejs';
export const alt = 'An entry in the Atlas of Nowhere';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Atlas of Nowhere';

const PAPER = '#f6f1e3';
const INK = '#1c1611';
const INK_SOFT = '#5a5048';
const ACCENT = '#9a3a1a';
const RULE = '#d6cdb8';

export default async function OG({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await db
    .select({
      title: schema.articles.title,
      summary: schema.articles.summary,
    })
    .from(schema.articles)
    .where(eq(schema.articles.slug, slug))
    .limit(1)
    .catch(() => []);

  const title = row[0]?.title ?? slugToTitle(slug);
  const summary =
    row[0]?.summary ??
    'A fictional entry. Open the plate to read its transcription.';
  const plate = plateNumber(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: PAPER,
          color: INK,
          padding: '64px 72px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: 'monospace',
            fontSize: 22,
            color: ACCENT,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          <span>{SITE_NAME}</span>
          <span>Plate {plate}</span>
        </div>

        <div
          style={{
            marginTop: 28,
            height: 1,
            background: RULE,
            display: 'flex',
          }}
        />

        <div
          style={{
            marginTop: 48,
            fontSize: title.length > 70 ? 60 : 78,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            fontWeight: 500,
            display: 'flex',
            color: INK,
            maxWidth: '95%',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 28,
            lineHeight: 1.4,
            color: INK_SOFT,
            display: 'flex',
            maxWidth: '90%',
            // ImageResponse doesn't support -webkit-line-clamp; trim manually:
          }}
        >
          {summary.length > 220 ? summary.slice(0, 217) + '…' : summary}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: 'monospace',
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          <span>An encyclopedia of things that don't exist</span>
          <span style={{ color: ACCENT }}>● Fictional</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
