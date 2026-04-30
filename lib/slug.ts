/* ============================================================================
   Slug ↔ title.

   A slug is the URL key for an article. Two articles with the same slug are
   the same article: this is what makes the encyclopedia internally consistent.

   Rules:
   - Lowercase, ASCII only (Unicode is decomposed and stripped of marks).
   - Words separated by single hyphens.
   - Number ordering preserved ("1893 Belgian Sock Riots" → "1893-belgian-sock-riots").
   - Capped at 100 chars; truncated at a word boundary.
   - Empty / no-letter input is rejected.
   ============================================================================ */

const MAX_SLUG_LEN = 100;
const COMBINING_MARKS = /[̀-ͯ]/g;

export function titleToSlug(title: string): string {
  const decomposed = title.normalize('NFKD').replace(COMBINING_MARKS, '');
  const ascii = decomposed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!ascii) return '';

  if (ascii.length <= MAX_SLUG_LEN) return ascii;

  const cut = ascii.slice(0, MAX_SLUG_LEN);
  const lastHyphen = cut.lastIndexOf('-');
  return lastHyphen > 40 ? cut.slice(0, lastHyphen) : cut;
}

/**
 * A lightweight reverse: humanize a slug for display when the original title
 * has been lost. Does not attempt to restore casing accurately.
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => (part[0]?.toUpperCase() ?? '') + part.slice(1))
    .join(' ');
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= MAX_SLUG_LEN;
}
