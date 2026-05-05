'use client';

import { useEffect, useState } from 'react';

/* ============================================================================
   Sticky table-of-contents.

   Scans #main h2.section after mount, gives each heading an id if missing,
   and tracks the visible one with IntersectionObserver. Renders nothing when
   no h2.section exists.
   ============================================================================ */

type Item = { id: string; text: string };

function slugifyHeading(text: string, used: Set<string>): string {
  let base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'section';
  let s = base;
  let i = 2;
  while (used.has(s)) s = `${base}-${i++}`;
  used.add(s);
  return s;
}

export function ArticleToc() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const main = document.getElementById('main');
    if (!main) return;
    const headings = Array.from(
      main.querySelectorAll<HTMLHeadingElement>('h2.section'),
    );
    if (headings.length === 0) return;

    const used = new Set<string>();
    const next: Item[] = headings.map((h) => {
      const text = h.textContent?.trim() ?? '';
      if (!h.id) h.id = slugifyHeading(text, used);
      else used.add(h.id);
      return { id: h.id, text };
    });
    setItems(next);
    setActive(next[0]?.id ?? null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="toc" aria-label="On this plate">
      <div className="toc-title">On this plate</div>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={it.id === active ? 'is-active' : ''}>
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${it.id}`);
              }}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
