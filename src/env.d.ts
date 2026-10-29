/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    // Set by the article page so inline MDX components can read the article's data
    article?: import('astro:content').CollectionEntry<'articles'>;
  }
}
