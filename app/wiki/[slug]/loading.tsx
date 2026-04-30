export default function Loading() {
  return (
    <div className="article-grid">
      <div className="article-margin" aria-hidden>
        Loading…
      </div>
      <article style={{ minWidth: 0 }}>
        <div className="skeleton" style={{ height: '2.4rem', width: '70%', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '92%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '85%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '88%', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '1.4rem', width: '40%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '90%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '94%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
      </article>
      <aside className="article-aside" aria-hidden />
    </div>
  );
}
