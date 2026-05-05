import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db/client';
import { isValidSlug, slugToTitle, titleToSlug } from '@/lib/slug';
import { generateArticle } from '@/lib/ai/router';
import { renderArticleHtml, expandEmbeddedLinks } from '@/lib/render';
import { PROMPT_VERSION } from '@/lib/ai/prompt';
import { limitGeneration } from '@/lib/ratelimit';
import type { Article, ArticleStreamEvent } from '@/lib/ai/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Slugify titles in seeAlso and inline links so client-side navigation lands
 * on the same canonical slug everywhere. We also normalize the inline link
 * targets to their canonical title (the human-facing string), keeping a
 * predictable round-trip.
 */
function normalizeLinks(article: Article): Article {
  const seeAlso = (article.seeAlso ?? [])
    .map((t) => t.trim())
    .filter((t) => titleToSlug(t).length > 0);

  const sections = article.sections.map((section) => ({
    ...section,
    paragraphs: section.paragraphs.map((paragraph) =>
      paragraph.flatMap((item) => {
        if (typeof item === 'string') {
          return expandEmbeddedLinks(item).map((part) => {
            if (typeof part === 'string') return part;
            const link = part.link.trim();
            if (!titleToSlug(link)) return part.text;
            return { link, text: part.text };
          });
        }
        const link = item.link.trim();
        if (!titleToSlug(link)) return item.text;
        return { link, text: item.text };
      }),
    ),
  }));

  return { ...article, seeAlso, sections };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return new Response(JSON.stringify({ error: 'invalid_slug' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ip = getClientIp(req);
  const rl = await limitGeneration(ip);
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', retryAfter: rl.reset }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': Math.max(0, Math.ceil((rl.reset - Date.now()) / 1000)).toString(),
        },
      },
    );
  }

  // Cheap double-check: don't regenerate if a concurrent request landed first.
  const existing = await db
    .select({ slug: schema.articles.slug })
    .from(schema.articles)
    .where(eq(schema.articles.slug, slug))
    .limit(1);
  if (existing.length > 0) {
    return new Response(JSON.stringify({ status: 'cached' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Resolve parent article context if provided.
  const parentSlug = req.nextUrl.searchParams.get('parent');
  let parentTitle: string | undefined;
  let parentContext: string | undefined;
  if (parentSlug && isValidSlug(parentSlug)) {
    const p = await db
      .select({ title: schema.articles.title, summary: schema.articles.summary })
      .from(schema.articles)
      .where(eq(schema.articles.slug, parentSlug))
      .limit(1);
    if (p[0]) {
      parentTitle = p[0].title;
      parentContext = p[0].summary;
    }
  }

  const requestedTitle = slugToTitle(slug);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(event, data)));

      try {
        const generation = await generateArticle({
          title: requestedTitle,
          parentTitle,
          parentContext,
        });
        send('meta', {
          provider: generation.provider,
          model: generation.model,
          degraded: generation.degraded,
        });

        let finalArticle: Article | null = null;
        let usage = { inputTokens: 0, outputTokens: 0 };

        for await (const event of generation.events as AsyncIterable<ArticleStreamEvent>) {
          send(event.type, event);
          if (event.type === 'done') {
            finalArticle = event.article;
            usage = event.usage;
          } else if (event.type === 'error') {
            controller.close();
            return;
          }
        }

        if (!finalArticle) {
          send('error', { message: 'Generation ended without a final article.' });
          controller.close();
          return;
        }

        const normalized = normalizeLinks(finalArticle);
        const html = renderArticleHtml(normalized);

        await db
          .insert(schema.articles)
          .values({
            slug,
            title: normalized.title,
            summary: normalized.summary,
            contentJson: normalized,
            contentHtml: html,
            parentSlug: parentSlug ?? null,
            provider: generation.provider,
            model: generation.model,
            degraded: generation.degraded,
            promptVersion: PROMPT_VERSION,
          })
          .onConflictDoNothing();

        send('persisted', { slug, usage });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error.';
        send('error', { message, recoverable: false });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
