import { z } from 'zod';
const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase words separated by hyphens.',
  );
export const imageUrl = z
  .string()
  .max(2000)
  .refine(
    (v) =>
      /^\/(?:media|images|brand)\/[a-zA-Z0-9_.\/-]+$/.test(v) ||
      /^https:\/\//.test(v),
    'Use an uploaded image or an HTTPS image URL.',
  );
const image = z.object({
  url: imageUrl,
  alt: z.string().trim().min(3).max(300),
  credit: z.string().max(200).optional(),
  source: z.string().url().startsWith('https://').optional().or(z.literal('')),
});
export const categoryInput = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  description: z.string().trim().min(5).max(350),
  type: z.enum(['primary', 'secondary']),
  position: z.coerce.number().int().min(0).max(1000),
});
export const articleInput = z
  .object({
    title: z.string().trim().min(5).max(180),
    slug,
    excerpt: z.string().trim().min(20).max(400),
    body: z
      .array(
        z.object({
          type: z.enum(['paragraph', 'heading', 'quote', 'list']),
          text: z.string().trim().min(1).max(15000),
        }),
      )
      .min(1)
      .max(150),
    headerImage: image,
    inlineImages: z
      .array(image.extend({ afterBlock: z.number().int().min(0).max(149) }))
      .max(3),
    primaryCategoryId: z.string().uuid(),
    secondaryCategoryId: z.string().uuid().nullable(),
    status: z.enum(['draft', 'published']),
    author: z.string().trim().min(2).max(100),
  })
  .refine((a) => a.inlineImages.every((i) => i.afterBlock < a.body.length), {
    message: 'An inline image must follow an existing content block.',
  });
export const adInput = z.object({
  slot: z.enum([
    'category-top',
    'article-top',
    'article-middle',
    'article-bottom',
  ]),
  advertiser: z.string().trim().min(2).max(100),
  title: z.string().trim().min(3).max(120),
  image: image.nullable(),
  targetUrl: z.string().url().startsWith('https://').max(2000),
  active: z.boolean(),
});
export const enquiryInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  company: z.string().trim().max(150).default(''),
  kind: z.enum(['advertising', 'privacy', 'editorial']).default('advertising'),
  message: z.string().trim().min(15).max(5000),
  website: z.string().max(0).optional(),
});
export function validTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}
export function validPushEndpoint(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.port &&
      ([
        'fcm.googleapis.com',
        'updates.push.services.mozilla.com',
        'web.push.apple.com',
      ].includes(u.hostname) ||
        u.hostname.endsWith('.notify.windows.com') ||
        u.hostname.endsWith('.push.apple.com'))
    );
  } catch {
    return false;
  }
}
export const pushInput = z.object({
  endpoint: z
    .string()
    .max(3000)
    .refine(validPushEndpoint, 'Unsupported push service.'),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87,88}={0,2}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22,24}={0,2}$/),
  }),
  timeZone: z.string().max(100).refine(validTimeZone),
});
