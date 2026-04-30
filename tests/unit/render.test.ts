import { describe, it, expect } from 'vitest';
import { renderArticleHtml } from '@/lib/render';
import type { Article } from '@/lib/ai/schema';

const sampleArticle: Article = {
  title: 'The Marlovic Compromise of 1881',
  summary: 'A short-lived constitutional settlement.',
  sections: [
    {
      heading: 'Background',
      paragraphs: [
        ['The compromise emerged from disputes over '],
        [
          { link: 'Strannenberg', text: 'Strannenberg' },
          ' and the river.',
        ],
      ],
    },
    {
      heading: 'Provisions',
      paragraphs: [['Article I.']],
    },
  ],
  seeAlso: ['Strannenberg', 'River Iridis'],
};

describe('renderArticleHtml', () => {
  const html = renderArticleHtml(sampleArticle);

  it('emits the title', () => {
    expect(html).toContain('The Marlovic Compromise of 1881');
  });

  it('rewrites inline links to /wiki/[slug]', () => {
    expect(html).toContain('href="/wiki/strannenberg"');
  });

  it('escapes HTML in plain text', () => {
    const a: Article = {
      ...sampleArticle,
      sections: [
        {
          heading: '<script>',
          paragraphs: [['<script>alert(1)</script>']],
        },
        sampleArticle.sections[1],
      ],
    };
    const out = renderArticleHtml(a);
    expect(out).not.toContain('<script>alert');
    expect(out).toContain('&lt;script&gt;');
  });

  it('emits a See also section with valid links', () => {
    expect(html).toContain('See also');
    expect(html).toContain('href="/wiki/river-iridis"');
  });
});
