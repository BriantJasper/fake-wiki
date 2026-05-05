'use client';

import { useEffect, useRef } from 'react';

/* ============================================================================
   Subtle parallax wrapper for the homepage hero title. Translates the inner
   element by up to ~40px as the viewport scrolls. Honors reduced-motion.
   ============================================================================ */

const MAX_PX = 40;

export function ParallaxTitle({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when title at viewport center; +1 fully scrolled away below; -1 above.
      const center = rect.top + rect.height / 2;
      const t = Math.max(-1, Math.min(1, (center - vh / 2) / vh));
      el.style.setProperty('--parallax', `${(-t * MAX_PX).toFixed(2)}px`);
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
    <div ref={ref} className="parallax-title">
      {children}
    </div>
  );
}
