#!/usr/bin/env python3
"""Import the video & interactive learning tools workbook into the directory.

Usage:
  python3 scripts/import-video-workbook.py <workbook.xlsx>

Reads the "Directory" sheet (one row per product, with up to three official sources), the
"Eight-Area Profiles" sheet (for the company next steps) and the "Vendor Outreach" sheet, and
writes src/data/directory/products/<id>.json and vendors/<id>.json.

Provenance (docs/directory.md):
- Every fact comes from the vendor's own public pages, so origin is "vendor-supplied", with the
  workbook's snapshot date as `checked`. Source 1 backs the overview, markets, uses, features and
  pricing; source 2 the integrations and standards; source 3 (or 2, or 1) accessibility.
- Standards, certifications, accessibility claims and pricing bases are taken only where the
  workbook states them outright (the STANDARDS / SECURITY / ACCESSIBILITY / PRICING tables below).
  Anything the workbook marks "confirm", "verify" or "not verified" becomes a data gap.
- Products that already exist (Synthesia) are skipped, never overwritten.
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / 'src/data/directory/products'
VENDORS = ROOT / 'src/data/directory/vendors'
CHECKED = '2026-11-15'
DATASET = 'CredentialCraft video & interactive learning tools dataset (research snapshot 15 Nov 2026)'

# Workbook name -> (product id, vendor id, vendor name, category, secondary categories)
V, A, E, AI = 'video-interactive', 'authoring-tools', 'emerging-technologies', 'ai-for-learning'
IDS = {
    'Panopto': ('panopto', 'panopto', 'Panopto', V, []),
    'Kaltura': ('kaltura', 'kaltura', 'Kaltura', V, []),
    'YuJa Lumina': ('yuja-lumina', 'yuja', 'YuJa', V, []),
    'Vimeo Enterprise': ('vimeo-enterprise', 'vimeo', 'Vimeo', V, []),
    'Edpuzzle': ('edpuzzle', 'edpuzzle', 'Edpuzzle', V, []),
    'PlayPosit': ('playposit', 'playposit', 'PlayPosit', V, []),
    'Nearpod': ('nearpod', 'nearpod', 'Nearpod', V, []),
    'H5P': ('h5p', 'h5p-group', 'H5P Group', A, [V]),
    'Genially': ('genially', 'genially', 'Genially', A, [V]),
    'ThingLink': ('thinglink', 'thinglink', 'ThingLink', V, [E]),
    'Mindstamp': ('mindstamp', 'mindstamp', 'Mindstamp', V, []),
    'Hihaho': ('hihaho', 'hihaho', 'Hihaho', V, []),
    'Articulate 360 (Rise + Storyline)': ('articulate-360', 'articulate', None, A, [V]),
    'Adobe Captivate': ('adobe-captivate', 'adobe', 'Adobe', A, [V]),
    'iSpring Suite': ('ispring-suite', 'ispring-solutions', None, A, [V]),
    'dominKnow | ONE': ('dominknow-one', 'dominknow', 'dominKnow', A, []),
    'Evolve (Intellum)': ('evolve', 'intellum', 'Intellum', A, []),
    'Synthesia': ('synthesia', 'synthesia-ltd', None, V, []),  # exists: skipped
    'Colossyan': ('colossyan', 'colossyan', 'Colossyan', V, [AI]),
    'HeyGen': ('heygen', 'heygen', 'HeyGen', V, [AI]),
    'Vyond': ('vyond', 'vyond', 'Vyond', V, []),
    'Camtasia (TechSmith)': ('camtasia', 'techsmith', 'TechSmith', V, []),
    'Labster': ('labster', 'labster', 'Labster', V, [E]),
    'Mursion': ('mursion', 'mursion', 'Mursion', V, [E]),
    'Bodyswaps': ('bodyswaps', 'bodyswaps', 'Bodyswaps', V, [E]),
}
NAMES = {'articulate-360': 'Articulate 360', 'camtasia': 'Camtasia', 'evolve': 'Evolve',
         'dominknow-one': 'dominKnow | ONE'}
# Where the workbook's first source is a sub-page, the product's home page.
WEBSITE = {'edpuzzle': 'https://edpuzzle.com/', 'kaltura': 'https://corp.kaltura.com/',
           'bodyswaps': 'https://bodyswaps.co/', 'thinglink': 'https://www.thinglink.com/',
           'ispring-suite': 'https://www.ispringsolutions.com/ispring-suite'}

# Standards the workbook states outright (versions named). Others are data gaps.
STANDARDS = {
    'vimeo-enterprise': ['xapi'], 'h5p': ['xapi'], 'thinglink': ['xapi'], 'hihaho': ['xapi'],
    'articulate-360': ['scorm-1.2', 'scorm-2004', 'xapi', 'aicc', 'cmi5'],
    'adobe-captivate': ['scorm-1.2', 'scorm-2004', 'aicc', 'xapi'],
    'ispring-suite': ['scorm-1.2', 'scorm-2004', 'aicc', 'xapi', 'cmi5'],
    'dominknow-one': ['xapi', 'cmi5', 'aicc'],
    'colossyan': ['scorm-1.2', 'scorm-2004'],
    'bodyswaps': ['lti-1.3'],
}
# Certifications the vendor states (Level 1 claims: certificates not inspected).
SECURITY = {
    'panopto': ['ISO 27001', 'ISO 27017', 'ISO 27018', 'ISO 9001', 'SOC 2 Type II', 'TX-RAMP Level 2'],
    'yuja-lumina': ['SOC 2'], 'vimeo-enterprise': ['SOC 2'], 'labster': ['SOC 2', 'TX-RAMP'],
}
# (standard, evidence, which source) where the workbook records a claim or report.
ACCESSIBILITY = {
    'panopto': ('WCAG 2.1 AA, Section 508', 'Vendor claim; VPAT not reviewed', 1),
    'kaltura': ('Section 508 (video player)', 'Vendor claim; VPAT not reviewed', 1),
    'yuja-lumina': ('WCAG 2.2 AA', 'VPAT 2.5 (INT), January 2026, published by the vendor', 3),
    'dominknow-one': ('WCAG 2.2 AA, Section 508', 'Vendor claim; VPAT not reviewed', 3),
    'evolve': ('WCAG (level not stated)', 'Vendor claim; VPAT not reviewed', 1),
}
# (public, from, basis or None, freeTier or None, trial or None)
PRICING = {
    'panopto': (False, None, 'quote', None, None), 'kaltura': (False, None, 'quote', None, None),
    'yuja-lumina': (False, None, 'quote', None, None), 'vimeo-enterprise': (False, None, 'quote', None, None),
    'edpuzzle': (True, None, None, True, None), 'nearpod': (True, 'US$159 a year (Gold)', None, True, None),
    'genially': (True, None, None, True, None),
    'thinglink': (True, 'US$108 a year (Teacher)', None, None, None),
    'mindstamp': (True, 'US$83 a month, billed annually (Basic)', None, None, None),
    'hihaho': (True, '€2,497 a year (Starter)', None, None, None),
    'articulate-360': (True, None, 'per-seat', None, None),
    'adobe-captivate': (True, 'A$57.99 a month including GST', None, None, None),
    'ispring-suite': (True, 'US$970 an author a year (Suite)', 'per-seat', None, None),
    'dominknow-one': (False, None, 'quote', None, None), 'evolve': (False, None, None, None, True),
    'colossyan': (True, None, None, True, None), 'heygen': (True, None, None, True, None),
    'vyond': (True, 'US$699 a year (Starter)', None, None, None),
    'camtasia': (True, 'US$39 a year (Starter)', None, None, None),
    'labster': (True, 'US$5,000 a year (institutional plans)', None, None, None),
    'mursion': (False, None, 'quote', None, None), 'bodyswaps': (False, None, 'quote', None, None),
}
DEPLOYMENT = {'h5p': ['cloud', 'self-hosted']}
# AI disclosure for products with AI for Learning as a secondary category.
AI_DISCLOSURE = {
    'colossyan': ([], 'no', 'Vendor states it does not train foundation models on customer content and keeps inputs within the workspace. Model providers not named.'),
    'heygen': ([], 'opt-out', 'Vendor states enterprise customer data is not used to train AI; non-enterprise data may be used to train or improve services, with an opt-out. Uses internal and third-party AI vendors, not all named.'),
}
GROUPS = [
    ['panopto', 'kaltura', 'yuja-lumina', 'vimeo-enterprise'],
    ['edpuzzle', 'playposit', 'nearpod', 'mindstamp', 'hihaho'],
    ['h5p', 'genially', 'thinglink', 'articulate-360', 'adobe-captivate', 'ispring-suite', 'dominknow-one', 'evolve'],
    ['synthesia', 'colossyan', 'heygen', 'vyond', 'camtasia'],
    ['labster', 'mursion', 'bodyswaps', 'kulissa-maya'],
]
MARKET_OVERRIDE = {'mursion': ['higher-education', 'corporate']}  # 'teacher education' is higher education
FLAGS = {
    'kaltura': 'Two of the workbook sources are on corp-dev.kaltura.com, a development subdomain. Re-open the equivalent pages on the public site and replace the sources.',
    'bodyswaps': 'One source is the Google Play data-safety declaration, which the developer writes; it is not independent evidence.',
}

MARKETS = [('higher education', 'higher-education'), ('k–12', 'schools'), ('school', 'schools'),
           ('teacher', 'schools'), ('vocational', 'vet'), ('public sector', 'government'),
           ('government', 'government'), ('enterprise', 'corporate'), ('corporate', 'corporate'),
           ('l&d', 'corporate'), ('training', 'corporate'), ('hr', 'corporate'),
           ('enablement', 'corporate'), ('workplace', 'corporate'), ('customer learning', 'corporate')]


def text(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v not in (None, '') else ''


def items(v):
    out = []
    for part in re.split(r';', text(v)):
        part = part.strip().rstrip('.')
        if part:
            out.append(part[0].upper() + part[1:])
    return out


def fact(value, source):
    return {'value': value, 'source': source, 'checked': CHECKED, 'origin': 'vendor-supplied'}


def markets(v):
    low = text(v).lower()
    found = []
    for key, val in MARKETS:
        if key in low and val not in found:
            found.append(val)
    if not found and 'education' in low:
        found.append('higher-education')
    return found


def summary(v):
    s = text(v)
    if len(s) <= 300:
        return s
    cut = s[:300].rsplit('. ', 1)[0]
    return cut + '.' if not cut.endswith('.') else cut


def root(url):
    p = urlparse(url)
    return f'{p.scheme}://{p.netloc}/'


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = [r for r in wb['Directory'].iter_rows(min_row=5, values_only=True) if r[0]]
    company = {}
    for r in wb['Eight-Area Profiles'].iter_rows(min_row=5, values_only=True):
        if r[0] and text(r[1]).startswith('1.'):
            company[r[0]] = text(r[5])
    outreach = {r[1]: (text(r[0]), text(r[3])) for r in wb['Vendor Outreach'].iter_rows(min_row=5, values_only=True) if r[1]}

    written, skipped, vendors_new = [], [], []
    for r in rows:
        name = r[0]
        pid, vid, vname, cat, secondary = IDS[name]
        if (PRODUCTS / f'{pid}.json').exists():
            skipped.append(pid)
            continue
        srcs = [text(s) for s in r[19:22] if text(s)]
        s1 = srcs[0]
        s2 = srcs[1] if len(srcs) > 1 else s1
        s3 = srcs[2] if len(srcs) > 2 else s2
        gaps, tasks = [], [f'Imported from the {DATASET}. Evidence status: {text(r[17])}']
        p = {
            'name': NAMES.get(pid, name), 'vendor': vid, 'category': cat, 'secondaryCategories': secondary,
            'website': WEBSITE.get(pid, s1), 'summary': summary(r[3]),
        }
        m = MARKET_OVERRIDE.get(pid) or markets(r[2])
        if m:
            p['primaryMarket'] = fact(m, s1)
        p['useCases'] = fact(items(r[4]), s1)
        p['keyFeatures'] = fact(items(r[5]), s1)
        if text(r[6]):
            p['integrations'] = fact(items(r[6]), s2)
        if pid in STANDARDS:
            p['standards'] = fact(STANDARDS[pid], s2)
            if 'confirm' in text(r[7]).lower() or 'verify' in text(r[7]).lower() or 'varies' in text(r[7]).lower():
                gaps.append({'field': 'standards (detail)', 'note': text(r[7])})
        else:
            gaps.append({'field': 'standards', 'note': text(r[7]) or 'Not stated.'})
        pub, frm, basis, free, trial = PRICING.get(pid, (None, None, None, None, None))
        if pub is not None:
            pr = {'public': pub, 'notes': text(r[8])}
            if frm:
                pr['from'] = frm
            p['pricing'] = fact(pr, s1)
        else:
            gaps.append({'field': 'pricing', 'note': text(r[8])})
        if basis:
            pm = {'basis': basis}
            if free is not None:
                pm['freeTier'] = free
            if trial is not None:
                pm['trial'] = trial
            p['pricingModel'] = fact(pm, s1)
        else:
            gaps.append({'field': 'pricing basis', 'note': 'Not stated in the reviewed pages.' + (' Free tier offered.' if free else '') + (' Free trial offered.' if trial else '')})
        if pid in DEPLOYMENT:
            p['deployment'] = fact(DEPLOYMENT[pid], s1)
        else:
            gaps.append({'field': 'deployment', 'note': 'Not recorded in the dataset.'})
        if pid in ACCESSIBILITY:
            std, ev, which = ACCESSIBILITY[pid]
            p['accessibility'] = fact({'standard': std, 'evidence': ev}, [s1, s2, s3][which - 1])
        else:
            gaps.append({'field': 'accessibility', 'note': text(r[10])})
        if pid in SECURITY:
            p['security'] = fact(SECURITY[pid], s1)
        else:
            gaps.append({'field': 'security', 'note': text(r[9])})
        if pid in AI_DISCLOSURE:
            models, train, note = AI_DISCLOSURE[pid]
            p['aiDisclosure'] = fact({'models': models, 'trainsOnCustomerData': train, 'notes': note}, s1)
        if text(r[11]):
            tasks.append(f'AI: {text(r[11])} Models: {text(r[12])} Training: {text(r[13])} Retention: {text(r[14])} Subprocessors: {text(r[15])}')
        group = next((g for g in GROUPS if pid in g), [])
        p['alternatives'] = [x for x in group if x != pid and ((PRODUCTS / f'{x}.json').exists() or x in [IDS[n][0] for n in IDS])][:5]
        p['evidence'] = []
        p['commercialRelationship'] = {'kind': 'none'}
        p['status'] = 'active'
        p['lastVerified'] = CHECKED
        p['draft'] = False
        if name in outreach:
            pri, ask = outreach[name]
            tasks.append(f'Vendor outreach ({pri} priority): {ask}')
        if pid in FLAGS:
            tasks.append(FLAGS[pid])
        p['researchTasks'] = tasks
        p['dataGaps'] = gaps
        (PRODUCTS / f'{pid}.json').write_text(json.dumps(p, indent=2, ensure_ascii=False) + '\n')
        written.append(pid)

        vpath = VENDORS / f'{vid}.json'
        if not vpath.exists():
            v = {
                'name': vname, 'website': root(s1 if pid not in WEBSITE else WEBSITE[pid]), 'status': 'active',
                'draft': False, 'lastVerified': CHECKED,
                'researchTasks': [f'Imported from the {DATASET}. {company.get(name, "")}'.strip()],
                'dataGaps': [{'field': f, 'note': 'Not recorded in the dataset.'} for f in ('headquarters', 'founded', 'size', 'ownership', 'funding')],
            }
            vpath.write_text(json.dumps(v, indent=2, ensure_ascii=False) + '\n')
            vendors_new.append(vid)
    print('products written:', len(written), written)
    print('vendors written:', len(vendors_new), vendors_new)
    print('skipped (already in the directory):', skipped)


if __name__ == '__main__':
    main(sys.argv[1])
