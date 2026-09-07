import type { APIRoute } from 'astro';
import { listArticles } from '../../lib/repository';
import { json, errorResponse } from '../../lib/http';
export const GET: APIRoute = async ({ url }) => {
  try {
    return json(
      await listArticles({
        q: url.searchParams.get('q') || '',
        category: url.searchParams.get('category') || '',
        sort: url.searchParams.get('sort') || 'newest',
        page: Number(url.searchParams.get('page')) || 1,
      }),
    );
  } catch (e) {
    return errorResponse(e);
  }
};
