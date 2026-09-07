import type { APIRoute } from 'astro';
import { db } from '../../db';
import { enquiries } from '../../db/schema';
import { enquiryInput } from '../../lib/validation';
import {
  sameOrigin,
  readJson,
  rateLimit,
  json,
  errorResponse,
} from '../../lib/http';
export const POST: APIRoute = async (ctx) => {
  try {
    sameOrigin(ctx.request);
    await rateLimit(ctx, 'enquiry', 5, 60);
    const { website: _honeypot, ...data } = enquiryInput.parse(
      await readJson(ctx.request, 12000),
    );
    await db().insert(enquiries).values(data);
    return json({ success: true }, 201);
  } catch (e) {
    return errorResponse(e);
  }
};
