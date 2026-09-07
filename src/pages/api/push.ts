import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db';
import { pushSubscriptions } from '../../db/schema';
import { pushInput } from '../../lib/validation';
import {
  sameOrigin,
  visitor,
  readJson,
  rateLimit,
  json,
  errorResponse,
  HttpError,
} from '../../lib/http';
import { env } from '../../lib/env';
export const GET: APIRoute = () =>
  json({ publicKey: env('PUBLIC_VAPID_PUBLIC_KEY') || null });
export const POST: APIRoute = async (ctx) => {
  try {
    sameOrigin(ctx.request);
    await rateLimit(ctx, 'push', 10, 60);
    if (!env('VAPID_PRIVATE_KEY'))
      throw new HttpError(503, 'Notifications are being configured.');
    const data = pushInput.parse(await readJson(ctx.request, 6000));
    const who = visitor(ctx, true)!;
    const [existing] = await db()
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint));
    if (
      existing &&
      (existing.auth !== data.keys.auth || existing.p256dh !== data.keys.p256dh)
    )
      throw new HttpError(
        403,
        'This notification subscription could not be verified.',
      );
    await db()
      .insert(pushSubscriptions)
      .values({
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        timeZone: data.timeZone,
        visitorHash: who,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { timeZone: data.timeZone, visitorHash: who },
      });
    return json({ subscribed: true }, 201);
  } catch (e) {
    return errorResponse(e);
  }
};
export const DELETE: APIRoute = async (ctx) => {
  try {
    sameOrigin(ctx.request);
    await rateLimit(ctx, 'push', 10, 60);
    const data = z
      .object({
        endpoint: z.string().max(3000),
        auth: z.string().max(100).optional(),
      })
      .parse(await readJson(ctx.request, 5000));
    const who = visitor(ctx);
    if (!who && !data.auth)
      throw new HttpError(403, 'This subscription could not be verified.');
    const [existing] = await db()
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint));
    if (existing && existing.visitorHash !== who && existing.auth !== data.auth)
      throw new HttpError(403, 'This subscription could not be verified.');
    if (existing)
      await db()
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.id, existing.id));
    return json({ subscribed: false });
  } catch (e) {
    return errorResponse(e);
  }
};
