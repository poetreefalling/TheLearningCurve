#!/usr/bin/env python3
"""Import the directory data-entry workbook into the JSON records.

Usage:
  python3 scripts/import-directory-xlsx.py <workbook.xlsx> [--annotate <out.xlsx>]

Reads the Products, Vendors and Research tasks sheets and updates
src/data/directory/products/<id>.json and src/data/directory/vendors/<id>.json in place.
Fields the workbook doesn't cover (summary, features, integrations, alternatives, evidence,
assurance) are kept as they are.

Anything the workbook leaves out, or a value that doesn't fit the schema, is not guessed:
it is recorded in the record's researchTasks as a line starting "* ", so the gap is visible
in the review desk and the record stays a draft until someone resolves it. With --annotate,
a copy of the workbook is written with each of those cells prefixed "* " and a comment saying
why.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl
from openpyxl.comments import Comment

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / 'src/data/directory/products'
VENDORS = ROOT / 'src/data/directory/vendors'

MARKETS = {'higher-education', 'schools', 'vet', 'corporate', 'government', 'creators', 'nonprofit'}
BASES = {'per-seat', 'per-active-user', 'per-learner', 'flat', 'usage', 'quote', 'free', 'open-source'}
DEPLOY = {'cloud', 'self-hosted', 'hybrid'}
STANDARDS = ['lti-1.1', 'lti-1.3', 'lti-advantage', 'scorm-1.2', 'scorm-2004', 'xapi', 'cmi5', 'aicc',
             'qti', 'caliper', 'oneroster', 'open-badges-2', 'open-badges-3', 'clr']
TRAINS = {'no', 'yes', 'opt-out', 'opt-in', 'not-disclosed'}
ORIGINS = {'verified', 'vendor-supplied', 'estimated'}
OWNERSHIP = {'independent', 'venture-backed', 'private-equity', 'public', 'subsidiary', 'open-source', 'other'}
URL = re.compile(r'^https?://\S+$')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

flags = []  # (sheet, row, header, note)


def text(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def split(v):
    """Split on semicolons that aren't inside brackets."""
    s = text(v)
    if not s:
        return []
    out, buf, depth = [], '', 0
    for ch in s:
        depth += ch == '('
        depth -= ch == ')' and depth > 0
        if ch == ';' and depth == 0:
            out.append(buf)
            buf = ''
        else:
            buf += ch
    out.append(buf)
    return [x.strip() for x in out if x.strip()]


def sheet_rows(ws):
    hdr = [c.value for c in ws[1]]
    for r in range(2, ws.max_row + 1):
        row = {hdr[i]: ws.cell(r, i + 1).value for i in range(len(hdr))}
        if text(row.get('id')):
            yield r, row


class Record:
    def __init__(self, sheet, row_no, rid):
        self.sheet, self.row_no, self.rid, self.notes = sheet, row_no, rid, []

    def flag(self, header, note):
        flags.append((self.sheet, self.row_no, header, note))
        self.notes.append(f'* {header}: {note}')


def fact(rec, value, source, checked, origin, header, fallback_checked, existing=None):
    """Wrap a value in a provenance record, or return None (and flag) if it can't be."""
    src = text(source)
    if not src or not URL.match(src):
        rec.flag(header, 'no source URL, so the value is not stored. Add the page it came from.')
        return None
    chk = text(checked) or fallback_checked
    if not chk or not DATE.match(str(chk)[:10]):
        rec.flag(header, f'checked date "{checked}" is not YYYY-MM-DD; used the record date.')
        chk = fallback_checked
    org = text(origin) or (existing or {}).get('origin') or 'vendor-supplied'
    if org not in ORIGINS:
        rec.flag(header, f'origin "{org}" is not verified, vendor-supplied or estimated; stored as vendor-supplied.')
        org = 'vendor-supplied'
    return {'value': value, 'source': src, 'checked': str(chk)[:10], 'origin': org}


def norm_standards(rec, raw):
    s = text(raw)
    if not s:
        return []
    found, leftover = [], s
    patterns = [
        (r'lti[\s-]*advantage', 'lti-advantage'), (r'lti[\s-]*1\.3', 'lti-1.3'), (r'lti[\s-]*1\.1', 'lti-1.1'),
        (r'scorm[\s-]*1\.2', 'scorm-1.2'), (r'scorm[\s-]*2004', 'scorm-2004'), (r'\bxapi\b', 'xapi'),
        (r'\bcmi5\b', 'cmi5'), (r'\baicc\b', 'aicc'), (r'\bqti\b', 'qti'), (r'\bcaliper\b', 'caliper'),
        (r'\boneroster\b', 'oneroster'), (r'open[\s-]*badges[\s-]*2', 'open-badges-2'),
        (r'open[\s-]*badges[\s-]*3', 'open-badges-3'), (r'\bclr\b', 'clr'),
    ]
    # Only the part before any explanatory sentence or bracket counts as the list.
    head = re.split(r'\.\s|\(', s, maxsplit=1)[0]
    for pat, sid in patterns:
        if re.search(pat, head, re.I) and sid not in found:
            found.append(sid)
    if head.strip() != s.strip():
        rec.flag('standards', f'workbook adds a qualification that the list can\'t hold: "{s[len(head):].strip()[:200]}". Confirm and add any standard that is now supported.')
    tokens = [t.strip().lower() for t in head.split(';') if t.strip()]
    unknown = [t for t in tokens if not any(re.search(p, t, re.I) for p, _ in patterns)]
    if unknown:
        rec.flag('standards', f'not a recognised standard id: {", ".join(unknown)}.')
    return [x for x in STANDARDS if x in found]


CERT = re.compile(r'ISO\s?\d+|SOC\s?[123]|IRAP|FedRAMP|StateRAMP|HECVAT|CSA STAR|PCI|Cyber Essentials|HIPAA|TISAX|\bC5\b|GDPR', re.I)


def norm_security(rec, raw):
    items, notes = [], []
    for part in split(raw):
        quals = re.findall(r'\((.*?)\)', part)
        clean = re.sub(r'\s*\(.*?\)\s*', ' ', part).strip(' .')
        if CERT.match(clean) and len(clean) <= 40:
            items.append(clean)
            notes += [f'{clean}: {q}' for q in quals]
        else:
            notes.append(part)
    if not items:
        rec.flag('security', 'no certification is stated, so the list is empty. Request the current security pack.')
    return items, '; '.join(notes) or None


REGIONS = [('Australia', r'\bAustralia\b|\bSydney\b'), ('Canada', r'\bCanada\b'), ('EU', r'\bEU\b|\bFrankfurt\b|\bGermany\b'),
           ('USA', r'\bUSA\b|\bUS\b|\bVirginia\b|United States'), ('UK', r'\bUK\b|United Kingdom')]


def import_product(rid, row_no, row, existing, tasks):
    rec = Record('Products', row_no, rid)
    d = dict(existing)
    when = text(row.get('lastVerified'))
    if not when or not DATE.match(when):
        rec.flag('lastVerified', 'missing or not YYYY-MM-DD.')
        when = None
    fb = when or '2026-11-08'

    # Markets
    mk = split(row.get('primaryMarket'))
    bad = [m for m in mk if m not in MARKETS]
    if bad:
        rec.flag('primaryMarket', f'not a market id: {", ".join(bad)}.')
    mk = [m for m in mk if m in MARKETS]
    if mk:
        f = fact(rec, mk, row.get('primaryMarket source'), row.get('primaryMarket checked'), row.get('primaryMarket origin'), 'primaryMarket', fb, existing.get('primaryMarket'))
        if f: d['primaryMarket'] = f
    else:
        rec.flag('primaryMarket', 'empty.')

    # Pricing model
    basis = text(row.get('pricing basis'))
    if basis in BASES:
        v = {'basis': basis}
        ft = text(row.get('free tier'))
        if ft and re.match(r'^yes\b', ft, re.I):
            v['freeTier'] = True
        elif ft and re.match(r'^no\b', ft, re.I):
            v['freeTier'] = False
        elif ft:
            rec.flag('free tier', f'neither yes nor no, so left out: "{ft[:160]}".')
        else:
            rec.flag('free tier', 'empty.')
        tr = text(row.get('trial'))
        if tr and re.search(r'free trial|\d+-day (full-featured )?trial|trial for \d+ days', tr, re.I) and not re.search(r'not (confirmed|identified)|\bno public|\bno standard', tr, re.I):
            v['trial'] = True
        elif tr and re.match(r'^no separate trial', tr, re.I):
            v['trial'] = False
        else:
            rec.flag('trial', f'no public trial terms, so left out (not set to false){": " + tr[:120] if tr else ""}.')
        if ft: v['freeTierNote'] = ft
        if tr: v['trialNote'] = tr
        f = fact(rec, v, row.get('pricingModel source'), row.get('pricingModel checked'), row.get('pricingModel origin'), 'pricing basis', fb, existing.get('pricingModel'))
        if f: d['pricingModel'] = f
    elif basis:
        rec.flag('pricing basis', f'"{basis}" is not a pricing basis id.')
    else:
        rec.flag('pricing basis', 'empty.')

    # Pricing
    pub = row.get('prices public')
    if isinstance(pub, bool) or text(pub):
        v = {'public': pub if isinstance(pub, bool) else str(pub).strip().lower() in ('true', 'yes', 'y')}
        frm, nts = text(row.get('price from')), text(row.get('pricing notes'))
        # "from" is an entry price; a sentence with no amount in it belongs in the notes.
        if frm and re.search(r'(US|A|NZ|C)?\$\s?\d|€\s?\d|£\s?\d|\bfree\b', frm, re.I) and not re.match(r'^(institutional )?pricing not|^not publicly', frm, re.I):
            v['from'] = frm
        elif frm:
            nts = ' '.join(x for x in (frm, nts) if x)
        if nts: v['notes'] = nts
        if v['public'] and 'from' not in v:
            rec.flag('price from', 'prices are marked public but no entry price is given.')
        f = fact(rec, v, row.get('pricing source'), None, row.get('pricingModel origin'), 'prices public', fb, existing.get('pricing'))
        if f: d['pricing'] = f

    # Deployment
    dep = split(row.get('deployment'))
    bad = [x for x in dep if x not in DEPLOY]
    if bad: rec.flag('deployment', f'not a deployment id: {", ".join(bad)}.')
    dep = [x for x in dep if x in DEPLOY]
    if dep:
        f = fact(rec, dep, row.get('deployment source'), None, None, 'deployment', fb, existing.get('deployment'))
        if f: d['deployment'] = f
    else:
        rec.flag('deployment', 'empty.')

    # Standards
    st = norm_standards(rec, row.get('standards'))
    if st:
        f = fact(rec, st, row.get('standards source'), row.get('standards checked'), row.get('standards origin'), 'standards', fb, existing.get('standards'))
        if f: d['standards'] = f
    else:
        rec.flag('standards', 'no standard confirmed.')

    # Accessibility
    std, ev = text(row.get('accessibility standard')), text(row.get('accessibility evidence'))
    if std or ev:
        v = {}
        if std and re.match(r'^WCAG', std):
            v['standard'] = std
        elif std:
            rec.flag('accessibility standard', 'not a conformance claim, so stored as evidence and the standard left out.')
            ev = f'{std} {ev or ""}'.strip()
        if ev: v['evidence'] = ev
        f = fact(rec, v, row.get('accessibility source'), None, None, 'accessibility standard', fb, existing.get('accessibility'))
        if f: d['accessibility'] = f

    # Security
    if text(row.get('security')):
        items, note = norm_security(rec, row.get('security'))
        f = fact(rec, items, row.get('security source'), None, None, 'security', fb, existing.get('security'))
        if f:
            if note: f['notes'] = note
            d['security'] = f

    # Data privacy
    res, pn = text(row.get('data residency')), text(row.get('data privacy notes'))
    if res or pn:
        regions = [name for name, pat in REGIONS if res and re.search(pat, res)]
        if res and re.search(r'confirm|require|depend|negotiat|selected by|determined by', res, re.I):
            rec.flag('data residency', 'no committed region; confirm the tenant region in the contract.' + (f' Regions the vendor names: {", ".join(regions)}.' if regions else ''))
        v = {'dataResidency': regions, 'notes': ' '.join(x for x in (res, pn) if x)}
        f = fact(rec, v, row.get('dataPrivacy source'), None, None, 'data residency', fb, existing.get('dataPrivacy'))
        if f: d['dataPrivacy'] = f

    # Geography
    geo = split(row.get('geographic availability'))
    if geo:
        f = fact(rec, geo, row.get('geo source'), None, None, 'geographic availability', fb, existing.get('geographicAvailability'))
        if f: d['geographicAvailability'] = f

    # AI
    models_raw, trains = text(row.get('AI models')), text(row.get('AI trains on customer data'))
    if models_raw or trains:
        parts = split(models_raw)
        provider = re.compile(r'OpenAI|Anthropic|Claude|Gemini|Llama|Bedrock|Mistral|GPT', re.I)
        if parts and all(provider.search(p) and len(p) < 60 for p in parts):
            models, note = parts, None
        else:
            models, note = [], models_raw
            rec.flag('AI models', 'no named model or provider, so models is empty; the description is kept as a note.')
        if trains not in TRAINS:
            rec.flag('AI trains on customer data', f'"{trains}" is not an allowed value; stored as not-disclosed.')
            trains = 'not-disclosed'
        v = {'models': models, 'trainsOnCustomerData': trains}
        old = ((existing.get('aiDisclosure') or {}).get('value') or {}).get('notes')
        if note or old: v['notes'] = ' '.join(x.rstrip('.') + '.' for x in (note, old if old != note else None) if x)
        f = fact(rec, v, row.get('AI source'), None, None, 'AI models', fb, existing.get('aiDisclosure'))
        if f: d['aiDisclosure'] = f

    kind = text(row.get('commercial relationship')) or 'none'
    d['commercialRelationship'] = {**(existing.get('commercialRelationship') or {}), 'kind': kind}
    d['status'] = text(row.get('status')) or existing.get('status', 'active')
    if when: d['lastVerified'] = when
    d['draft'] = True
    d['researchTasks'] = tasks + rec.notes
    return d


def import_vendor(rid, row_no, row, existing, tasks):
    rec = Record('Vendors', row_no, rid)
    d = dict(existing)
    when = text(row.get('lastVerified'))
    fb = when or '2026-11-08'

    def origin_for(src):
        if re.search(r'sec\.gov|lei\.bloomberg|marketindex\.com\.au|q4cdn', src or ''):
            return 'verified'
        if re.search(r'reveliolabs', src or ''):
            return 'estimated'
        return 'vendor-supplied'

    for key in ('headquarters', 'size', 'funding'):
        val = text(row.get(key))
        if val:
            src = text(row.get(f'{key} source'))
            f = fact(rec, val, src, None, origin_for(src), key, fb)
            if f:
                if f['origin'] == 'estimated':
                    rec.flag(key, 'from a third-party workforce estimate, stored as estimated.')
                d[key] = f

    fv = text(row.get('founded'))
    if fv:
        m = re.search(r'\b(1[89]\d\d|20\d\d)\b', fv)
        if m:
            src = text(row.get('founded source'))
            f = fact(rec, int(m.group(1)), src, None, origin_for(src), 'founded', fb)
            if f:
                if fv != m.group(1):
                    f['note'] = fv
                    rec.flag('founded', f'stored the year {m.group(1)}; the workbook qualifies it: "{fv}".')
                d['founded'] = f
        else:
            rec.flag('founded', f'no year in "{fv}".')

    ow = text(row.get('ownership'))
    if ow:
        src = text(row.get('ownership source'))
        if ow in OWNERSHIP:
            enum = ow
        elif re.search(r'Bain|Clearlake|Francisco Partners|KKR|private equity', ow, re.I):
            enum = 'private-equity'
        elif re.search(r'^subsidiary|part of|subsidiary of', ow, re.I):
            enum = 'subsidiary'
        else:
            enum = 'other'
            rec.flag('ownership', f'"{ow}" doesn\'t say whether it is independent or venture-backed, so stored as other.')
        f = fact(rec, enum, src, None, origin_for(src), 'ownership', fb)
        if f:
            d['ownership'] = f
            if ow not in OWNERSHIP and not existing.get('ownershipDetail'):
                d['ownershipDetail'] = {**f, 'value': ow}

    d['status'] = text(row.get('status')) or existing.get('status', 'active')
    if when: d['lastVerified'] = when
    d['draft'] = True
    d['researchTasks'] = tasks + rec.notes
    return d


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    out = sys.argv[sys.argv.index('--annotate') + 1] if '--annotate' in sys.argv else None
    wb = openpyxl.load_workbook(path)

    open_tasks = {}
    for _, row in sheet_rows(wb['Research tasks']):
        if str(row.get('done? (y/n)') or '').strip().lower() == 'y':
            continue
        task = text(row.get('task'))
        note = text(row.get('notes'))
        if task:
            open_tasks.setdefault((row['record'], row['id']), []).append(task + (f' Note: {note}' if note else ''))

    for kind, folder, fn in (('product', PRODUCTS, import_product), ('vendor', VENDORS, import_vendor)):
        ws = wb['Products' if kind == 'product' else 'Vendors']
        for row_no, row in sheet_rows(ws):
            rid = text(row['id'])
            fp = folder / f'{rid}.json'
            if not fp.exists():
                flags.append((ws.title, row_no, 'id', f'no record {rid}.json; not imported.'))
                continue
            existing = json.loads(fp.read_text())
            rec = fn(rid, row_no, row, existing, open_tasks.get((kind, rid), []))
            fp.write_text(json.dumps(rec, indent=2, ensure_ascii=False) + '\n')

    if out:
        for sheet, r, header, note in flags:
            ws = wb[sheet]
            hdr = [c.value for c in ws[1]]
            col = hdr.index(header) + 1 if header in hdr else 1
            c = ws.cell(r, col)
            if not str(c.value or '').startswith('*'):
                c.value = '* ' + ('' if c.value is None else str(c.value))
            prev = c.comment.text + '\n' if c.comment else ''
            c.comment = Comment(prev + note, 'The Learning Curve import')
        wb.save(out)

    by_sheet = {}
    for s, *_ in flags:
        by_sheet[s] = by_sheet.get(s, 0) + 1
    print(json.dumps({'flags': len(flags), 'bySheet': by_sheet}))
    for f in flags:
        print('\t'.join(map(str, f)))


if __name__ == '__main__':
    main()
