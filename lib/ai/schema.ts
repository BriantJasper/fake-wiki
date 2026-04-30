import { z } from 'zod';

/* ============================================================================
   The structured output every article generation must produce.

   We validate with Zod after the stream completes; the Anthropic input_schema
   below is hand-written rather than derived, to keep the dependency surface
   small and to control wording in the LLM-facing JSON Schema independently.
   ============================================================================ */

export const InlineLink = z.object({
  link: z.string().min(1).max(120),
  text: z.string().min(1).max(120),
});

export const Paragraph = z.array(z.union([z.string(), InlineLink]));

export const Section = z.object({
  heading: z.string().min(1).max(120),
  paragraphs: z.array(Paragraph).min(1).max(20),
});

export const InfoboxRow = z.object({
  label: z.string().min(1).max(60),
  value: z.string().min(1).max(200),
});

export const ArticleSchema = z.object({
  title: z.string().min(2).max(140),
  summary: z.string().min(20).max(400),
  infobox: z.array(InfoboxRow).max(12).optional(),
  sections: z.array(Section).min(2).max(8),
  seeAlso: z.array(z.string().min(2).max(120)).max(12).default([]),
  references: z.array(z.string().min(2).max(280)).max(8).optional(),
});

export type Article = z.infer<typeof ArticleSchema>;
export type Section = z.infer<typeof Section>;
export type Paragraph = z.infer<typeof Paragraph>;
export type InlineLink = z.infer<typeof InlineLink>;

/* ----------------------------------------------------------------------------
   Anthropic tool input_schema (JSON Schema dialect understood by the API).
   ---------------------------------------------------------------------------- */

export const articleToolName = 'write_article' as const;

export const articleToolInputSchema = {
  type: 'object',
  required: ['title', 'summary', 'sections', 'seeAlso'],
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      description:
        'Article title as it would appear on a real encyclopedia entry. 2–140 characters.',
    },
    summary: {
      type: 'string',
      description:
        'A single-paragraph lead, 20–400 characters. Reads as the first paragraph of a Wikipedia article.',
    },
    infobox: {
      type: 'array',
      description:
        'Optional sidebar facts (founded, type, era, location, etc.). 0–12 rows.',
      items: {
        type: 'object',
        required: ['label', 'value'],
        additionalProperties: false,
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
    sections: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      description: 'Body sections in order.',
      items: {
        type: 'object',
        required: ['heading', 'paragraphs'],
        additionalProperties: false,
        properties: {
          heading: { type: 'string' },
          paragraphs: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            description:
              'Each paragraph is an array of plain-text strings and inline links {link, text}. Concatenate in order to render.',
            items: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  {
                    type: 'object',
                    required: ['link', 'text'],
                    additionalProperties: false,
                    properties: {
                      link: {
                        type: 'string',
                        description: 'The canonical title of another article in the encyclopedia.',
                      },
                      text: {
                        type: 'string',
                        description: 'How the link should appear in the rendered prose.',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    seeAlso: {
      type: 'array',
      maxItems: 12,
      description:
        'Titles (not slugs) of related fictional articles a curious reader might explore next.',
      items: { type: 'string' },
    },
    references: {
      type: 'array',
      maxItems: 8,
      description:
        'Optional list of fictional citations, formatted like real bibliography entries. Pure flavor.',
      items: { type: 'string' },
    },
  },
} as const;

/* ----------------------------------------------------------------------------
   Streaming events emitted by the LLM router.
   ---------------------------------------------------------------------------- */

export type ArticleStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'partial'; rawJson: string }
  | {
      type: 'done';
      article: Article;
      usage: { inputTokens: number; outputTokens: number };
    }
  | { type: 'error'; message: string; recoverable: boolean };

export type ArticleInput = {
  /** Canonical title we want an article for. */
  title: string;
  /** Title (not slug) of the article that linked here, if any. Used for in-universe consistency. */
  parentTitle?: string;
  /** Short summary of the parent so the new article doesn't contradict it. */
  parentContext?: string;
};
