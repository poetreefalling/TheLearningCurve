// /comments/<slug>.json: which articles open a Listening Post, and whether each is live. The
// comments API (functions/api/comments/[slug].ts) reads it to refuse notes on any other page.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getArticles, slugOf, isLive, urlOf } from '../../lib/articles';
import { SITE } from '../../site.config';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = await getArticles();
  return all
    .filter((a) => a.data.listeningPost)
    .map((a) => ({
      params: { slug: slugOf(a) },
      props: { live: isLive(a), title: a.data.title, url: new URL(urlOf(a), SITE.url).href },
    }));
};

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props), { headers: { 'Content-Type': 'application/json' } });
