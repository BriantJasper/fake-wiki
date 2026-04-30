/* ============================================================================
   Deterministic plate number from a slug.

   Every article displays a "Plate CCCXIV" style identifier. The number is
   derived from the slug hash so the same article always carries the same
   plate, but distribution feels random across the encyclopedia.
   ============================================================================ */

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function toRoman(n: number): string {
  let out = '';
  let remaining = n;
  for (const [value, numeral] of ROMAN) {
    while (remaining >= value) {
      out += numeral;
      remaining -= value;
    }
  }
  return out;
}

/**
 * Plate number in the range I..MMMCMXCIX (1..3999).
 * Stable for a given slug.
 */
export function plateNumber(slug: string): string {
  const n = (fnv1a(slug) % 3999) + 1;
  return toRoman(n);
}
