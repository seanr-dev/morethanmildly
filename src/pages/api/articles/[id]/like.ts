import type { APIRoute } from 'astro';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../../db';
import { articles, articleLikes } from '../../../../db/schema';
import { published } from '../../../../lib/repository';
import {
  json,
  errorResponse,
  sameOrigin,
  visitor,
  rateLimit,
  HttpError,
} from '../../../../lib/http';
export const GET: APIRoute = async (ctx) => {
  try {
    const id = z.string().uuid().parse(ctx.params.id);
    const who = visitor(ctx);
    const rows = who
      ? await db()
          .select({ id: articleLikes.articleId })
          .from(articleLikes)
          .where(
            and(
              eq(articleLikes.articleId, id),
              eq(articleLikes.visitorHash, who),
            ),
          )
          .limit(1)
      : [];
    return json({ liked: rows.length > 0 });
  } catch (e) {
    return errorResponse(e);
  }
};
export const POST: APIRoute = async (ctx) => {
  try {
    sameOrigin(ctx.request);
    const id = z.string().uuid().parse(ctx.params.id);
    await rateLimit(ctx, 'like', 50);
    const who = visitor(ctx, true)!;
    await db().transaction(async (tx) => {
      const [article] = await tx
        .select({ id: articles.id })
        .from(articles)
        .where(and(eq(articles.id, id), published()))
        .for('update');
      if (!article)
        throw new HttpError(404, 'This article is no longer available.');
      const added = await tx
        .insert(articleLikes)
        .values({ articleId: id, visitorHash: who })
        .onConflictDoNothing()
        .returning();
      if (added.length)
        await tx
          .update(articles)
          .set({ likes: sql`${articles.likes} + 1` })
          .where(eq(articles.id, id));
    });
    return json({ liked: true });
  } catch (e) {
    return errorResponse(e);
  }
};
export const DELETE: APIRoute = async (ctx) => {
  try {
    sameOrigin(ctx.request);
    const id = z.string().uuid().parse(ctx.params.id);
    await rateLimit(ctx, 'like', 50);
    const who = visitor(ctx);
    if (who)
      await db().transaction(async (tx) => {
        await tx
          .select({ id: articles.id })
          .from(articles)
          .where(eq(articles.id, id))
          .for('update');
        const removed = await tx
          .delete(articleLikes)
          .where(
            and(
              eq(articleLikes.articleId, id),
              eq(articleLikes.visitorHash, who),
            ),
          )
          .returning();
        if (removed.length)
          await tx
            .update(articles)
            .set({ likes: sql`greatest(0, ${articles.likes} - 1)` })
            .where(eq(articles.id, id));
      });
    return json({ liked: false });
  } catch (e) {
    return errorResponse(e);
  }
};
