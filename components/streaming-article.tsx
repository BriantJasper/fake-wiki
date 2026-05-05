'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ============================================================================
   Cache-miss client component.

   Opens an SSE connection to /api/article/[slug], shows live status while
   the article is written, then refreshes the route so the now-cached server
   component renders the final article.

   We intentionally do not try to parse and render partial JSON — the article
   structure is too irregular (links, nested paragraphs) for naive incremental
   rendering. The "writing…" state is honest and reads as the encyclopedia
   actually being typeset. Total wait: ~10–25s.
   ============================================================================ */

type State =
  | { kind: 'connecting' }
  | { kind: 'writing'; status: string; tokens: number }
  | { kind: 'persisting' }
  | { kind: 'error'; message: string }
  | { kind: 'done' };

export function StreamingArticle({
  slug,
  parentSlug,
}: {
  slug: string;
  parentSlug?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'connecting' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState({ kind: 'connecting' });
    const url = parentSlug
      ? `/api/article/${slug}?parent=${encodeURIComponent(parentSlug)}`
      : `/api/article/${slug}`;
    const source = new EventSource(url);
    let tokens = 0;

    source.addEventListener('status', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setState({ kind: 'writing', status: data.message ?? 'Writing…', tokens });
    });

    source.addEventListener('partial', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      tokens = data.rawJson?.length ?? tokens;
      setState((prev) =>
        prev.kind === 'writing' ? { ...prev, tokens } : { kind: 'writing', status: 'Writing…', tokens },
      );
    });

    source.addEventListener('done', () => {
      setState({ kind: 'persisting' });
    });

    source.addEventListener('persisted', () => {
      setState({ kind: 'done' });
      source.close();
      router.refresh();
    });

    source.addEventListener('error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data ?? '{}');
        setState({ kind: 'error', message: data.message ?? 'The Atlas could not transcribe this plate.' });
      } catch {
        setState({ kind: 'error', message: 'Connection to the archive was lost.' });
      }
      source.close();
    });

    return () => source.close();
  }, [slug, parentSlug, router, attempt]);

  if (state.kind === 'error') {
    return (
      <div style={{ padding: '2rem 0' }}>
        <h1 className="title" style={{ fontSize: '2rem' }}>
          The plate could not be transcribed.
        </h1>
        <p style={{ marginTop: '1rem', color: 'var(--ink-soft)' }}>{state.message}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="ink-link"
          style={{
            marginTop: '1.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            padding: 0,
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" style={{ paddingBlock: '1rem' }}>
      <h1 className="title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
        <span className="skeleton" style={{ display: 'inline-block', width: '70%', height: '0.9em' }} />
      </h1>
      <p
        className="margin-note"
        style={{ marginTop: '1.25rem', color: 'var(--accent)' }}
      >
        {state.kind === 'connecting' && 'Opening the archive…'}
        {state.kind === 'writing' && state.status}
        {state.kind === 'persisting' && 'Binding the plate…'}
        {state.kind === 'done' && 'Transmitting…'}
      </p>
      <div style={{ marginTop: '2rem' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: '1rem',
              width: `${75 + ((i * 7) % 20)}%`,
              marginBottom: '0.6rem',
            }}
          />
        ))}
      </div>
      <p
        className="margin-note"
        style={{ marginTop: '2rem', color: 'var(--ink-soft)' }}
      >
        First transcription. The plate will load instantly for every later visitor.
      </p>
    </div>
  );
}
