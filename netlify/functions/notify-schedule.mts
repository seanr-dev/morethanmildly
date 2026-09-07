import type { Config } from '@netlify/functions';
export default async () => {
  const secret = Netlify.env.get('PUSH_JOB_SECRET');
  const origin = Netlify.env.get('PUBLIC_SITE_URL');
  if (!secret || !origin || !Netlify.env.get('VAPID_PRIVATE_KEY')) return;
  const result = await fetch(`${origin}/.netlify/functions/notify-background`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!result.ok)
    throw new Error(`Notification dispatch failed: ${result.status}`);
};
export const config: Config = { schedule: '*/15 * * * *' };
