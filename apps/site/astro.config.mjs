import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './src',
  publicDir: './public',
  /* SITE_OUT_DIR lets CI gates build into a scratch dir — astro wipes the
     outDir on build, so a gate build must never target the working dist. */
  outDir: process.env.SITE_OUT_DIR || './dist',
  site: 'https://simalme.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    ssr: {
      external: ['pg'],
    },
    /* dev-only: /api proxies to the local portal, mirroring the production
     * nginx location / → portal:8090 rule (infra/nginx/portal-staging.conf) */
    server: {
      proxy: {
        '/api': process.env.PORTAL_URL || 'http://127.0.0.1:8090',
      },
    },
  },
});
