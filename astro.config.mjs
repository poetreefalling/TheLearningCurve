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
      // Utility pages stay out of the sitemap
      filter: (page) => !/\/(search|404|newsletter\/thanks)\/?$/.test(page),
    }),
  ],
});
