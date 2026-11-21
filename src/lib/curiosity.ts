import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_UNPUBLISHED } from './articles';

export type Curiosity = CollectionEntry<'curiosity'>;

const NOW = new Date();
export const curiosityUrl = (c: Curiosity) => `/curiosity/${c.id}/`;
export const slideSrc = (c: Curiosity, i: number) => `/images/curiosity/${c.id}/${String(i + 1).padStart(2, '0')}.jpg`;
export const isLiveCuriosity = (c: Curiosity) => !c.data.draft && c.data.published <= NOW;

/** Newest first; drafts and future-dated posts only on preview builds. */
export async function getCuriosities(): Promise<Curiosity[]> {
  const all = await getCollection('curiosity');
  return all
    .filter((c) => SHOW_UNPUBLISHED || isLiveCuriosity(c))
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

export const CORNER = {
  name: 'Curiosity Corner',
  blurb: 'Short puzzles, curiosities and brain facts: how your brain learns, remembers and gets fooled. Every fact with its source.',
};
