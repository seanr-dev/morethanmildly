import type { APIRoute } from 'astro';
import { db } from '../db';
import { articles } from '../db/schema';
import { published, getCategories } from '../lib/repository';
import { siteOrigin } from '../lib/env';
const escape = (s: string) =>
  s.replace(
    /[<>&'\"]/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[char]!,
  );
export const GET: APIRoute = async () => {
  try {
    const [cats, posts] = await Promise.all([
      getCategories(),
      db()
        .select({ slug: articles.slug, updatedAt: articles.updatedAt })
        .from(articles)
        .where(published()),
    ]);
    const urls = [
      '/',
      '/about',
      '/advertise',
      '/privacy',
      '/cookies',
      ...cats.map((c) => `/category/${c.slug}`),
    ].map((path) => `<url><loc>${escape(siteOrigin() + path)}</loc></url>`);
    posts.forEach((p) =>
      urls.push(
        `<url><loc>${escape(`${siteOrigin()}/articles/${p.slug}`)}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`,
      ),
    );
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
      {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=300',
        },
      },
    );
  } catch {
    return new Response('Sitemap temporarily unavailable', { status: 503 });
  }
};
