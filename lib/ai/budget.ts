import { Redis } from '@upstash/redis';

/* ============================================================================
   Soft daily spend cap for Anthropic.

   Tracked in Redis under spend:anthropic:YYYY-MM-DD as cents (integer) so we
   never round floating-point. The router calls anthropicAvailable() before
   each article generation; if false, it routes the request to Groq.

   In dev (no Upstash creds), both functions are no-ops and Anthropic is
   always considered available.
   ============================================================================ */

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = URL && TOKEN ? new Redis({ url: URL, token: TOKEN }) : null;

const SOFT_CAP_USD = process.env.ANTHROPIC_DAILY_SOFT_CAP_USD
  ? Number(process.env.ANTHROPIC_DAILY_SOFT_CAP_USD)
  : null;

// Sonnet 4.6 published rates as of 2026-04. Update if pricing changes.
const SONNET_INPUT_USD_PER_MTOK = 3.0;
const SONNET_OUTPUT_USD_PER_MTOK = 15.0;

function todayKey(): string {
  return `spend:anthropic:${new Date().toISOString().slice(0, 10)}`;
}

export async function anthropicAvailable(): Promise<boolean> {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  if (SOFT_CAP_USD == null || !redis) return true;

  const cents = (await redis.get<number>(todayKey())) ?? 0;
  const usd = cents / 100;
  return usd < SOFT_CAP_USD;
}

export async function recordAnthropicUsage(input: {
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  if (!redis) return;
  const usd =
    (input.inputTokens / 1_000_000) * SONNET_INPUT_USD_PER_MTOK +
    (input.outputTokens / 1_000_000) * SONNET_OUTPUT_USD_PER_MTOK;
  const cents = Math.ceil(usd * 100);
  const key = todayKey();
  await redis.incrby(key, cents);
  // Expire after ~48h so old keys don't accumulate.
  await redis.expire(key, 60 * 60 * 48);
}
