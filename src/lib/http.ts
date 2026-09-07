import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getUser } from '@netlify/identity';
import { sql } from 'drizzle-orm';
import { ZodError } from 'zod';
import type { APIContext } from 'astro';
import { db } from '../db';
import { rateLimits } from '../db/schema';
import { env } from './env';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export function sameOrigin(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const trustedAdmin =
    url.pathname.startsWith('/api/admin/') &&
    !!env('PUBLIC_ADMIN_ORIGIN') &&
    origin === env('PUBLIC_ADMIN_ORIGIN');
  if (origin !== url.origin && !trustedAdmin)
    throw new HttpError(403, 'This request must come from this website.');
}
export async function requireAdmin() {
  const user = await getUser();
  if (!user) throw new HttpError(401, 'Please sign in to continue.');
  if (!user.roles?.includes('admin'))
    throw new HttpError(403, 'Your account needs the admin role.');
  return user;
}
export async function readJson(request: Request, max = 250_000) {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new HttpError(415, 'Send JSON data.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'The request is empty.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, 'This request is too large.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'The request could not be read.');
  }
}
function secret() {
  const value = env('VISITOR_SECRET');
  if (value.length < 32)
    throw new HttpError(
      503,
      'This feature is being configured. Please try again later.',
    );
  return value;
}
export const hash = (value: string) =>
  createHmac('sha256', secret()).update(value).digest('hex');
export function visitor(context: APIContext, create = false): string | null {
  const cookie = context.cookies.get('mtm_visitor')?.value || '';
  const [id, signature] = cookie.split('.');
  if (
    id &&
    signature &&
    /^[0-9a-f-]{36}$/.test(id) &&
    /^[0-9a-f]{64}$/.test(signature) &&
    timingSafeEqual(Buffer.from(hash(id)), Buffer.from(signature))
  )
    return hash(`visitor:${id}`);
  if (!create) return null;
  const next = randomUUID();
  context.cookies.set('mtm_visitor', `${next}.${hash(next)}`, {
    httpOnly: true,
    secure: context.url.protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  });
  return hash(`visitor:${next}`);
}
export async function rateLimit(
  context: APIContext,
  action: string,
  limit: number,
  minutes = 10,
) {
  const address =
    context.request.headers.get('x-nf-client-connection-ip') ||
    context.clientAddress ||
    'local';
  const window = Math.floor(Date.now() / (minutes * 60_000));
  const key = hash(`${action}:${address}:${window}`);
  const [result] = await db()
    .insert(rateLimits)
    .values({ key, expiresAt: new Date((window + 2) * minutes * 60_000) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning();
  if (result.count > limit)
    throw new HttpError(429, 'Please wait a few minutes before trying again.');
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json(
      {
        error: error.issues
          .map((i) => `${i.path.join('.') || 'Form'}: ${i.message}`)
          .join(' '),
      },
      422,
    );
  const code =
    (error as { cause?: { code?: string }; code?: string })?.cause?.code ||
    (error as { code?: string })?.code;
  if (code === '23505')
    return json(
      {
        error:
          'That address or placement is already in use. Choose a different one.',
      },
      409,
    );
  if (code === '23503')
    return json(
      {
        error: 'This item is in use. Reassign its articles before deleting it.',
      },
      409,
    );
  console.error(
    'Application request failed',
    error instanceof Error ? error.message : 'Unknown error',
  );
  return json(
    { error: 'We couldn’t complete that request. Please try again shortly.' },
    503,
  );
}
