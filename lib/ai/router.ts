import type { ArticleInput, ArticleStreamEvent } from './schema';
import {
  generateArticleAnthropic,
  generateRandomTitleAnthropic,
  ANTHROPIC_MODEL,
} from './providers/anthropic';
import {
  generateArticleGroq,
  generateRandomTitleGroq,
  scoreTitlePlausibilityGroq,
  GROQ_MODEL,
} from './providers/groq';
import { anthropicAvailable } from './budget';

export type ProviderName = 'anthropic' | 'groq';

export type GenerationResult = {
  provider: ProviderName;
  model: string;
  degraded: boolean;
  events: AsyncIterable<ArticleStreamEvent>;
};

/* ============================================================================
   The single entry point all server code uses to write articles. The router
   chooses Anthropic by default and transparently degrades to Groq when the
   daily soft cap is exceeded or Anthropic isn't configured.
   ============================================================================ */

export async function generateArticle(input: ArticleInput): Promise<GenerationResult> {
  const useAnthropic = await anthropicAvailable();
  if (useAnthropic) {
    return {
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
      degraded: false,
      events: generateArticleAnthropic(input),
    };
  }
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      'No LLM provider available: ANTHROPIC_API_KEY missing or over budget, and GROQ_API_KEY not set.',
    );
  }
  return {
    provider: 'groq',
    model: GROQ_MODEL,
    degraded: true,
    events: generateArticleGroq(input),
  };
}

/* ----------------------------------------------------------------------------
   Cheap-path operations always go to Groq when configured, falling back to
   Anthropic only if Groq is unavailable.
   ---------------------------------------------------------------------------- */

export async function generateRandomTitle(): Promise<string> {
  if (process.env.GROQ_API_KEY) return generateRandomTitleGroq();
  if (process.env.ANTHROPIC_API_KEY) return generateRandomTitleAnthropic();
  throw new Error('No LLM provider configured.');
}

export async function scoreTitlePlausibility(title: string): Promise<number> {
  if (!process.env.GROQ_API_KEY) {
    // Without Groq we just trust the title; gibberish filtering is non-blocking.
    return 0.7;
  }
  return scoreTitlePlausibilityGroq(title);
}
