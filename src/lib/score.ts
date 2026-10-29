export const LEARNING = ['retrieval', 'assessment', 'credentials', 'analytics'] as const;
export const BUSINESS = ['pricing', 'payments', 'marketing'] as const;
export const LABELS: Record<string, string> = {
  retrieval: 'Retrieval',
  assessment: 'Assessment',
  credentials: 'Credentials',
  analytics: 'Learner analytics',
  pricing: 'Pricing',
  payments: 'Payments',
  marketing: 'Marketing',
};

type Scores = Record<(typeof LEARNING)[number] | (typeof BUSINESS)[number], number>;

/** Learning design is weighted 60%, business tools 40% (see /how-we-review/). */
export function overall(s: Scores) {
  const learning = LEARNING.reduce((t, k) => t + s[k], 0) / LEARNING.length;
  const business = BUSINESS.reduce((t, k) => t + s[k], 0) / BUSINESS.length;
  return Math.round((learning * 0.6 + business * 0.4) * 10) / 10;
}
