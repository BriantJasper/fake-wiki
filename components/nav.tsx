'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Atlas of Nowhere';

function isMac() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function dispatchPalette() {
  window.dispatchEvent(new CustomEvent('atlas:palette'));
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mod, setMod] = useState('Ctrl');

  useEffect(() => {
    setMod(isMac() ? '⌘' : 'Ctrl');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1280px',
          margin: '0 auto',
          gap: '1rem',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
        >
          {SITE_NAME}
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          <button
            type="button"
            onClick={dispatchPalette}
            aria-label="Open command palette"
            className="theme-toggle"
            style={{ borderRadius: '4px' }}
          >
            <span style={{ opacity: 0.7 }}>Search</span>
            <span className="kbd" style={{ marginLeft: '0.2rem' }}>{mod}K</span>
          </button>
          <Link
            href="/random"
            prefetch={false}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Random
          </Link>
          <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
            About
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
