import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://nikalikeone.github.io',
  base: process.env.DEPLOY_BASE || '/',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  server: { port: 4322, host: '127.0.0.1' },
});
