import type { APIRoute } from 'astro';
import { siteOrigin, env } from '../lib/env';
export const GET: APIRoute = ({ url }) =>
  new Response(
    env('PUBLIC_ADMIN_ORIGIN') && url.origin === env('PUBLIC_ADMIN_ORIGIN')
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /preview/\nSitemap: ${siteOrigin()}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain' } },
  );
