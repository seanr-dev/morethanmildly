import webpush from 'web-push';
import { createHash, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, lt, desc, asc } from 'drizzle-orm';
import { createPublicationDatabase } from '../../src/db/client';
import {
  articles,
  pushSubscriptions,
  notificationDeliveries,
  rateLimits,
} from '../../src/db/schema';
import { notificationWindow } from '../../src/lib/notification-schedule';
import { validPushEndpoint } from '../../src/lib/validation';
export default async (request: Request) => {
  const secret = Netlify.env.get('PUSH_JOB_SECRET');
  if (!secret || request.method !== 'POST')
    return new Response(null, { status: 403 });
  const digest = (s: string) => createHash('sha256').update(s).digest();
  if (
    !timingSafeEqual(
      digest(request.headers.get('authorization') || ''),
      digest(`Bearer ${secret}`),
    )
  )
    return new Response(null, { status: 403 });
  const publicKey = Netlify.env.get('PUBLIC_VAPID_PUBLIC_KEY'),
    privateKey = Netlify.env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(
    Netlify.env.get('VAPID_SUBJECT') || Netlify.env.get('PUBLIC_SITE_URL')!,
    publicKey,
    privateKey,
  );
  const database = createPublicationDatabase();
  const started = Date.now();
  const now = new Date();
  const recent = await database
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
    })
    .from(articles)
    .where(and(eq(articles.status, 'published'), lt(articles.publishedAt, now)))
    .orderBy(desc(articles.publishedAt), asc(articles.id))
    .limit(30);
  if (!recent.length) return;
  let cursor: string | null = null;
  while (Date.now() - started < 12 * 60_000) {
    const batch = await database
      .select()
      .from(pushSubscriptions)
      .where(cursor ? gt(pushSubscriptions.id, cursor) : undefined)
      .orderBy(asc(pushSubscriptions.id))
      .limit(100);
    if (!batch.length) break;
    for (let i = 0; i < batch.length; i += 10)
      await Promise.all(
        batch.slice(i, i + 10).map(async (subscription) => {
          const window = notificationWindow(subscription.timeZone, now);
          if (!window) return;
          if (!validPushEndpoint(subscription.endpoint)) {
            await database
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id));
            return;
          }
          const previous = await database
            .select({ articleId: notificationDeliveries.articleId })
            .from(notificationDeliveries)
            .where(
              and(
                eq(notificationDeliveries.subscriptionId, subscription.id),
                eq(notificationDeliveries.state, 'sent'),
              ),
            )
            .orderBy(desc(notificationDeliveries.createdAt))
            .limit(10);
          const article =
            recent.find((a) => !previous.some((p) => p.articleId === a.id)) ||
            recent[0];
          // A unique reservation prevents repeated sends from overlapping scheduled invocations.
          const [claim] = await database
            .insert(notificationDeliveries)
            .values({
              subscriptionId: subscription.id,
              ...window,
              articleId: article.id,
              state: 'pending',
            })
            .onConflictDoNothing()
            .returning();
          if (!claim) return;
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              JSON.stringify({
                title: article.title,
                body: `Your ${window.period} read from More Than Mildly.`,
                url: `/articles/${article.slug}`,
                tag: `mtm-${window.localDate}-${window.period}`,
              }),
              { TTL: 3600, urgency: 'normal', timeout: 10000 },
            );
            await database
              .update(notificationDeliveries)
              .set({ state: 'sent' })
              .where(eq(notificationDeliveries.id, claim.id));
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410)
              await database
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.id, subscription.id));
            else {
              await database
                .update(notificationDeliveries)
                .set({ state: 'failed' })
                .where(eq(notificationDeliveries.id, claim.id));
              console.error('Push delivery failed', status || 'network error');
            }
          }
        }),
      );
    cursor = batch[batch.length - 1].id;
  }
  await database.delete(rateLimits).where(lt(rateLimits.expiresAt, now));
  await database
    .delete(notificationDeliveries)
    .where(
      lt(
        notificationDeliveries.createdAt,
        new Date(Date.now() - 30 * 86400_000),
      ),
    );
};
