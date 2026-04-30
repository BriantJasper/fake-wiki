import Link from 'next/link';
import { db, schema } from '@/lib/db/client';
import { desc } from 'drizzle-orm';
import { plateNumber } from '@/lib/design/plate-number';
import { AsterismRule } from '@/components/asterism-rule';

export const revalidate = 60;

async function fetchFeatured() {
  try {
    return await db
      .select({
        slug: schema.articles.slug,
        title: schema.articles.title,
        summary: schema.articles.summary,
        hits: schema.articles.hits,
      })
      .from(schema.articles)
      .orderBy(desc(schema.articles.hits))
      .limit(8);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await fetchFeatured();

  return (
    <div className="article-grid">
      <div className="article-margin" aria-hidden>
        Vol. I
        <br />
        Edition&nbsp;I
      </div>

      <article style={{ minWidth: 0 }}>
        <header style={{ marginBottom: '3rem' }}>
          <p
            className="margin-note"
            style={{ marginBottom: '1rem', color: 'var(--accent)' }}
          >
            The Atlas of Nowhere
          </p>
          <h1
            className="display"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            An encyclopedia
            <br />
            of things that
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>do not exist.</em>
          </h1>
          <p style={{ marginTop: '2rem', maxWidth: '52ch', color: 'var(--ink-soft)' }}>
            Every entry below is fictional, written by a language model in the steady,
            scholarly voice of a serious reference work. Click any link inside an article
            and the entry it points to will be written into being. The Atlas grows with
            each visitor.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <Link
              href="/random"
              prefetch={false}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.7rem 1.2rem',
                background: 'var(--accent)',
                color: 'var(--paper)',
                textDecoration: 'none',
                border: '1px solid var(--accent)',
              }}
            >
              Open a random plate →
            </Link>
            <Link
              href="/about"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.7rem 1.2rem',
                color: 'var(--ink)',
                textDecoration: 'none',
                border: '1px solid var(--rule)',
              }}
            >
              About the Atlas
            </Link>
          </div>
        </header>

        <AsterismRule />

        <section>
          <h2 className="section" style={{ marginTop: 0 }}>
            Recently consulted
          </h2>
          {featured.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>
              The volumes are still being typeset. Open a random plate to begin the Atlas.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1.5rem' }}>
              {featured.map((a) => (
                <li
                  key={a.slug}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '1.5rem',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    className="plate-number"
                    style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                  >
                    Pl. {plateNumber(a.slug)}
                  </span>
                  <div>
                    <Link
                      href={`/wiki/${a.slug}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.25rem',
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      {a.title}
                    </Link>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        color: 'var(--ink-soft)',
                        fontSize: '0.95rem',
                      }}
                    >
                      {a.summary}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <aside className="article-aside" aria-hidden>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            lineHeight: 1.7,
          }}
        >
          Editor's note —<br />
          Entries are generated by a language model on first request and persisted to the
          archive. The Atlas thus appears to remember things it never knew. Treat
          accordingly.
        </p>
      </aside>
    </div>
  );
}
