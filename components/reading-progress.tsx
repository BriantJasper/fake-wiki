'use client';

import { useEffect, useRef, useState } from 'react';

/* ============================================================================
   Thin accent bar pinned to the very top of the viewport. Fills as the
   document scrolls.

   Two paths:
   - When CSS scroll-driven animations are supported (Chromium + recent FF),
     the .scroll-driven class lets CSS do the work — no JS frame loop.
   - Otherwise we fall back to a rAF listener writing --progress on the bar.

   `prefers-reduced-motion` hides the bar entirely (it's pure decoration).
   ============================================================================ */

export function ReadingProgress() {
  const ref = useRef<HTMLSpanElement>(null);
  const [supportsScrollTimeline, setSupports] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mqReduce.matches) return;

    const supported =
      typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');
    setSupports(!!supported);

    if (supported) return;

    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty('--progress', String(p));
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden>
      <span ref={ref} className={supportsScrollTimeline ? 'scroll-driven' : ''} />
    </div>
  );
}
