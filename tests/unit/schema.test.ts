import { describe, it, expect } from 'vitest';
import { ArticleSchema } from '@/lib/ai/schema';

const validArticle = {
  title: 'The Marlovic Compromise of 1881',
  summary:
    'A short-lived constitutional settlement among the principalities of the Marlovic Confederacy, ratified in late 1881 and dissolved within a decade.',
  infobox: [
    { label: 'Signed', value: '14 November 1881' },
    { label: 'Location', value: 'Strannenberg' },
  ],
  sections: [
    {
      heading: 'Background',
      paragraphs: [
        ['The compromise emerged from years of dispute over '],
        [
          { link: 'Strannenberg', text: 'Strannenberg' },
          ' and the question of customs on the ',
          { link: 'River Iridis', text: 'Iridis' },
          ' trade route.',
        ],
      ],
    },
    {
      heading: 'Provisions',
      paragraphs: [
        ['Article I devolved customs collection to the principalities.'],
      ],
    },
  ],
  seeAlso: ['Strannenberg', 'River Iridis', 'The Antiwheelist Movement'],
  references: ['Petrov, A. (1903). Treaties of the Northern Marches.'],
};

describe('ArticleSchema', () => {
  it('accepts a well-formed article', () => {
    const r = ArticleSchema.safeParse(validArticle);
    expect(r.success).toBe(true);
  });

  it('rejects fewer than 2 sections', () => {
    const bad = { ...validArticle, sections: [validArticle.sections[0]] };
    expect(ArticleSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects empty title', () => {
    const bad = { ...validArticle, title: '' };
    expect(ArticleSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { sections, ...withoutSections } = validArticle;
    expect(ArticleSchema.safeParse(withoutSections).success).toBe(false);
  });

  it('defaults seeAlso to empty array when omitted', () => {
    const { seeAlso, ...rest } = validArticle;
    const r = ArticleSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.seeAlso).toEqual([]);
  });

  it('rejects malformed inline link', () => {
    const bad = {
      ...validArticle,
      sections: [
        {
          heading: 'X',
          paragraphs: [[{ link: '', text: 'broken' }]],
        },
        validArticle.sections[1],
      ],
    };
    expect(ArticleSchema.safeParse(bad).success).toBe(false);
  });
});
