import type { Article, InlineLink, Paragraph } from '@/lib/ai/schema';
import { titleToSlug } from './slug';

/* ----------------------------------------------------------------------------
   Some providers (notably the Groq json_object path) occasionally inline link
   objects into paragraph *strings* rather than emitting them as separate array
   elements. The string then contains a literal {"link":"...","text":"..."}
   substring that the renderer would otherwise escape and show as JSON to the
   reader. expandEmbeddedLinks walks a string and splits any well-formed
   embedded link objects back out into proper InlineLink elements.
   ---------------------------------------------------------------------------- */

function findBalancedJsonEnd(s: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function expandEmbeddedLinks(text: string): (string | InlineLink)[] {
  if (!text.includes('{"link"') && !text.includes("{'link'")) return [text];

  const out: (string | InlineLink)[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('{"link"', cursor);
    if (start === -1) {
      if (cursor < text.length) out.push(text.slice(cursor));
      break;
    }
    const end = findBalancedJsonEnd(text, start);
    if (end === -1) {
      out.push(text.slice(cursor));
      break;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      out.push(text.slice(cursor, start + 1));
      cursor = start + 1;
      continue;
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { link?: unknown }).link === 'string' &&
      typeof (parsed as { text?: unknown }).text === 'string'
    ) {
      if (start > cursor) out.push(text.slice(cursor, start));
      const { link, text: linkText } = parsed as { link: string; text: string };
      out.push({ link, text: linkText });
      cursor = end + 1;
    } else {
      out.push(text.slice(cursor, start + 1));
      cursor = start + 1;
    }
  }
  return out.filter((p) => typeof p !== 'string' || p.length > 0);
}

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
