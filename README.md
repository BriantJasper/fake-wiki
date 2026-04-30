# Atlas of Nowhere

An AI-generated encyclopedia of things that don't exist. Click any link inside an article and the entry it points to is written into being. Articles are persisted, so the same fake fact returns to every later visitor unchanged.

## Stack

- **Next.js 15** (App Router, RSC, SSE)
- **TypeScript** (strict)
- **Drizzle** + **Postgres** (Neon serverless)
- **Anthropic Claude Sonnet 4.6** for article writing (tool use, streaming JSON)
- **Groq Llama 3.3 70B** for cheap ops (slug normalization, random titles, soft-cap fallback)
- **Upstash Redis** for rate limiting + spend tracking
- **Tailwind v4** + a custom design system ("Atlas of Nowhere" — paper, ink, marginalia)
- **Vercel** for deploy
- **Vitest** + **Playwright** for tests

## Local development

### 1. Prereqs

- Node ≥ 20
- A free Neon Postgres database
- An Anthropic API key (Sonnet 4.6)
- A Groq API key (free; for cheap operations and budget-fallback)
- *(Optional)* Upstash Redis for rate limiting / spend cap

### 2. Setup

```bash
npm install
cp .env.example .env.local
# fill in DATABASE_URL, ANTHROPIC_API_KEY, GROQ_API_KEY at minimum
```

### 3. Database

```bash
npm run db:generate   # generate the initial migration from lib/db/schema.ts
npm run db:migrate    # apply it to the Neon dev branch
```

### 4. Run

```bash
npm run dev
# open http://localhost:3000
```

The first visit to any `/wiki/[slug]` URL triggers article generation; subsequent visits are served from the DB cache.

### 5. Tests

```bash
npm test              # vitest unit tests
npm run test:e2e      # playwright (requires a running dev server with API keys)
```

## Architecture

```
Browser (RSC + tiny client islands)
  │
  └── HTTPS ── Next.js (Vercel) ───────┬─── Neon Postgres (articles cache)
                                       └─── LLM router
                                              ├─ Anthropic (article writing)
                                              └─ Groq (cheap path + fallback)
```

Key shape decisions are documented in the implementation plan at
`C:\Users\brian\.claude\plans\hey-help-me-think-merry-starfish.md`.

### Where things live

| Path | What it does |
|------|---|
| `app/wiki/[slug]/page.tsx` | The read path. DB hit → SSR; miss → render `<StreamingArticle>` |
| `app/api/article/[slug]/route.ts` | The write path. Rate-limit, generate, validate, persist, stream as SSE |
| `app/random/route.ts` | 60% existing slug, 40% Groq-generated fresh title |
| `lib/ai/router.ts` | The single entry point for article generation. Soft-cap aware |
| `lib/ai/schema.ts` | Zod + JSON Schema for the article structure |
| `lib/ai/prompt.ts` | The system prompt — voice, structure, refusals |
| `lib/render.ts` | Article JSON → SSR HTML (deterministic, no client deps) |
| `proxy.ts` | Edge bot filter for the generation endpoint (Next 16's renamed middleware) |

### LLM routing

- **Article writing** uses Anthropic by default. If `ANTHROPIC_DAILY_SOFT_CAP_USD` is set and today's spend exceeds it, the router transparently falls back to Groq. Articles written via the fallback path are tagged `degraded = true` in the DB and can be regenerated later.
- **Random titles, plausibility scoring, slug normalization** always go to Groq (free, fast, low quality bar).

### Rate limiting

- Per-IP token bucket via Upstash:
  - **10 generations/hour** (the expensive endpoint)
  - **120 reads/minute** (cached articles)
- Without Upstash credentials, both buckets are no-ops — fine for local dev, **not** safe to deploy without.

## Deploy

1. Push to GitHub.
2. Import into Vercel.
3. Set env vars (the same as `.env.example`, with production values).
4. The first deploy runs migrations as part of build — or run `npm run db:migrate` against the prod URL once before deploying.

## Cost ceiling

Anthropic Sonnet 4.6 averages ~$0.01–$0.03 per article. With the soft cap unset, ~5,000 articles/mo costs ~$50–150. Set `ANTHROPIC_DAILY_SOFT_CAP_USD` to e.g. `2` to clamp daily spend; the app stays up via Groq once exceeded.

## Ethics

Every article carries a persistent banner identifying it as fictional. The system prompt refuses requests for entries about real living public figures, recent tragedies, medical/legal advice, and other harmful categories — returning a brief editorial note in their place. Schema.org JSON-LD on every article includes a `disclaimer` property.
