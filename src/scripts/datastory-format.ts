// Number formats shared by the chart script and the build-time data tables.
// 'label' rounds for chart labels and tooltips; 'exact' keeps the source's precision (tables);
// 'axis' is for tick labels.
export type Format = 'percent' | 'number' | 'compact' | 'usd' | 'usd-billions' | 'millions' | 'sd';
type Mode = 'label' | 'exact' | 'axis';

const trim = (n: number, d: number) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('en-AU', { maximumFractionDigits: d });

export function format(f: Format, v: number | null, mode: Mode | boolean = 'label'): string {
  if (v == null) return '–';
  const m: Mode = mode === true ? 'axis' : mode === false ? 'label' : mode;
  const exact = m === 'exact', axis = m === 'axis';
  switch (f) {
    case 'percent': return `${trim(v, axis ? 0 : exact ? 2 : 1)}%`;
    case 'number': return trim(v, exact ? 2 : 1);
    case 'compact':
      if (exact) return trim(v, 0);
      if (Math.abs(v) >= 1e6) return `${trim(v / 1e6, 2)}M`;
      if (Math.abs(v) >= 1e3) return `${trim(v / 1e3, axis ? 0 : 1)}K`;
      return trim(v, 0);
    // Whole US dollars, e.g. salaries: US$69,280 in tables, US$69.3K on labels, US$70K on axes
    case 'usd':
      if (exact || Math.abs(v) < 1e3) return `US$${trim(v, 0)}`;
      return `US$${trim(v / 1e3, axis ? 0 : 1)}K`;
    case 'usd-billions': return `US$${trim(v, 1)}B`;
    case 'millions': return `${trim(v, 1)}M`;
    case 'sd': return `${trim(v, axis ? 1 : exact ? 3 : 2)} SD`;
  }
}
