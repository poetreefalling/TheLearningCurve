// Video timelines (src/components/story/VideoTimeline.astro): as each segment's card scrolls into
// the middle of the screen, that segment and the ones before it are drawn onto the timeline, the
// playhead moves to its end, and the screen preview switches to what's on screen. Without this
// script every segment is drawn and every card reads in order. Under "reduce motion" the same
// states apply, with no animation (the CSS drops the transitions).

for (const sec of document.querySelectorAll<HTMLElement>('[data-vt]')) {
  const steps = [...sec.querySelectorAll<HTMLElement>('[data-vt-step]')];
  const segs = [...sec.querySelectorAll<HTMLElement>('[data-vt-seg]')];
  const playhead = sec.querySelector<HTMLElement>('[data-vt-playhead]');
  const screen = sec.querySelector<HTMLElement>('[data-vt-screen]');
  const time = sec.querySelector<HTMLElement>('[data-vt-time]');
  const label = sec.querySelector<HTMLElement>('[data-vt-label]');
  if (!steps.length) continue;

  let current = -1;
  const activate = (i: number) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
    for (const seg of segs) {
      const n = Number(seg.dataset.vtSeg);
      seg.classList.toggle('is-ahead', n > i);
      seg.classList.toggle('is-current', n === i);
    }
    const step = steps[i];
    const cur = segs.find((s) => Number(s.dataset.vtSeg) === i && s.classList.contains('vt-seg'));
    if (playhead && cur) {
      const left = parseFloat(cur.style.left), width = parseFloat(cur.style.width);
      playhead.style.left = `${left + width}%`;
    }
    if (screen) {
      screen.dataset.mode = step.dataset.mode;
      screen.toggleAttribute('data-inset', !!step.dataset.inset);
      screen.classList.remove('is-drawing');
      void screen.offsetWidth; // restart the pen stroke each time the drawing segment comes round
      if (step.dataset.mode === 'drawing') screen.classList.add('is-drawing');
    }
    if (time) time.textContent = step.dataset.time ?? '';
    if (label) label.textContent = step.dataset.label ?? '';
  };

  sec.classList.add('is-live');
  activate(0);

  const mobile = window.matchMedia('(max-width: 899px)').matches;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) activate(Number((e.target as HTMLElement).dataset.vtStep));
  }, { rootMargin: mobile ? '-40% 0px -55% 0px' : '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));

  // Tapping a segment on the timeline scrolls to its card.
  for (const seg of segs) {
    if (!(seg instanceof HTMLAnchorElement)) continue;
    seg.addEventListener('click', (ev) => {
      const target = steps[Number(seg.dataset.vtSeg)];
      if (!target) return;
      ev.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      target.querySelector<HTMLElement>('.vt-card-title')?.focus({ preventScroll: true });
    });
  }
}
