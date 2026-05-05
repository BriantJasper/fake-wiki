import { describe, it, expect } from 'vitest';
import { renderArticleHtml, expandEmbeddedLinks } from '@/lib/render';
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

describe('expandEmbeddedLinks', () => {
  it('returns plain strings unchanged', () => {
    expect(expandEmbeddedLinks('just text')).toEqual(['just text']);
  });

  it('splits a single embedded link object out of the text', () => {
    const out = expandEmbeddedLinks(
      'established by the {"link":"Vallish Empire","text":"Vallish Empire"} in 672 GD.',
    );
    expect(out).toEqual([
      'established by the ',
      { link: 'Vallish Empire', text: 'Vallish Empire' },
      ' in 672 GD.',
    ]);
  });

  it('handles multiple embedded links in one string', () => {
    const out = expandEmbeddedLinks(
      'The {"link":"Nimbus Mountains","text":"Nimbus Mountains"} and the {"link":"Crescent Sea","text":"Crescent Sea"}.',
    );
    expect(out).toEqual([
      'The ',
      { link: 'Nimbus Mountains', text: 'Nimbus Mountains' },
      ' and the ',
      { link: 'Crescent Sea', text: 'Crescent Sea' },
      '.',
    ]);
  });

  it('renders an article with link objects embedded as JSON in paragraph strings, after expansion', () => {
    const expanded = expandEmbeddedLinks(
      'inhabited since the {"link":"Dawn Age","text":"Dawn Age"}.',
    );
    const article: Article = {
      title: 'T',
      summary: 'A short lead paragraph for testing purposes only.',
      sections: [
        { heading: 'History', paragraphs: [expanded] },
        { heading: 'Other', paragraphs: [['x']] },
      ],
      seeAlso: [],
    };
    const out = renderArticleHtml(article);
    expect(out).toContain('href="/wiki/dawn-age"');
    expect(out).not.toContain('{&quot;link&quot;');
  });

  it('leaves malformed pseudo-JSON in place', () => {
    const out = expandEmbeddedLinks('see {"link":"unterminated');
    expect(out).toEqual(['see {"link":"unterminated']);
  });
});
