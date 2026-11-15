"""Temporary: fetch candidate header logos from vendor sites (run by .github/workflows/logo-fetch.yml).

For each product it opens the vendor page in Chromium, finds the likeliest logo elements
(img or inline svg near the top, marked "logo" or linking home), and saves:
  logo-candidates/<id>/cand-<n>.<ext>   the original file (svg/png/webp/jpg) or svg markup
  logo-candidates/<id>/cand-<n>-render.png   an element render at 4x, transparent background
  logo-candidates/<id>/icon.<ext>   apple-touch-icon, as a fallback
  logo-candidates/report.json
Nothing here is altered; choosing and cropping happens afterwards.
"""
import json, os, re, sys
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

SITES = {
    "active-dictionary": "https://activedictionary.com/",
    "adobe-captivate": "https://www.adobe.com/products/captivate.html",
    "articulate-360-ai": "https://www.articulate.com/360/ai-assistant/",
    "articulate-360": "https://www.articulate.com/360/",
    "bodyswaps": "https://bodyswaps.co/",
    "brisk-teaching": "https://www.briskteaching.com/",
    "camtasia": "https://www.techsmith.com/camtasia/",
    "chatgpt": "https://chatgpt.com/",
    "claude": "https://claude.com/product/overview",
    "colossyan": "https://www.colossyan.com/",
    "coursebox": "https://www.coursebox.ai/",
    "curipod": "https://curipod.com/",
    "diffit": "https://diffit.me/",
    "dominknow-one": "https://www.dominknow.com/",
    "duolingo-max": "https://www.duolingo.com/",
    "edpuzzle": "https://edpuzzle.com/",
    "evolve": "https://www.intellum.com/products/evolve-content-authoring",
    "gemini-for-education": "https://gemini.google/",
    "genially": "https://genially.com/",
    "gradescope": "https://www.gradescope.com/",
    "grammarly": "https://www.grammarly.com/",
    "h5p": "https://h5p.org/",
    "heygen": "https://www.heygen.com/",
    "hihaho": "https://hihaho.com/",
    "ispring-suite": "https://www.ispringsolutions.com/ispring-suite",
    "kahoot": "https://kahoot.com/",
    "kaltura": "https://corp.kaltura.com/",
    "khanmigo": "https://www.khanmigo.ai/",
    "kulissa-maya": "https://kulissa.com/",
    "labster": "https://www.labster.com/",
    "magicschool-ai": "https://www.magicschool.ai/",
    "microsoft-copilot": "https://www.microsoft.com/en-us/microsoft-copilot/",
    "mindsmith": "https://www.mindsmith.ai/",
    "mindstamp": "https://mindstamp.com/",
    "mursion": "https://www.mursion.com/",
    "nearpod": "https://nearpod.com/",
    "notebooklm": "https://notebooklm.google/",
    "panopto": "https://www.panopto.com/",
    "perplexity": "https://www.perplexity.ai/",
    "photomath": "https://photomath.com/",
    "playposit": "https://www.playposit.com/",
    "quizlet": "https://quizlet.com/",
    "schoolai": "https://schoolai.com/",
    "synthesia": "https://www.synthesia.io/",
    "teachable": "https://www.teachable.com/",
    "thinglink": "https://www.thinglink.com/",
    "thinkific": "https://www.thinkific.com/",
    "turnitin": "https://www.turnitin.com/",
    "vimeo-enterprise": "https://vimeo.com/enterprise",
    "vyond": "https://www.vyond.com/",
    "wayground": "https://wayground.com/",
    "yuja-lumina": "https://www.yuja.com/",
}

FIND = r"""
(home) => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width >= 16 && r.height >= 10 && r.top < 260 && r.bottom > 0; };
  const hasLogo = el => { for (let n = el, i = 0; n && i < 5; n = n.parentElement, i++) {
      const s = [n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className, n.id,
        n.getAttribute && n.getAttribute('alt'), n.getAttribute && n.getAttribute('aria-label'),
        n.getAttribute && n.getAttribute('title'), n.getAttribute && n.getAttribute('src')].join(' ');
      if (/logo|brand|wordmark/i.test(s)) return true; } return false; };
  const linksHome = el => { const a = el.closest('a'); if (!a) return false;
      try { const u = new URL(a.href, location.href); return u.pathname === '/' || u.pathname === '' || a.href === home; } catch (e) { return false; } };
  const els = [...document.querySelectorAll('img, svg')].filter(el => !(el.tagName.toLowerCase() === 'svg' && el.parentElement && el.parentElement.closest('svg')));
  const scored = [];
  for (const el of els) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    let s = 0;
    if (hasLogo(el)) s += 3;
    if (el.closest('header, nav, [role=banner]')) s += 2;
    if (linksHome(el)) s += 2;
    if (r.left < 400) s += 1;
    if (r.top < 140) s += 1;
    if (r.width > 40) s += 1;
    if (s >= 4) scored.push([s, el]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, 4).map(([s, el], i) => {
    el.setAttribute('data-logocand', String(i));
    const tag = el.tagName.toLowerCase();
    const r = el.getBoundingClientRect();
    return { i, score: s, tag, src: tag === 'img' ? (el.currentSrc || el.src) : null,
             alt: el.getAttribute('alt') || el.getAttribute('aria-label') || '',
             svg: tag === 'svg' ? el.outerHTML : null, w: Math.round(r.width), h: Math.round(r.height) };
  });
}
"""

EXT = {"image/svg+xml": "svg", "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg", "image/gif": "gif", "image/avif": "avif"}


def main(out="logo-candidates"):
    os.makedirs(out, exist_ok=True)
    only = sys.argv[1:] or list(SITES)
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=4,
                                  user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
                                  locale="en-AU")
        for pid in only:
            url = SITES[pid]
            d = os.path.join(out, pid); os.makedirs(d, exist_ok=True)
            rec = {"url": url, "candidates": [], "error": None}
            page = ctx.new_page()
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(4000)
                rec["finalUrl"] = page.url
                cands = page.evaluate(FIND, url)
                for c in cands:
                    n = c["i"]
                    try:
                        if c["tag"] == "svg":
                            svg = c["svg"]
                            if "xmlns=" not in svg[:200]:
                                svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
                            open(os.path.join(d, f"cand-{n}.svg"), "w").write(svg)
                            c["file"] = f"cand-{n}.svg"
                        elif c["src"] and not c["src"].startswith("data:"):
                            r = page.request.get(c["src"], timeout=30000)
                            ct = (r.headers.get("content-type") or "").split(";")[0].strip()
                            ext = EXT.get(ct) or (re.search(r"\.(svg|png|webp|jpe?g|gif|avif)(\?|$)", c["src"], re.I) or [None, "bin"])[1]
                            open(os.path.join(d, f"cand-{n}.{ext}"), "wb").write(r.body())
                            c["file"] = f"cand-{n}.{ext}"; c["contentType"] = ct
                        elif c["src"]:
                            c["file"] = None; c["note"] = "data URI"
                        page.locator(f'[data-logocand="{n}"]').first.screenshot(path=os.path.join(d, f"cand-{n}-render.png"), omit_background=True, timeout=10000)
                    except Exception as e:
                        c["error"] = str(e)[:200]
                    c.pop("svg", None)
                    rec["candidates"].append(c)
                icon = page.evaluate("() => { const l = document.querySelector('link[rel*=apple-touch-icon], link[rel=icon][sizes]'); return l ? l.href : null; }")
                if icon:
                    try:
                        r = page.request.get(icon, timeout=20000)
                        ct = (r.headers.get("content-type") or "").split(";")[0].strip()
                        ext = EXT.get(ct, "png")
                        open(os.path.join(d, f"icon.{ext}"), "wb").write(r.body()); rec["icon"] = icon
                    except Exception as e:
                        rec["iconError"] = str(e)[:200]
                page.screenshot(path=os.path.join(d, "header.png"), clip={"x": 0, "y": 0, "width": 1440, "height": 180})
            except Exception as e:
                rec["error"] = str(e)[:300]
            finally:
                page.close()
            report[pid] = rec
            print(pid, len(rec["candidates"]), rec["error"] or "", flush=True)
        browser.close()
    json.dump(report, open(os.path.join(out, "report.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
