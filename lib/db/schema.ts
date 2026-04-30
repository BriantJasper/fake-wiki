import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import type { Article } from '@/lib/ai/schema';

export const articles = pgTable(
  'articles',
  {
    slug: text('slug').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    contentJson: jsonb('content_json').$type<Article>().notNull(),
    contentHtml: text('content_html').notNull(),
    parentSlug: text('parent_slug'),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    degraded: boolean('degraded').notNull().default(false),
    promptVersion: text('prompt_version').notNull(),
    hits: integer('hits').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    parentIdx: index('articles_parent_idx').on(t.parentSlug),
    createdIdx: index('articles_created_idx').on(t.createdAt),
  }),
);

export type ArticleRow = typeof articles.$inferSelect;
export type NewArticleRow = typeof articles.$inferInsert;
