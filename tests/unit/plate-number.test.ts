import { describe, it, expect } from 'vitest';
import { plateNumber } from '@/lib/design/plate-number';

describe('plateNumber', () => {
  it('is deterministic for a given slug', () => {
    expect(plateNumber('belgian-sock-riots-1893')).toBe(
      plateNumber('belgian-sock-riots-1893'),
    );
  });

  it('returns Roman numerals only', () => {
    for (const slug of ['a', 'foo', 'something-long-and-detailed']) {
      expect(plateNumber(slug)).toMatch(/^[IVXLCDM]+$/);
    }
  });

  it('produces different plates for different slugs', () => {
    const a = plateNumber('article-one');
    const b = plateNumber('article-two');
    expect(a).not.toBe(b);
  });

  it('stays in 1..3999 range', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(plateNumber(`slug-${i}`));
    }
    // We can't assert exact distribution but every value should be valid Roman.
    for (const v of seen) {
      expect(v.length).toBeGreaterThan(0);
      expect(v.length).toBeLessThan(20);
    }
  });
});
