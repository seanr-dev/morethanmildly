import { and, or, eq, ilike, desc, asc, count, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { articles, categories, advertisements } from '../db/schema';
import type { Article, Category, ArticlePage, AdSlot } from './types';

export const PAGE_SIZE = 9;
export async function getCategories(): Promise<Category[]> {
  return db()
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
}
export function publicArticle(
  row: typeof articles.$inferSelect,
  allCategories: Category[],
): Article {
  const { likes: _likes, ...rest } = row;
  return {
    ...rest,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() || null,
    primaryCategory: allCategories.find((c) => c.id === row.primaryCategoryId),
    secondaryCategory:
      allCategories.find((c) => c.id === row.secondaryCategoryId) || null,
  };
}
export const published = () =>
  and(eq(articles.status, 'published'), lte(articles.publishedAt, new Date()));
export async function listArticles(
  options: {
    q?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
    admin?: boolean;
  } = {},
): Promise<ArticlePage> {
  const all = await getCategories();
  const clauses = options.admin ? [] : [published()];
  const category = options.category
    ? all.find((c) => c.slug === options.category)
    : undefined;
  if (options.category && !category)
    return { articles: [], nextPage: null, total: 0 };
  if (category)
    clauses.push(
      or(
        eq(articles.primaryCategoryId, category.id),
        eq(articles.secondaryCategoryId, category.id),
      ),
    );
  if (options.q?.trim()) {
    const q = `%${options.q
      .trim()
      .slice(0, 150)
      .replace(/[\\%_]/g, '\\$&')}%`;
    clauses.push(
      or(
        ilike(articles.title, q),
        ilike(articles.excerpt, q),
        ilike(sql`CAST(${articles.body} AS text)`, q),
      ),
    );
  }
  const page = Math.max(1, Math.min(options.page || 1, 10000));
  const limit = Math.max(1, Math.min(options.limit || PAGE_SIZE, 100));
  const where = and(...clauses);
  const [rows, totalRows] = await Promise.all([
    db()
      .select()
      .from(articles)
      .where(where)
      .orderBy(
        ...(options.sort === 'liked' ? [desc(articles.likes)] : []),
        desc(articles.publishedAt),
        desc(articles.createdAt),
        asc(articles.id),
      )
      .limit(limit)
      .offset((page - 1) * limit),
    db().select({ total: count() }).from(articles).where(where),
  ]);
  const total = totalRows[0].total;
  return {
    articles: rows.map((r) => publicArticle(r, all)),
    nextPage: page * limit < total ? page + 1 : null,
    total,
  };
}
export async function getArticle(slug: string, admin = false) {
  const [all, rows] = await Promise.all([
    getCategories(),
    db()
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), admin ? undefined : published()))
      .limit(1),
  ]);
  return rows[0] ? publicArticle(rows[0], all) : null;
}
export async function getAd(slot: AdSlot) {
  return (
    (
      await db()
        .select()
        .from(advertisements)
        .where(
          and(eq(advertisements.slot, slot), eq(advertisements.active, true)),
        )
        .limit(1)
    )[0] || null
  );
}
