import type { APIRoute } from 'astro';
import { eq, or, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db';
import {
  articles,
  categories,
  advertisements,
  enquiries,
  pushSubscriptions,
} from '../../../db/schema';
import {
  requireAdmin,
  sameOrigin,
  readJson,
  json,
  errorResponse,
  HttpError,
} from '../../../lib/http';
import { articleInput, categoryInput, adInput } from '../../../lib/validation';
import { getCategories, listArticles } from '../../../lib/repository';
import { env } from '../../../lib/env';
export const ALL: APIRoute = async (ctx) => {
  try {
    const user = await requireAdmin();
    const { request, params, url } = ctx;
    const resource = params.resource;
    if (request.method !== 'GET') sameOrigin(request);
    const id = url.searchParams.get('id');
    if (id) z.string().uuid().parse(id);
    if (request.method === 'GET') {
      if (resource === 'session')
        return json({ email: user.email, role: 'admin' });
      if (resource === 'articles')
        return json(
          await listArticles({
            admin: true,
            q: url.searchParams.get('q') || '',
            page: Number(url.searchParams.get('page')) || 1,
            limit: 30,
          }),
        );
      if (resource === 'categories') return json(await getCategories());
      if (resource === 'advertisements')
        return json(await db().select().from(advertisements));
      if (resource === 'enquiries')
        return json(
          await db()
            .select()
            .from(enquiries)
            .orderBy(desc(enquiries.createdAt))
            .limit(200),
        );
      if (resource === 'settings') {
        const [push] = await db()
          .select({ total: count() })
          .from(pushSubscriptions);
        return json({
          analytics: !!env('PUBLIC_GA_MEASUREMENT_ID'),
          meta: !!env('PUBLIC_META_PIXEL_ID'),
          tiktok: !!env('PUBLIC_TIKTOK_PIXEL_ID'),
          marketingEnabled: env('PUBLIC_MARKETING_ENABLED') === 'true',
          notifications: !!env('VAPID_PRIVATE_KEY'),
          subscribers: push.total,
          adminOrigin: env('PUBLIC_ADMIN_ORIGIN'),
        });
      }
    }
    if (request.method === 'DELETE') {
      if (!id) throw new HttpError(400, 'Choose an item to delete.');
      if (resource === 'categories') {
        const used = await db()
          .select({ id: articles.id })
          .from(articles)
          .where(
            or(
              eq(articles.primaryCategoryId, id),
              eq(articles.secondaryCategoryId, id),
            ),
          )
          .limit(1);
        if (used.length)
          throw new HttpError(
            409,
            'Reassign all articles using this category before deleting it.',
          );
      }
      const table =
        resource === 'articles'
          ? articles
          : resource === 'categories'
            ? categories
            : resource === 'advertisements'
              ? advertisements
              : resource === 'enquiries'
                ? enquiries
                : null;
      if (!table) throw new HttpError(404, 'Unknown resource.');
      const result = await db()
        .delete(table)
        .where(eq(table.id, id))
        .returning();
      if (!result.length)
        throw new HttpError(404, 'That item was already removed.');
      return json({ success: true });
    }
    if (request.method === 'POST' || request.method === 'PUT') {
      if (request.method === 'PUT' && !id)
        throw new HttpError(400, 'Choose an item to edit.');
      const input = await readJson(request);
      if (resource === 'articles') {
        const data = articleInput.parse(input);
        const all = await getCategories();
        if (
          !all.some(
            (c) => c.id === data.primaryCategoryId && c.type === 'primary',
          )
        )
          throw new HttpError(422, 'Choose a primary category.');
        if (
          data.secondaryCategoryId &&
          !all.some(
            (c) => c.id === data.secondaryCategoryId && c.type === 'secondary',
          )
        )
          throw new HttpError(
            422,
            'Choose a secondary category or leave it empty.',
          );
        const existing = id
          ? (await db().select().from(articles).where(eq(articles.id, id)))[0]
          : null;
        if (id && !existing) throw new HttpError(404, 'Article not found.');
        const values = {
          ...data,
          updatedAt: new Date(),
          publishedAt:
            data.status === 'published'
              ? existing?.publishedAt || new Date()
              : existing?.publishedAt || null,
        };
        const rows = id
          ? await db()
              .update(articles)
              .set(values)
              .where(eq(articles.id, id))
              .returning()
          : await db().insert(articles).values(values).returning();
        return json(rows[0], id ? 200 : 201);
      }
      if (resource === 'categories') {
        const data = categoryInput.parse(input);
        if (id) {
          const [existing] = await db()
            .select()
            .from(categories)
            .where(eq(categories.id, id));
          if (!existing) throw new HttpError(404, 'Category not found.');
          if (existing.type !== data.type) {
            const used = await db()
              .select({ id: articles.id })
              .from(articles)
              .where(
                or(
                  eq(articles.primaryCategoryId, id),
                  eq(articles.secondaryCategoryId, id),
                ),
              )
              .limit(1);
            if (used.length)
              throw new HttpError(
                409,
                'Reassign articles before changing this category’s type.',
              );
          }
        }
        return json(
          (id
            ? await db()
                .update(categories)
                .set(data)
                .where(eq(categories.id, id))
                .returning()
            : await db().insert(categories).values(data).returning())[0],
          id ? 200 : 201,
        );
      }
      if (resource === 'advertisements') {
        const data = adInput.parse(input);
        const rows = id
          ? await db()
              .update(advertisements)
              .set(data)
              .where(eq(advertisements.id, id))
              .returning()
          : await db().insert(advertisements).values(data).returning();
        if (!rows.length) throw new HttpError(404, 'Placement not found.');
        return json(rows[0], id ? 200 : 201);
      }
      if (resource === 'enquiries' && id) {
        const data = z
          .object({ status: z.enum(['new', 'contacted', 'closed']) })
          .parse(input);
        return json(
          (
            await db()
              .update(enquiries)
              .set(data)
              .where(eq(enquiries.id, id))
              .returning()
          )[0],
        );
      }
    }
    throw new HttpError(405, 'This operation is not supported.');
  } catch (e) {
    return errorResponse(e);
  }
};
