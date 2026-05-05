'use client';

import { useEffect } from 'react';

/* ============================================================================
   Global reveal-on-scroll observer.

   Watches the document for elements with class `.reveal` (current and
   future, via MutationObserver) and toggles `.is-visible` when they enter
   the viewport. Each element is unobserved after first reveal.

   Reduced-motion users: globals.css forces .reveal to opacity:1 / no
   transform, so this component skips wiring the observer entirely.
   ============================================================================ */

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );

    const observe = (el: Element) => {
      if (!el.classList.contains('is-visible')) io.observe(el);
    };

    document.querySelectorAll('.reveal').forEach(observe);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const el = n as Element;
          if (el.classList?.contains('reveal')) observe(el);
          el.querySelectorAll?.('.reveal').forEach(observe);
        });
        if (m.type === 'attributes' && m.target.nodeType === 1) {
          const el = m.target as Element;
          if (el.classList.contains('reveal') && !el.classList.contains('is-visible')) {
            observe(el);
          }
        }
      }
    });
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
