'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ============================================================================
   Renders pre-rendered article HTML from the server. Intercepts clicks on
   inline links so navigation between fictional articles uses Next's client
   router (instant transitions, scroll restored).

   The server pre-renders to HTML for SEO/SSR speed; this component just
   adopts that HTML and wires up navigation.
   ============================================================================ */

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
      // typedRoutes can't statically check a runtime href; the click handler
      // only fires for /wiki/[slug] anchors which are valid app routes.
      router.push(link.getAttribute('href') as never);
    }
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [router]);

  return (
    <div
      ref={ref}
      className="article-body"
      // The HTML is server-rendered from validated Article JSON, never raw
      // model output. esc() in lib/render.ts handles the escaping.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
