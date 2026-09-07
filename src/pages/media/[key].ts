import type { APIRoute } from 'astro';
import { mediaStore } from '../../lib/media';
export const GET: APIRoute = async ({ params }) => {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(params.key || ''))
    return new Response('Not found', { status: 404 });
  try {
    const data = await mediaStore().get(params.key!, { type: 'arrayBuffer' });
    if (!data) return new Response('Not found', { status: 404 });
    return new Response(data, {
      headers: {
        'Content-Type': params.key!.endsWith('.jpg')
          ? 'image/jpeg'
          : params.key!.endsWith('.png')
            ? 'image/png'
            : 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Image temporarily unavailable', { status: 503 });
  }
};
