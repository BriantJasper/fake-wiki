'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ============================================================================
   Renders pre-rendered article HTML from the server. Intercepts clicks on
   inline links so navigation between fictional articles uses Next's client
   router (instant transitions, scroll restored).

   Tags top-level block children with the .reveal class so the global
   ScrollReveal observer (mounted in app/layout.tsx) animates them in as
   they enter the viewport.
   ============================================================================ */

const REVEAL_SELECTOR = ':scope > h1, :scope > h2, :scope > h3, :scope > p, :scope > ul, :scope > ol, :scope > blockquote, :scope > figure, :scope > aside, :scope > section';

export function ArticleView({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest('a[href^="/wiki/"]') as HTMLAnchorElement | null;
      if (!link) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      router.push(link.getAttribute('href') as never);
    }
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [router]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => el.classList.add('reveal'));
  }, [html]);

  return (
    <div
      ref={ref}
      className="article-body vt-article"
      // The HTML is server-rendered from validated Article JSON, never raw
      // model output. esc() in lib/render.ts handles the escaping.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
