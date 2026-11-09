// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkEditorFlags from './src/lib/remark-editor-flags.mjs';
import rehypeTables from './src/lib/rehype-tables.mjs';

export default defineConfig({
  site: 'https://thelearningcurve.net',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  markdown: { remarkPlugins: [remarkEditorFlags], rehypePlugins: [rehypeTables] },
  integrations: [
    mdx(),
    sitemap({
      // Utility pages stay out of the sitemap: search, 404, admin and every thank-you page
      // (all noindex). A noindex page in the sitemap shows up in Search Console as an error.
      filter: (page) => !/\/(search|404|admin)\/?$/.test(page) && !/\/thanks\/?$/.test(page),
    }),
  ],
});
