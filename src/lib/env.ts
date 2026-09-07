export function env(key: string): string {
  return (
    (typeof Netlify !== 'undefined' ? Netlify.env.get(key) : undefined) ||
    process.env[key] ||
    import.meta.env?.[key] ||
    ''
  );
}
export const siteOrigin = () =>
  env('PUBLIC_SITE_URL') || 'https://morethanmildly.netlify.app';
