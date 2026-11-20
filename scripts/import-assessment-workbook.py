#!/usr/bin/env python3
"""Import the assessment & credentialing workbook into the directory.

Usage:
  python3 scripts/import-assessment-workbook.py <workbook.xlsx>

Reads the "Directory" sheet (one row per product: official product URL and a secondary source),
the "Eight-Area Profiles" sheet (company next steps) and the "Vendor Outreach" sheet, and writes
src/data/directory/products/<id>.json and vendors/<id>.json.

Provenance (docs/directory.md):
- Every fact comes from the vendor's own public pages, so origin is "vendor-supplied", with the
  workbook's snapshot date as `checked`. The official product URL backs the overview, markets,
  uses, features and pricing; the secondary source backs integrations and standards.
- Standards, certifications, integrations and pricing bases are taken only where the workbook
  states them outright (the tables below). Anything the workbook marks "confirm", "verify",
  "request" or "not verified" becomes a data gap, and its AI notes become research tasks.
- Products that already exist (Gradescope, Turnitin) are skipped, never overwritten. Canvas
  Credentials is left out: Instructure now sells it as Parchment's digital badges, which the
  workbook also lists, so it would be a duplicate profile.
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
CHECKED = '2026-11-16'
DATASET = 'The Learning Curve assessment & credentialing dataset (research snapshot 16 Nov 2026)'
C = 'assessment-credentialing'

# Workbook name -> (product id, product name, vendor id, vendor name)
IDS = {
    'Gradescope': ('gradescope', None, 'turnitin-llc', None),                  # exists: skipped
    'Turnitin Feedback Studio': ('turnitin', None, 'turnitin-llc', None),      # exists as Turnitin: skipped
    'Inspera Assessment': ('inspera-assessment', 'Inspera Assessment', 'inspera', 'Inspera'),
    'ExamSoft': ('examsoft', 'ExamSoft', 'turnitin-llc', None),
    'Questionmark': ('questionmark', 'Questionmark', 'questionmark', 'Questionmark'),
    'TAO Testing': ('tao-testing', 'TAO', 'open-assessment-technologies', 'Open Assessment Technologies'),
    'Exam.net': ('exam-net', 'Exam.net', 'exam-net', 'Exam.net'),
    'Crowdmark': ('crowdmark', 'Crowdmark', 'crowdmark', 'Crowdmark'),
    'FeedbackFruits': ('feedbackfruits', 'FeedbackFruits', 'feedbackfruits', 'FeedbackFruits'),
    'Kritik': ('kritik', 'Kritik', 'kritik', 'Kritik'),
    'Respondus Monitor': ('respondus-monitor', 'Respondus Monitor', 'respondus', 'Respondus'),
    'Proctorio': ('proctorio', 'Proctorio', 'proctorio', 'Proctorio'),
    'Honorlock': ('honorlock', 'Honorlock', 'honorlock', 'Honorlock'),
    'Meazure Learning / ProctorU': ('proctoru', 'ProctorU (Meazure Learning)', 'meazure-learning', 'Meazure Learning'),
    'Pearson VUE OnVUE': ('pearson-vue-onvue', 'Pearson VUE OnVUE', 'pearson', 'Pearson'),
    'PebblePad': ('pebblepad', 'PebblePad', 'pebblepad', 'PebblePad'),
    'Mahara': ('mahara', 'Mahara', 'mahara-project', 'Mahara (Catalyst IT and community)'),
    'Credly': ('credly', 'Credly', 'pearson', 'Pearson'),
    'Accredible': ('accredible', 'Accredible', 'accredible', 'Accredible'),
    'Parchment Award Digital Badges': ('parchment-digital-badges', 'Parchment Digital Badges', 'instructure', None),
    'Open Badge Factory': ('open-badge-factory', 'Open Badge Factory', 'open-badge-factory', 'Open Badge Factory'),
    'Sertifier': ('sertifier', 'Sertifier', 'sertifier', 'Sertifier'),
    'My eQuals': ('my-equals', 'My eQuals', 'my-equals', 'My eQuals'),
    'Canvas Credentials': None,  # duplicate of Parchment Digital Badges: left out
    'Möbius Assessment': ('mobius', 'Möbius', 'digitaled', 'DigitalEd'),
}
WEBSITE = {'questionmark': 'https://www.questionmark.com/', 'tao-testing': 'https://www.taotesting.com/',
           'inspera-assessment': 'https://inspera.com/inspera-assessment/', 'honorlock': 'https://honorlock.com/',
           'proctoru': 'https://www.meazurelearning.com/', 'credly': 'https://info.credly.com/',
           'pebblepad': 'https://pebblepad.com/', 'sertifier': 'https://sertifier.com/', 'my-equals': 'https://myequals.org/'}
# A secondary source that isn't the vendor's own page is not used.
SECONDARY_OVERRIDE = {'proctoru': None}

MARKETS = [('higher education', 'higher-education'), ('universit', 'higher-education'), ('k-12', 'schools'),
           ('school', 'schools'), ('vet', 'vet'), ('vocational', 'vet'), ('government', 'government'),
           ('enterprise', 'corporate'), ('corporate', 'corporate'), ('workforce', 'corporate'),
           ('professional learning', 'corporate'), ('associations', 'nonprofit')]

# Standards the workbook states outright. Others are data gaps.
STANDARDS = {
    'inspera-assessment': ['lti-1.1', 'lti-1.3'],
    'questionmark': ['xapi', 'aicc'],
    'tao-testing': ['qti'],
    'credly': ['open-badges-3'],
}
STANDARDS_NOTE = {
    'questionmark': 'Vendor also states LTI and SCORM support without naming versions.',
    'tao-testing': 'Vendor states QTI 2.2 compatibility and native QTI 3.0, and that it is LTI-ready (version not named).',
    'credly': 'Open Badges 3.0 compatibility is described on a feature page; conformance certification not checked.',
}
INTEGRATIONS = {
    'inspera-assessment': ['Canvas', 'Moodle', 'Blackboard Learn', 'D2L Brightspace', 'Sakai'],
    'examsoft': ['Canvas', 'Blackboard', 'D2L Brightspace', 'Moodle (grade synchronisation)'],
    'tao-testing': ['Moodle', 'Canvas', 'Blackboard', 'APIs'],
    'respondus-monitor': ['Canvas', 'Blackboard', 'Moodle', 'Brightspace', 'Publisher systems including Pearson, McGraw Hill and Cengage'],
    'honorlock': ['Canvas', 'Blackboard', 'Moodle', 'D2L', 'Open LMS', 'Docebo', 'Intellum', 'Open APIs'],
    'mahara': ['LTI portfolio submission to an LMS, commonly Moodle'],
    'credly': ['Canvas', 'Degreed', 'Cornerstone', 'Docebo', 'Moodle', 'API and integration directory'],
    'accredible': ['LMS, CMS and API integrations (described by the vendor; list not captured)'],
    'open-badge-factory': ['REST API', 'LTI', 'Plugins for Moodle, Canvas, Blackboard and Brightspace'],
    'sertifier': ['Degreed', 'Docebo', 'Absorb', 'Adobe Learning Manager', 'Skilljar', 'Salesforce', 'Canvas', 'Moodle', 'Zoom', 'Zapier'],
}
# Certifications the vendor states (Level 1 claims: certificates not inspected).
SECURITY = {'questionmark': ['ISO 27001'], 'accredible': ['SOC 2 Type II']}
DATA_PRIVACY = {
    'my-equals': {'dataResidency': ['Australia'], 'notes': 'Vendor states credentials are stored in Australia.'},
    'questionmark': {'dataResidency': [], 'gdpr': True},
    'accredible': {'dataResidency': [], 'gdpr': True},
}
# (public, from, basis or None, freeTier or None, trial or None)
Q = (False, None, 'quote', None, None)
PRICING = {
    'inspera-assessment': Q, 'examsoft': Q, 'questionmark': Q, 'tao-testing': Q,
    'exam-net': (False, None, 'quote', None, True), 'crowdmark': Q, 'feedbackfruits': Q, 'kritik': Q,
    'respondus-monitor': Q, 'proctorio': Q, 'honorlock': Q, 'proctoru': Q,
    'pearson-vue-onvue': (False, None, None, None, None), 'pebblepad': Q,
    'mahara': (True, None, 'open-source', None, None), 'credly': Q, 'accredible': Q,
    'parchment-digital-badges': Q, 'open-badge-factory': (False, None, None, None, None), 'sertifier': Q,
    'my-equals': (False, None, None, None, None), 'mobius': Q,
}
DEPLOYMENT = {'mahara': ['self-hosted']}
GEO = {'my-equals': ['Australia', 'New Zealand']}
GROUPS = [
    ['inspera-assessment', 'examsoft', 'questionmark', 'tao-testing', 'exam-net', 'mobius'],
    ['gradescope', 'crowdmark', 'feedbackfruits', 'kritik'],
    ['respondus-monitor', 'proctorio', 'honorlock', 'proctoru', 'pearson-vue-onvue'],
    ['pebblepad', 'mahara'],
    ['credly', 'accredible', 'parchment-digital-badges', 'open-badge-factory', 'sertifier', 'my-equals'],
]
FLAGS = {
    'proctoru': "The workbook's secondary source is a McGraw Hill page (https://www.mheducation.com/highered/digital-products/aleksppl/assessment-integrity.html), not Meazure Learning's own; it isn't used as a source here.",
    'parchment-digital-badges': 'Instructure has been folding Canvas Credentials into Parchment; the workbook listed both. Confirm the current product name and packaging.',
    'tao-testing': 'Distinguish the open-source TAO community edition from the commercial cloud service when profiling deployment and pricing.',
    'pearson-vue-onvue': 'OnVUE is paid per exam by candidates or certification sponsors, not licensed by institutions; pricing basis left as a gap.',
}
INDEPENDENT = {  # useful context the workbook records; not product-specific evidence
    'pebblepad': 'An institutional guide exists (https://lms.unimelb.edu.au/learning-technologies/pebblepad); check whether it supports any claims.',
    'mahara': 'Peer-reviewed study involving Mahara (https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2023.1169363/full); check before citing as evidence.',
}
for _p in ('credly', 'accredible', 'parchment-digital-badges', 'open-badge-factory', 'sertifier'):
    INDEPENDENT[_p] = 'Check the 1EdTech Open Badges 3.0 conformance directory (https://www.imsglobal.org/spec/ob/v3p0/impl/) for a current certification.'
INDEPENDENT['tao-testing'] = 'Check the 1EdTech QTI 3.0 implementation directory (https://www.imsglobal.org/spec/qti/v3p0/impl/) for a current certification.'


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
        if re.search(r'\b' + re.escape(key), low) and val not in found:
            found.append(val)
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
    all_ids = {v[0] for v in IDS.values() if v}

    written, skipped, vendors_new = [], [], []
    for r in rows:
        name = r[0]
        entry = IDS[name]
        if entry is None:
            skipped.append(f'{name} (duplicate)')
            continue
        pid, pname, vid, vname = entry
        if (PRODUCTS / f'{pid}.json').exists():
            skipped.append(pid)
            continue
        s1 = text(r[20])
        s2 = SECONDARY_OVERRIDE.get(pid, text(r[21]) or s1) or s1
        gaps, tasks = [], [f'Imported from the {DATASET}. Evidence status: {text(r[18])}']
        p = {
            'name': pname, 'vendor': vid, 'category': C, 'secondaryCategories': [],
            'website': WEBSITE.get(pid, s1), 'summary': summary(r[4]),
        }
        m = markets(r[3])
        if m:
            p['primaryMarket'] = fact(m, s1)
        p['useCases'] = fact(items(r[5]), s1)
        p['keyFeatures'] = fact(items(r[6]), s1)
        if pid in INTEGRATIONS:
            p['integrations'] = fact(INTEGRATIONS[pid], s2)
            if re.search(r'confirm|request|verify|obtain', text(r[7]), re.I):
                gaps.append({'field': 'integrations (detail)', 'note': text(r[7])})
        else:
            gaps.append({'field': 'integrations', 'note': text(r[7]) or 'Not stated.'})
        if pid in STANDARDS:
            p['standards'] = fact(STANDARDS[pid], s2)
            gaps.append({'field': 'standards (detail)', 'note': ' '.join(x for x in (STANDARDS_NOTE.get(pid, ''), text(r[8])) if x)})
        else:
            gaps.append({'field': 'standards', 'note': text(r[8]) or 'Not stated.'})
        pub, frm, basis, free, trial = PRICING.get(pid, (None, None, None, None, None))
        if pub is not None:
            pr = {'public': pub, 'notes': text(r[9])}
            if frm:
                pr['from'] = frm
            p['pricing'] = fact(pr, s1)
        else:
            gaps.append({'field': 'pricing', 'note': text(r[9])})
        if basis:
            pm = {'basis': basis}
            if free is not None:
                pm['freeTier'] = free
            if trial is not None:
                pm['trial'] = trial
            p['pricingModel'] = fact(pm, s1)
        else:
            gaps.append({'field': 'pricing basis', 'note': 'Not stated in the reviewed pages.' + (' Free trial offered.' if trial else '')})
        if pid in DEPLOYMENT:
            p['deployment'] = fact(DEPLOYMENT[pid], s1)
        else:
            gaps.append({'field': 'deployment', 'note': 'Not recorded in the dataset.'})
        gaps.append({'field': 'accessibility', 'note': text(r[11])})
        if pid in SECURITY:
            p['security'] = fact(SECURITY[pid], s1)
        gaps.append({'field': 'security (assurance)', 'note': text(r[10])})
        if pid in DATA_PRIVACY:
            p['dataPrivacy'] = fact(DATA_PRIVACY[pid], s2 if pid == 'my-equals' else s1)
        if pid in GEO:
            p['geographicAvailability'] = fact(GEO[pid], s1)
        tasks.append(f'AI: {text(r[12])} Model/provider: {text(r[13])} Training: {text(r[14])} Retention: {text(r[15])} Subprocessors: {text(r[16])} Status: {text(r[17])}')
        group = next((g for g in GROUPS if pid in g), [])
        p['alternatives'] = [x for x in group if x != pid and ((PRODUCTS / f'{x}.json').exists() or x in all_ids)][:5]
        p['evidence'] = []
        p['commercialRelationship'] = {'kind': 'none'}
        p['status'] = 'active'
        p['lastVerified'] = CHECKED
        p['draft'] = False
        if name in outreach:
            pri, ask = outreach[name]
            tasks.append(f'Vendor outreach ({pri} priority): {ask}')
        for extra in (FLAGS.get(pid), INDEPENDENT.get(pid)):
            if extra:
                tasks.append(extra)
        p['researchTasks'] = tasks
        p['dataGaps'] = gaps
        (PRODUCTS / f'{pid}.json').write_text(json.dumps(p, indent=2, ensure_ascii=False) + '\n')
        written.append(pid)

        vpath = VENDORS / f'{vid}.json'
        if not vpath.exists():
            v = {
                'name': vname, 'website': root(WEBSITE.get(pid, s1)), 'status': 'active',
                'draft': False, 'lastVerified': CHECKED,
                'researchTasks': [f'Imported from the {DATASET}. {company.get(name, "")}'.strip()],
                'dataGaps': [{'field': f, 'note': 'Not recorded in the dataset.'} for f in ('headquarters', 'founded', 'size', 'ownership', 'funding')],
            }
            if vid == 'pearson':
                v['website'] = 'https://www.pearson.com/'
            vpath.write_text(json.dumps(v, indent=2, ensure_ascii=False) + '\n')
            vendors_new.append(vid)
    print('products written:', len(written), written)
    print('vendors written:', len(vendors_new), vendors_new)
    print('skipped:', skipped)


if __name__ == '__main__':
    main(sys.argv[1])
