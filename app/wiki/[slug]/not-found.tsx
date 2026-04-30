import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="read-col" style={{ paddingBlock: '6rem 4rem' }}>
      <p className="margin-note" style={{ color: 'var(--accent)' }}>
        Plate not in the index
      </p>
      <h1 className="title" style={{ fontSize: '2.4rem', marginTop: '0.5rem' }}>
        That title cannot be a plate.
      </h1>
      <p style={{ marginTop: '1.5rem', color: 'var(--ink-soft)' }}>
        Article titles must contain at least one letter or digit. Try opening a
        random plate, or start the Atlas from the title page.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Link href="/random" prefetch={false} className="ink-link">
          Open a random plate
        </Link>
        <Link href="/" className="ink-link">
          Title page
        </Link>
      </div>
    </div>
  );
}
