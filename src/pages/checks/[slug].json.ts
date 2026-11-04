// /checks/<slug>.json: the shape of each article's quiz or poll (how many questions, how many
// options each). The results API (functions/api/check/[slug].ts) reads it to refuse answers that
// don't fit, so nobody can add arbitrary keys to the tally. No question text and no answers here.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getArticles, slugOf, isLive } from '../../lib/articles';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = await getArticles();
  return all
    .filter((a) => a.data.readerCheck)
    .map((a) => ({
      params: { slug: slugOf(a) },
      props: {
        kind: a.data.readerCheck!.kind,
        options: a.data.readerCheck!.questions.map((q) => q.options.length),
        live: isLive(a),
      },
    }));
};

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props), { headers: { 'Content-Type': 'application/json' } });
