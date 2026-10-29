// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkEditorFlags from './src/lib/remark-editor-flags.mjs';

export default defineConfig({
  site: 'https://thelearningcurve.net',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  markdown: { remarkPlugins: [remarkEditorFlags] },
  integrations: [
    mdx(),
    sitemap({
      // Utility pages stay out of the sitemap
      filter: (page) => !/\/(search|404|newsletter\/thanks)\/?$/.test(page),
    }),
  ],
});
