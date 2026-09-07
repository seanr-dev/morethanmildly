import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://morethanmildly.netlify.app',
  output: 'server',
  adapter: netlify(),
  integrations: [react()],
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  server: { host: '0.0.0.0', port: 4173 },
  vite: { server: { allowedHosts: ['terminal.local'] } },
});
