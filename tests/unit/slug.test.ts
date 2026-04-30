import { describe, it, expect } from 'vitest';
import { titleToSlug, slugToTitle, isValidSlug } from '@/lib/slug';

describe('titleToSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(titleToSlug('Belgian Sock Riots')).toBe('belgian-sock-riots');
  });

  it('preserves leading numbers', () => {
    expect(titleToSlug('1893 Belgian Sock Riots')).toBe('1893-belgian-sock-riots');
  });

  it('strips diacritics', () => {
    expect(titleToSlug('Café Königsberg')).toBe('cafe-konigsberg');
  });

  it('collapses repeated punctuation', () => {
    expect(titleToSlug("Tlön, Uqbar — Orbis Tertius")).toBe('tlon-uqbar-orbis-tertius');
  });

  it('strips leading and trailing hyphens', () => {
    expect(titleToSlug('  --foo  --')).toBe('foo');
  });

  it('returns empty string for letterless input', () => {
    expect(titleToSlug('!!!---!!!')).toBe('');
    expect(titleToSlug('')).toBe('');
  });

  it('truncates long titles at a word boundary', () => {
    const long = 'a'.repeat(60) + ' ' + 'b'.repeat(60);
    const out = titleToSlug(long);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith('-')).toBe(false);
  });
});

describe('isValidSlug', () => {
  it('accepts canonical slugs', () => {
    expect(isValidSlug('belgian-sock-riots')).toBe(true);
    expect(isValidSlug('1893-belgian-sock-riots')).toBe(true);
    expect(isValidSlug('a')).toBe(true);
  });

  it('rejects bad shapes', () => {
    expect(isValidSlug('Has Capital')).toBe(false);
    expect(isValidSlug('-leading')).toBe(false);
    expect(isValidSlug('trailing-')).toBe(false);
    expect(isValidSlug('double--hyphen')).toBe(false);
    expect(isValidSlug('with space')).toBe(false);
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('a'.repeat(101))).toBe(false);
  });
});

describe('slugToTitle', () => {
  it('humanizes hyphenated slugs', () => {
    expect(slugToTitle('belgian-sock-riots')).toBe('Belgian Sock Riots');
  });
});
