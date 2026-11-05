// Interactive data-story charts. Each <figure data-story-chart> carries its data as JSON
// (from src/data/stories/<id>.json) and is drawn here as SVG. A chart moves between "views"
// (reveal up to a year, highlight a series, focus a bar, show an annotation) when a <Scrolly>
// step scrolls into place, or once when a standalone chart first comes into view.
// Hover or keyboard focus shows a tooltip; the legend toggles series. No dependencies.

type Series = { id: string; label: string; values: (number | null)[]; estimate?: boolean[] };
type View = { upTo?: number; highlight?: string[]; focus?: number[]; annotations: { at: number; series?: string; text: string }[] };
type Story = {
  title: string; subtitle: string; type: 'line' | 'column' | 'bar' | 'groupedBar';
  format: 'percent' | 'number' | 'compact' | 'usd-billions' | 'millions' | 'sd';
  yMax?: number; categories: string[]; series: Series[]; views: Record<string, View>;
};

import { format } from './datastory-format';

const NS = 'http://www.w3.org/2000/svg';
const COLORS = ['var(--dv-1)', 'var(--dv-2)', 'var(--dv-3)'];
const FULL: View = { annotations: [] };
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ctx2d: CanvasRenderingContext2D | null = null;
function textW(t: string, font = '600 13px Inter Variable, Inter, system-ui, sans-serif') {
  ctx2d ??= document.createElement('canvas').getContext('2d');
  if (!ctx2d) return t.length * 7.5;
  ctx2d.font = font;
  return ctx2d.measureText(t).width;
}

// Clean tick step: 1, 2, 2.5 or 5 × 10^k, giving 4–6 ticks
function ticksFor(max: number) {
  const raw = max / 5;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((st) => max / st <= 6) ?? 10 * p;
  const top = Math.ceil(max / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

function niceMax(max: number) {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

// Rounded data-end, square at the baseline (columns grow up; bars grow right)
function colPath(x: number, y: number, w: number, h: number) {
  if (h <= 0.5) return `M${x},${y + h}h${w}v0h${-w}Z`;
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
function barPath(x: number, y: number, w: number, h: number) {
  if (w <= 0.5) return `M${x},${y}h0v${h}h0Z`;
  const r = Math.min(4, h / 2, w);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}

type Geo = Record<string, number[]>; // element key -> numbers to tween

class StoryChart {
  root: HTMLElement;
  data: Story;
  wrap: HTMLElement;
  tip: HTMLElement;
  hidden = new Set<string>();
  view: View = FULL;
  geo: Geo = {};
  raf = 0;
  width = 0;
  hover: number | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.data = JSON.parse(root.querySelector('script[type="application/json"]')!.textContent!);
    this.wrap = root.querySelector('[data-chart-canvas]')!;
    this.wrap.textContent = '';
    this.tip = document.createElement('div');
    this.tip.className = 'dv-tip';
    this.tip.hidden = true;
    this.wrap.appendChild(this.tip);
    root.classList.add('is-live');
    this.legend();
    const initial = root.dataset.view;
    this.view = initial && this.data.views[initial] ? this.data.views[initial] : FULL;
    new ResizeObserver(() => {
      const w = Math.round(this.wrap.clientWidth);
      if (w && w !== this.width) { this.width = w; this.render(false); }
    }).observe(this.wrap);
  }

  setView(name: string | undefined, animate = true) {
    const next = name && this.data.views[name] ? this.data.views[name] : FULL;
    if (next === this.view) return;
    this.view = next;
    this.render(animate && !reduceMotion());
  }

  legend() {
    const box = this.root.querySelector<HTMLElement>('[data-chart-legend]');
    if (!box || this.data.series.length < 2) return;
    box.textContent = '';
    this.data.series.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `dv-key dv-key-${this.data.type === 'line' ? 'line' : 'rect'}`;
      b.style.setProperty('--c', COLORS[i]);
      b.setAttribute('aria-pressed', 'true');
      b.textContent = s.label;
      b.addEventListener('click', () => {
        const on = !this.hidden.has(s.id);
        if (on && this.hidden.size === this.data.series.length - 1) return; // keep one visible
        on ? this.hidden.add(s.id) : this.hidden.delete(s.id);
        b.setAttribute('aria-pressed', String(!on));
        this.render(!reduceMotion());
      });
      box.appendChild(b);
    });
  }

  visibleSeries() {
    return this.data.series.map((s, i) => ({ s, i })).filter(({ s }) => !this.hidden.has(s.id));
  }

  alpha(id: string) {
    const h = this.view.highlight;
    return !h || h.includes(id) ? 1 : 0.22;
  }

  render(animate: boolean) {
    const d = this.data;
    const W = this.width || this.wrap.clientWidth || 640;
    const narrow = W < 520;
    const old = this.wrap.querySelector('svg');
    const svg = el('svg', { role: 'img', 'aria-label': d.title, tabindex: 0, focusable: 'true' });
    const upTo = this.view.upTo ?? d.categories.length - 1;
    const target: Geo = {};
    const draws: (() => void)[] = []; // apply geometry for a given frame
    const all = d.series.flatMap((s) => s.values.filter((v): v is number => v != null));
    const max = d.yMax ?? niceMax(Math.max(...all) * 1.05);

    if (d.type === 'line' || d.type === 'column') {
      const H = narrow ? 260 : 340;
      const ticks = ticksFor(max);
      const top = ticks[ticks.length - 1];
      const tickW = Math.max(...ticks.map((v) => textW(format(d.format, v, true), '400 12px Inter Variable, Inter, system-ui, sans-serif')));
      const endW = d.type !== 'line' ? 0 : Math.max(...this.visibleSeries().map(({ s }) => {
        const lv = [...s.values].slice(0, (this.view.upTo ?? d.categories.length - 1) + 1).filter((v) => v != null).pop() ?? 0;
        return textW(narrow ? format(d.format, lv) : `${s.label} ${format(d.format, lv)}`);
      }));
      const m = { t: 28, r: d.type === 'line' ? Math.min(W * 0.42, endW + 18) : 8, b: 30, l: Math.ceil(tickW) + 12 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const n = d.categories.length;
      const band = iw / n;
      const xc = (i: number) => (d.type === 'line' ? m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw) : m.l + band * i + band / 2);
      const y = (v: number) => m.t + ih - (v / top) * ih;
      // grid + y axis
      for (const v of ticks) {
        el('line', { class: 'dv-grid', x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, svg);
        const lab = el('text', { class: 'dv-axis', x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg);
        lab.textContent = format(d.format, v, true);
      }
      // x labels (thin out on narrow screens)
      const lw = Math.max(...d.categories.map((c) => textW(c + '*', '400 12px Inter Variable, Inter, system-ui, sans-serif'))) + 14;
      const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / lw))));
      d.categories.forEach((c, i) => {
        if (i % every && i !== n - 1) return;
        const t = el('text', { class: 'dv-axis', x: xc(i), y: H - 8, 'text-anchor': 'middle' }, svg);
        t.textContent = c + (d.series.some((s) => s.estimate?.[i]) ? '*' : '');
      });

      if (d.type === 'line') {
        const endLabels: { y: number; text: string; i: number; strong: boolean }[] = [];
        this.visibleSeries().forEach(({ s, i }) => {
          const pts: number[] = [];
          let last = 0;
          s.values.forEach((v, k) => {
            const kk = Math.min(k, upTo);
            const vv = s.values[kk];
            if (v == null || vv == null) return;
            pts.push(xc(kk), y(vv));
            if (k <= upTo) last = k;
          });
          const key = `line:${s.id}`;
          target[key] = pts;
          const path = el('path', { class: 'dv-line', stroke: COLORS[i], 'stroke-opacity': this.alpha(s.id) }, svg);
          const dot = el('circle', { class: 'dv-dot', r: 4.5, fill: COLORS[i], 'fill-opacity': this.alpha(s.id) }, svg);
          draws.push(() => {
            const g = this.geo[key] ?? target[key];
            let dstr = '';
            for (let p = 0; p < g.length; p += 2) dstr += `${p ? 'L' : 'M'}${g[p].toFixed(1)},${g[p + 1].toFixed(1)}`;
            path.setAttribute('d', dstr);
            dot.setAttribute('cx', String(g[g.length - 2]));
            dot.setAttribute('cy', String(g[g.length - 1]));
          });
          const lv = s.values[last];
          const annotated = this.view.annotations.some((a) => a.at === last && (a.series ?? d.series[0].id) === s.id);
          if (lv != null && !annotated) endLabels.push({ y: y(lv), text: narrow ? format(d.format, lv) : `${s.label} ${format(d.format, lv)}`, i, strong: this.alpha(s.id) === 1 });
        });
        // direct end labels: strongest first, skip collisions
        const placed: number[] = [];
        endLabels.sort((a, b) => Number(b.strong) - Number(a.strong)).forEach((l) => {
          if (placed.some((p) => Math.abs(p - l.y) < 15)) return;
          placed.push(l.y);
          const xEnd = xc(Math.min(upTo, n - 1));
          const t = el('text', { class: `dv-end${l.strong ? '' : ' is-muted'}`, x: xEnd + 10, y: l.y + 4 }, svg);
          t.textContent = l.text;
        });
      } else {
        // columns
        const vs = this.visibleSeries();
        const gw = Math.min(24, (band * 0.7) / vs.length);
        // Value labels fit their column, decided once per chart so every label matches:
        // drop the currency prefix if the longest label is too wide, then shrink (to 10px) if needed.
        const room = band - 6;
        const raw = vs.flatMap(({ s }) => s.values.map((v, k) => (v == null ? '' : format(d.format, v) + (s.estimate?.[k] ? '*' : ''))));
        const strip = Math.max(0, ...raw.map((t) => textW(t))) > room;
        const fit = (t: string) => (strip ? t.replace(/^US\$/, '') : t);
        const widest = Math.max(1, ...raw.map((t) => textW(fit(t))));
        const valSize = widest > room ? Math.max(10, Math.floor((13 * room) / widest)) : 0;
        vs.forEach(({ s, i }, j) => {
          s.values.forEach((v, k) => {
            const key = `col:${s.id}:${k}`;
            const show = k <= upTo && v != null;
            const x0 = m.l + band * k + (band - gw * vs.length - 2 * (vs.length - 1)) / 2 + j * (gw + 2);
            const top = show ? y(v!) : y(0);
            target[key] = [x0, top, gw, y(0) - top];
            const focus = this.view.focus;
            const op = (focus && !focus.includes(k) ? 0.3 : 1) * this.alpha(s.id) * (s.estimate?.[k] ? 0.5 : 1);
            const p = el('path', { class: 'dv-col', fill: COLORS[i], 'fill-opacity': op }, svg);
            draws.push(() => { const g = this.geo[key] ?? target[key]; p.setAttribute('d', colPath(g[0], g[1], g[2], g[3])); });
            if (show && (!focus || focus.includes(k)) && (vs.length === 1)) {
              const lbl = el('text', { class: 'dv-val', x: x0 + gw / 2, y: top - 6, 'text-anchor': 'middle' }, svg);
              if (!narrow || focus?.includes(k) || k === upTo) {
                lbl.textContent = fit(format(d.format, v!) + (s.estimate?.[k] ? '*' : ''));
                if (valSize) (lbl as SVGTextElement).style.fontSize = `${valSize}px`;
              }
            }
          });
        });
      }
      this.annotate(svg, (i, sid) => {
        const s = d.series.find((x) => x.id === sid) ?? d.series[0];
        const v = s.values[i];
        return v == null ? null : [xc(i), y(v)];
      }, W);
      this.hoverLayer(svg, m.l, m.t, iw, ih, n, (i) => xc(i), H);
    } else {
      // horizontal bars (single or grouped)
      const vs = this.visibleSeries();
      const barH = d.type === 'groupedBar' ? 12 : 20;
      const rowH = 30 + vs.length * (barH + 3);
      const valW = Math.max(...vs.flatMap(({ s }) => s.values.map((v) => textW(format(d.format, v)))));
      const m = { t: 4, r: Math.ceil(valW) + 12, b: 8, l: 0 };
      const H = m.t + d.categories.length * rowH + m.b;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const iw = W - m.l - m.r;
      const x = (v: number) => (v / max) * iw;
      d.categories.forEach((c, k) => {
        const y0 = m.t + k * rowH;
        const focus = this.view.focus;
        const dim = focus && !focus.includes(k);
        const t = el('text', { class: `dv-cat${dim ? ' is-muted' : ''}`, x: 0, y: y0 + 15 }, svg);
        t.textContent = c;
        vs.forEach(({ s, i }, j) => {
          const v = s.values[k];
          const key = `bar:${s.id}:${k}`;
          const by = y0 + 22 + j * (barH + 3);
          target[key] = [m.l, by, v == null ? 0 : x(v), barH];
          const p = el('path', { class: 'dv-col', fill: COLORS[i], 'fill-opacity': (dim ? 0.3 : 1) * this.alpha(s.id) }, svg);
          const val = el('text', { class: `dv-val${dim ? ' is-muted' : ''}`, y: by + barH / 2 + 4 }, svg);
          val.textContent = format(d.format, v);
          draws.push(() => {
            const g = this.geo[key] ?? target[key];
            p.setAttribute('d', barPath(g[0], g[1], g[2], g[3]));
            val.setAttribute('x', String(g[0] + g[2] + 6));
          });
        });
        // hit target for the row
        const hit = el('rect', { class: 'dv-hit', x: 0, y: y0, width: W, height: rowH }, svg);
        hit.addEventListener('pointerenter', () => this.showRow(k, hit));
        hit.addEventListener('pointerleave', () => this.hideTip());
      });
      svg.addEventListener('keydown', (e) => this.keys(e as KeyboardEvent, d.categories.length, (k) => {
        const hits = svg.querySelectorAll<SVGRectElement>('.dv-hit');
        this.showRow(k, hits[k]);
      }));
      svg.addEventListener('blur', () => this.hideTip());
    }

    if (old) old.replaceWith(svg); else this.wrap.prepend(svg);
    this.tween(target, draws, animate);
  }

  annotate(svg: SVGSVGElement, at: (i: number, sid?: string) => [number, number] | null, W: number) {
    for (const a of this.view.annotations) {
      const p = at(a.at, a.series);
      if (!p) continue;
      const g = el('g', { class: 'dv-note' }, svg);
      el('circle', { cx: p[0], cy: p[1], r: 6, class: 'dv-note-ring' }, g);
      const right = p[0] > W * 0.6;
      const t = el('text', { x: p[0] + (right ? -10 : 10), y: Math.max(14, p[1] - 12), 'text-anchor': right ? 'end' : 'start' }, g);
      t.textContent = a.text;
    }
  }

  hoverLayer(svg: SVGSVGElement, x0: number, y0: number, iw: number, ih: number, n: number, xc: (i: number) => number, H: number) {
    const line = el('line', { class: 'dv-cross', y1: y0, y2: y0 + ih, x1: x0, x2: x0, opacity: 0 }, svg);
    const hit = el('rect', { class: 'dv-hit', x: x0, y: 0, width: iw, height: H }, svg);
    const pick = (clientX: number) => {
      const r = svg.getBoundingClientRect();
      const sx = ((clientX - r.left) / r.width) * (this.width || r.width);
      let best = 0;
      for (let i = 1; i < n; i++) if (Math.abs(xc(i) - sx) < Math.abs(xc(best) - sx)) best = i;
      return best;
    };
    const show = (i: number) => {
      const upTo = this.view.upTo ?? n - 1;
      if (i > upTo) i = upTo;
      this.hover = i;
      line.setAttribute('x1', String(xc(i)));
      line.setAttribute('x2', String(xc(i)));
      line.setAttribute('opacity', '1');
      this.showCol(i, xc(i) / (this.width || 1));
    };
    hit.addEventListener('pointermove', (e) => show(pick((e as PointerEvent).clientX)));
    hit.addEventListener('pointerleave', () => { this.hideTip(); line.setAttribute('opacity', '0'); });
    svg.addEventListener('keydown', (e) => this.keys(e as KeyboardEvent, n, show));
    svg.addEventListener('blur', () => { this.hideTip(); line.setAttribute('opacity', '0'); });
  }

  keys(e: KeyboardEvent, n: number, show: (i: number) => void) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Escape') return this.hideTip();
    const cur = this.hover ?? -1;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 :
      ['ArrowLeft', 'ArrowUp'].includes(e.key) ? Math.max(0, cur - 1) : Math.min(n - 1, cur + 1);
    this.hover = next;
    show(next);
  }

  tipRows(title: string, rows: { color: string; value: string; label: string }[], note?: string) {
    this.tip.textContent = '';
    const h = document.createElement('div');
    h.className = 'dv-tip-title';
    h.textContent = title;
    this.tip.appendChild(h);
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'dv-tip-row';
      row.style.setProperty('--c', r.color);
      const v = document.createElement('strong');
      v.textContent = r.value;
      const l = document.createElement('span');
      l.textContent = r.label;
      row.append(v, l);
      this.tip.appendChild(row);
    }
    if (note) {
      const nEl = document.createElement('div');
      nEl.className = 'dv-tip-note';
      nEl.textContent = note;
      this.tip.appendChild(nEl);
    }
    this.tip.hidden = false;
  }

  showCol(i: number, frac: number) {
    const d = this.data;
    const rows = this.visibleSeries().map(({ s, i: ci }) => ({ color: COLORS[ci], value: format(d.format, s.values[i]), label: d.series.length > 1 ? s.label : '' }));
    const est = d.series.some((s) => s.estimate?.[i]);
    this.tipRows(d.categories[i], rows, est ? 'Estimate published before the year ended' : undefined);
    this.tip.style.left = `${Math.min(Math.max(frac * 100, 12), 88)}%`;
    this.tip.style.top = '0';
    this.tip.classList.toggle('is-left', frac > 0.6);
  }

  showRow(k: number, hit: SVGRectElement) {
    const d = this.data;
    this.hover = k;
    const rows = this.visibleSeries().map(({ s, i }) => ({ color: COLORS[i], value: format(d.format, s.values[k]), label: d.series.length > 1 ? s.label : '' }));
    this.tipRows(d.categories[k], rows);
    const svg = hit.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const top = (Number(hit.getAttribute('y')) / vb.height) * 100;
    this.tip.style.left = '60%';
    this.tip.style.top = `calc(${top}% - 8px)`;
    this.tip.classList.remove('is-left');
  }

  hideTip() { this.tip.hidden = true; this.hover = null; }

  tween(target: Geo, draws: (() => void)[], animate: boolean) {
    cancelAnimationFrame(this.raf);
    const from: Geo = {};
    for (const k of Object.keys(target)) {
      const prev = this.geo[k];
      // new elements grow from the baseline / their own start
      from[k] = prev && prev.length === target[k].length ? prev : target[k].map((v, i, arr) => {
        if (k.startsWith('col:')) return i === 1 ? arr[1] + arr[3] : i === 3 ? 0 : v;
        if (k.startsWith('bar:')) return i === 2 ? 0 : v;
        if (k.startsWith('line:')) return i % 2 ? v : arr[0];
        return v;
      });
    }
    const done = () => { this.geo = target; draws.forEach((f) => f()); };
    if (!animate) return done();
    const t0 = performance.now(), dur = 700;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = ease(Math.min(1, (now - t0) / dur));
      const cur: Geo = {};
      for (const k of Object.keys(target)) cur[k] = target[k].map((v, i) => from[k][i] + (v - from[k][i]) * t);
      this.geo = cur;
      draws.forEach((f) => f());
      if (t < 1) this.raf = requestAnimationFrame(step); else done();
    };
    this.geo = from;
    draws.forEach((f) => f());
    this.raf = requestAnimationFrame(step);
  }
}

// ---- wiring ----
const charts = new Map<HTMLElement, StoryChart>();
for (const fig of document.querySelectorAll<HTMLElement>('[data-story-chart]')) {
  const scrolly = fig.closest('[data-scrolly]');
  const chart = new StoryChart(fig);
  charts.set(fig, chart);
  if (!scrolly && !reduceMotion()) {
    // Standalone: grow in from the baseline the first time it's on screen
    fig.classList.add('is-waiting');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fig.classList.remove('is-waiting');
      chart.geo = {};
      chart.render(true);
    }, { threshold: 0.3 });
    io.observe(fig);
  }
}

for (const sec of document.querySelectorAll<HTMLElement>('[data-scrolly]')) {
  const fig = sec.querySelector<HTMLElement>('[data-story-chart]');
  const chart = fig && charts.get(fig);
  if (!chart) continue;
  const steps = [...sec.querySelectorAll<HTMLElement>('[data-step]')];
  const activate = (s: HTMLElement) => {
    steps.forEach((x) => x.classList.toggle('is-active', x === s));
    chart.setView(s.dataset.view);
  };
  if (steps[0]) chart.setView(steps[0].dataset.view, false);
  const mobile = window.matchMedia('(max-width: 899px)').matches;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) activate(e.target as HTMLElement);
  }, { rootMargin: mobile ? '-72% 0px -20% 0px' : '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));

  // On phones the cards scroll over the sticky chart: dim the chart while any card overlaps it.
  const graphic = sec.querySelector<HTMLElement>('.scrolly-graphic');
  const cards = [...sec.querySelectorAll<HTMLElement>('.scrolly-card')];
  const narrowQ = window.matchMedia('(max-width: 899px)');
  let ticking = false;
  const checkCover = () => {
    ticking = false;
    if (!graphic || !narrowQ.matches) return sec.classList.remove('is-covered');
    const g = graphic.getBoundingClientRect();
    const covered = cards.some((c) => { const r = c.getBoundingClientRect(); return r.top < g.bottom - 8 && r.bottom > g.top + 8; });
    sec.classList.toggle('is-covered', covered);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(checkCover); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  checkCover();
}

// ---- stat counters ----
for (const stat of document.querySelectorAll<HTMLElement>('[data-stat]')) {
  const out = stat.querySelector<HTMLElement>('[data-stat-value]')!;
  const target = Number(stat.dataset.value);
  const decimals = (stat.dataset.value!.split('.')[1] ?? '').length;
  const pre = stat.dataset.prefix ?? '', suf = stat.dataset.suffix ?? '';
  const paint = (v: number) => (out.textContent = `${pre}${v.toLocaleString('en-AU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suf}`);
  if (reduceMotion()) continue;
  paint(0);
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1100;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      paint(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step); else paint(target);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.5 });
  io.observe(stat);
}
