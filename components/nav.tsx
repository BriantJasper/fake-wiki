import Link from 'next/link';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Atlas of Nowhere';

export function Nav() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--rule)',
        padding: '0.9rem var(--gutter)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
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
        <nav
          style={{
            display: 'flex',
            gap: '1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          <Link href="/random" prefetch={false} style={{ color: 'inherit', textDecoration: 'none' }}>
            Random plate
          </Link>
          <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
