'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ============================================================================
   Keyboard help overlay (?).

   Also implements the "g <key>" leader sequences for navigation:
     g h → /
     g r → /random
     g a → /about
   ============================================================================ */

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['⌘ / Ctrl', 'K'], label: 'Open the command palette' },
  { keys: ['?'], label: 'Show this help' },
  { keys: ['G', 'H'], label: 'Go home' },
  { keys: ['G', 'R'], label: 'Open a random plate' },
  { keys: ['G', 'A'], label: 'About the Atlas' },
  { keys: ['Esc'], label: 'Close any overlay' },
];

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function ShortcutsOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let leader = false;
    let leaderTimer: ReturnType<typeof setTimeout> | null = null;

    const clearLeader = () => {
      leader = false;
      if (leaderTimer) {
        clearTimeout(leaderTimer);
        leaderTimer = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape' && open) {
        setOpen(false);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        leader = true;
        if (leaderTimer) clearTimeout(leaderTimer);
        leaderTimer = setTimeout(clearLeader, 1100);
        return;
      }
      if (leader) {
        const k = e.key.toLowerCase();
        if (k === 'h') router.push('/');
        else if (k === 'r') router.push('/random');
        else if (k === 'a') router.push('/about');
        clearLeader();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (leaderTimer) clearTimeout(leaderTimer);
    };
  }, [open, router]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="modal-panel" style={{ padding: '1.4rem 1.5rem' }}>
        <div className="margin-note" style={{ color: 'var(--accent)', marginBottom: '0.8rem' }}>
          Keyboard shortcuts
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.7rem' }}>
          {SHORTCUTS.map((s, i) => (
            <li
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.95rem',
              }}
            >
              <span>{s.label}</span>
              <span style={{ display: 'inline-flex', gap: '0.3rem' }}>
                {s.keys.map((k, j) => (
                  <span key={j} className="kbd">
                    {k}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="modal-footer" style={{ marginTop: '1.1rem', borderTop: 'none', padding: 0 }}>
          <span>Press <span className="kbd">?</span> any time to reopen</span>
          <span><span className="kbd">Esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
