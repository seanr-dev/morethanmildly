import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import {
  requireAdmin,
  sameOrigin,
  json,
  errorResponse,
  HttpError,
} from '../../../lib/http';
import { mediaStore } from '../../../lib/media';
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin();
    sameOrigin(request);
    if (Number(request.headers.get('content-length')) > 5_300_000)
      throw new HttpError(413, 'Images must be smaller than 5 MB.');
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File) || !file.size || file.size > 5_000_000)
      throw new HttpError(
        422,
        'Choose a JPG, PNG, or WebP image smaller than 5 MB.',
      );
    const bytes = await file.arrayBuffer();
    const b = new Uint8Array(bytes);
    const jpg = b[0] === 255 && b[1] === 216 && b[2] === 255;
    const png = b.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
    const webp =
      String.fromCharCode(...b.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
    if (!jpg && !png && !webp)
      throw new HttpError(
        422,
        'The file must be a real JPG, PNG, or WebP image.',
      );
    const key = `${randomUUID()}.${jpg ? 'jpg' : png ? 'png' : 'webp'}`;
    await mediaStore().set(key, bytes);
    return json({ url: `/media/${key}` }, 201);
  } catch (e) {
    return errorResponse(e);
  }
};
