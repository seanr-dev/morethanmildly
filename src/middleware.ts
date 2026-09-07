import { defineMiddleware } from 'astro:middleware';
import { env, siteOrigin } from './lib/env';
import { ensureLocalMigrations } from './db/local-migrations';
export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.DEV) await ensureLocalMigrations();
  const adminOrigin = env('PUBLIC_ADMIN_ORIGIN');
  const path = context.url.pathname;
  if (adminOrigin && context.url.origin === adminOrigin && path === '/')
    return context.redirect('/admin', 302);
  // /admin also remains available on the upstream origin so a subdomain proxy
  // never redirects to itself. Identity and the admin role protect both URLs.
  if (
    adminOrigin &&
    context.url.origin === adminOrigin &&
    !path.startsWith('/admin') &&
    !path.startsWith('/api/') &&
    !path.startsWith('/media/') &&
    !path.startsWith('/_') &&
    !path.startsWith('/brand/') &&
    !path.startsWith('/.netlify/') &&
    path !== '/robots.txt'
  )
    return context.redirect(`${siteOrigin()}${path}${context.url.search}`, 302);
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!import.meta.env.DEV) response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  if (path.startsWith('/admin') || path.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
