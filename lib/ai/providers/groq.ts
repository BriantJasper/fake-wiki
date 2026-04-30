import Groq from 'groq-sdk';
import {
  ArticleSchema,
  type ArticleInput,
  type ArticleStreamEvent,
} from '../schema';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  RANDOM_TITLE_PROMPT,
  TITLE_PLAUSIBILITY_PROMPT,
} from '../prompt';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_OUTPUT_TOKENS = 4096;

let _client: Groq | null = null;
function client(): Groq {
  if (_client) return _client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');
  _client = new Groq({ apiKey });
  return _client;
}

const JSON_INSTRUCTION = `\n\nReturn a single JSON object matching this TypeScript shape:
{
  title: string;
  summary: string;
  infobox?: { label: string; value: string }[];
  sections: { heading: string; paragraphs: (string | { link: string; text: string })[][] }[];
  seeAlso: string[];
  references?: string[];
}
Output only the JSON object — no commentary, no markdown fences.`;

export async function* generateArticleGroq(
  input: ArticleInput,
): AsyncIterable<ArticleStreamEvent> {
  yield { type: 'status', message: 'Consulting the Atlas archives (draft mode)…' };

  const stream = await client().chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    response_format: { type: 'json_object' },
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + JSON_INSTRUCTION },
      { role: 'user', content: buildUserPrompt(input) },
    ],
  });

  let accumulated = '';
  let inputTokens = 0;
  let outputTokens = 0;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      accumulated += delta;
      if (accumulated.length % 200 < 20) {
        yield { type: 'partial', rawJson: accumulated };
      }
    }
    if (chunk.x_groq?.usage) {
      inputTokens = chunk.x_groq.usage.prompt_tokens ?? inputTokens;
      outputTokens = chunk.x_groq.usage.completion_tokens ?? outputTokens;
    }
  }

  let raw: unknown;
  try {
    raw = JSON.parse(accumulated);
  } catch {
    yield {
      type: 'error',
      message: 'Draft mode returned malformed JSON.',
      recoverable: true,
    };
    return;
  }

  const parsed = ArticleSchema.safeParse(raw);
  if (!parsed.success) {
    yield {
      type: 'error',
      message: `Draft article failed validation: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
      recoverable: true,
    };
    return;
  }

  yield {
    type: 'done',
    article: parsed.data,
    usage: { inputTokens, outputTokens },
  };
}

export async function generateRandomTitleGroq(): Promise<string> {
  const result = await client().chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 80,
    messages: [
      { role: 'system', content: RANDOM_TITLE_PROMPT },
      { role: 'user', content: 'Invent one entry title.' },
    ],
  });
  const text = result.choices[0]?.message?.content ?? 'Untitled Plate';
  return text.trim().replace(/^["“]|["”]$/g, '');
}

export async function scoreTitlePlausibilityGroq(title: string): Promise<number> {
  const result = await client().chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 8,
    temperature: 0,
    messages: [
      { role: 'system', content: TITLE_PLAUSIBILITY_PROMPT },
      { role: 'user', content: title },
    ],
  });
  const text = result.choices[0]?.message?.content?.trim() ?? '0';
  const num = Number.parseFloat(text);
  return Number.isFinite(num) ? Math.min(1, Math.max(0, num)) : 0;
}
