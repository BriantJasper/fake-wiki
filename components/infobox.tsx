import type { Article } from '@/lib/ai/schema';

export function Infobox({ article }: { article: Article }) {
  const rows = article.infobox ?? [];
  if (rows.length === 0) return null;
  return (
    <aside className="infobox" aria-label={`${article.title} — at a glance`}>
      <div className="infobox-title">{article.title}</div>
      <dl style={{ margin: 0 }}>
        {rows.map((row, i) => (
          <div key={i}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
