'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { plateNumber } from '@/lib/design/plate-number';
import { titleToSlug } from '@/lib/slug';

/* ============================================================================
   ⌘K / Ctrl+K command palette.

   Opens via keyboard shortcut OR a CustomEvent('atlas:palette') so the nav
   button can dispatch from anywhere. Lazy-loads /api/slugs on first open.

   Empty query: top hits. Non-empty: case-insensitive substring match on
   title, capped at 30 results. ⏎ on no match attempts to write a brand-new
   plate at /wiki/<slugified query>.
   ============================================================================ */

type Article = { slug: string; title: string; summary: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Article[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  // Global open: ⌘K / Ctrl+K, plus a custom event from the nav button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        close();
      }
    };
    const onEvt = () => setOpen((o) => !o);
    window.addEventListener('keydown', onKey);
    window.addEventListener('atlas:palette', onEvt as EventListener);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('atlas:palette', onEvt as EventListener);
    };
  }, [open, close]);

  // Lazy fetch on first open.
  useEffect(() => {
    if (!open || items !== null) return;
    let cancelled = false;
    fetch('/api/slugs')
      .then((r) => r.json())
      .then((data: { articles?: Article[] }) => {
        if (!cancelled) setItems(data.articles ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  // Focus input on open.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const list = (items ?? [])
    .filter((a) => !q || a.title.toLowerCase().includes(q))
    .slice(0, 30);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(list.length, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = list[active];
      if (target) {
        router.push(`/wiki/${target.slug}` as never);
        close();
      } else if (q) {
        const slug = titleToSlug(query);
        if (slug) {
          router.push(`/wiki/${slug}` as never);
          close();
        }
      }
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Search the Atlas"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="modal-panel">
        <input
          ref={inputRef}
          className="modal-input"
          placeholder="Search the Atlas, or write a new plate…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          spellCheck={false}
          autoComplete="off"
        />
        <ul className="modal-list" role="listbox">
          {items === null ? (
            <li style={{ padding: '0.9rem 1.2rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              Loading the index…
            </li>
          ) : list.length === 0 ? (
            <li style={{ padding: '0.9rem 1.2rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              {q
                ? <>No plate matches. Press <span className="kbd">↵</span> to write &ldquo;{query}&rdquo; into being.</>
                : 'The archive is empty. Open a random plate to begin.'}
            </li>
          ) : (
            list.map((a, i) => (
              <li
                key={a.slug}
                className={i === active ? 'is-active' : ''}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
              >
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/wiki/${a.slug}` as never);
                    close();
                  }}
                >
                  <span className="result-plate">Pl. {plateNumber(a.slug)}</span>
                  <span className="result-title">{a.title}</span>
                  {a.summary && <span className="result-summary">{a.summary}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="modal-footer">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> open · <span className="kbd">Esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
