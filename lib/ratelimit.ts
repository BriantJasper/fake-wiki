import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/* ============================================================================
   Per-IP rate limiting via Upstash. Two buckets:

   - generation: 10 fresh-article generations per IP per hour
   - read:      120 cached reads per IP per minute

   In dev (no Upstash creds), returns success: true so localhost iteration
   never blocks. Production deploys must set the env vars.
   ============================================================================ */

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = URL && TOKEN ? new Redis({ url: URL, token: TOKEN }) : null;

const generation = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'rl:gen',
      analytics: true,
    })
  : null;

const read = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, '1 m'),
      prefix: 'rl:read',
      analytics: true,
    })
  : null;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
};

const PERMISSIVE: RateLimitResult = { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };

export async function limitGeneration(ip: string): Promise<RateLimitResult> {
  if (!generation) return PERMISSIVE;
  const r = await generation.limit(ip);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}

export async function limitRead(ip: string): Promise<RateLimitResult> {
  if (!read) return PERMISSIVE;
  const r = await read.limit(ip);
  return { success: r.success, remaining: r.remaining, reset: r.reset };
}
