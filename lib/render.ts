import type { Article, Paragraph } from '@/lib/ai/schema';
import { titleToSlug } from './slug';

/* ============================================================================
   Article JSON → HTML.

   Rendered server-side once and cached as articles.contentHtml. The renderer
   is intentionally small: no external HTML libs, deterministic output, no
   client-side JS dependencies. Inline links are rewritten to /wiki/[slug]
   using the same titleToSlug used everywhere else.
   ============================================================================ */

const ENT_RE = /[&<>"']/g;
const ENT_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function esc(s: string): string {
  return s.replace(ENT_RE, (c) => ENT_MAP[c] ?? c);
}

function renderParagraph(p: Paragraph): string {
  const parts: string[] = [];
  for (const item of p) {
    if (typeof item === 'string') {
      parts.push(esc(item));
    } else {
      const slug = titleToSlug(item.link);
      if (!slug) {
        parts.push(esc(item.text));
        continue;
      }
      parts.push(
        `<a class="ink-link" href="/wiki/${esc(slug)}" data-link-title="${esc(item.link)}">${esc(item.text)}</a>`,
      );
    }
  }
  return `<p>${parts.join('')}</p>`;
}

export function renderArticleHtml(article: Article): string {
  const out: string[] = [];
  out.push(`<header><h1 class="title">${esc(article.title)}</h1></header>`);
  out.push(`<p class="lead">${esc(article.summary)}</p>`);
  for (const section of article.sections) {
    out.push(`<section>`);
    out.push(`<h2 class="section">${esc(section.heading)}</h2>`);
    for (const para of section.paragraphs) {
      out.push(renderParagraph(para));
    }
    out.push(`</section>`);
  }
  if (article.seeAlso.length) {
    out.push(`<aside class="see-also">`);
    out.push(`<h2 class="section">See also</h2><ul>`);
    for (const title of article.seeAlso) {
      const slug = titleToSlug(title);
      if (!slug) continue;
      out.push(
        `<li><a class="ink-link" href="/wiki/${esc(slug)}">${esc(title)}</a></li>`,
      );
    }
    out.push(`</ul></aside>`);
  }
  if (article.references && article.references.length) {
    out.push(`<aside class="references">`);
    out.push(`<h2 class="section">References</h2><ol>`);
    for (const ref of article.references) {
      out.push(`<li>${esc(ref)}</li>`);
    }
    out.push(`</ol></aside>`);
  }
  return out.join('\n');
}
