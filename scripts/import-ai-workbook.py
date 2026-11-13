#!/usr/bin/env python3
"""Import the AI for Learning research workbook into the directory.

Usage:
  python3 scripts/import-ai-workbook.py <workbook.xlsx>

Reads the "AI Learning Directory" sheet (one row per product), the "AI Evidence Matrix" (one row
per product and AI question, with its evidence status and source) and the "Vendor Outreach"
sheet, and writes src/data/directory/products/<id>.json and vendors/<id>.json.

Evidence levels (docs/directory.md, "Evidence & Assurance levels"):
- A matrix answer with a vendor-published source and a "Verified..." or "Partially verified"
  status becomes Level 1, vendor-disclosed, with the matrix's scope note.
- Anything "Unconfirmed" or "Not established", or with no value, is research-ongoing. Its
  recorded value is kept in the record but not shown, until a source is found.
- "Conflict" rows are research-ongoing with conflict: true, so the profile says the sources
  disagree instead of picking one.
Nothing here reaches Level 2 to 4: those need the vendor's direct confirmation or independent
evidence, recorded by hand.

Products that already exist (Docebo) are merged: the AI profile and secondary category are added
and the rest of the record is kept.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / 'src/data/directory/products'
VENDORS = ROOT / 'src/data/directory/vendors'

# Workbook product name -> (product id, vendor id)
IDS = {
    'ChatGPT': ('chatgpt', 'openai'),
    'Gemini for Education': ('gemini-for-education', 'google'),
    'Microsoft Copilot': ('microsoft-copilot', 'microsoft'),
    'Claude': ('claude', 'anthropic'),
    'NotebookLM': ('notebooklm', 'google'),
    'Khanmigo': ('khanmigo', 'khan-academy'),
    'MagicSchool AI': ('magicschool-ai', 'magicschool'),
    'SchoolAI': ('schoolai', 'schoolai-inc'),
    'Brisk Teaching': ('brisk-teaching', 'brisk'),
    'Diffit': ('diffit', 'diffit-inc'),
    'Curipod': ('curipod', 'curipod-as'),
    'Quizlet': ('quizlet', 'quizlet-inc'),
    'Quizizz (Wayground)': ('wayground', 'wayground-inc'),
    'Kahoot!': ('kahoot', 'kahoot-asa'),
    'Grammarly': ('grammarly', 'grammarly-inc'),
    'Perplexity': ('perplexity', 'perplexity-ai'),
    'Gradescope': ('gradescope', 'turnitin-llc'),
    'Turnitin': ('turnitin', 'turnitin-llc'),
    'Duolingo Max': ('duolingo-max', 'duolingo'),
    'Photomath': ('photomath', 'google'),
    'Coursebox': ('coursebox', 'coursebox'),
    'Mindsmith': ('mindsmith', 'mindsmith-inc'),
    'Articulate 360 AI': ('articulate-360-ai', 'articulate'),
    'Synthesia': ('synthesia', 'synthesia-ltd'),
    'Docebo AI': ('docebo', 'docebo-inc'),
}
# Vendor names as the workbook gives them (no legal suffixes we haven't seen on a source).
VENDOR_NAMES = {
    'openai': 'OpenAI', 'microsoft': 'Microsoft', 'anthropic': 'Anthropic', 'khan-academy': 'Khan Academy',
    'magicschool': 'MagicSchool', 'schoolai-inc': 'SchoolAI', 'brisk': 'Brisk Teaching', 'diffit-inc': 'Diffit',
    'curipod-as': 'Curipod', 'quizlet-inc': 'Quizlet', 'wayground-inc': 'Wayground', 'kahoot-asa': 'Kahoot!',
    'grammarly-inc': 'Grammarly', 'perplexity-ai': 'Perplexity AI', 'turnitin-llc': 'Turnitin', 'duolingo': 'Duolingo',
    'coursebox': 'Coursebox Pty Ltd', 'mindsmith-inc': 'Mindsmith', 'articulate': 'Articulate', 'synthesia-ltd': 'Synthesia',
}
VENDOR_SITES = {
    'openai': 'https://openai.com/', 'microsoft': 'https://www.microsoft.com/', 'anthropic': 'https://www.anthropic.com/',
    'khan-academy': 'https://www.khanacademy.org/', 'turnitin-llc': 'https://www.turnitin.com/',
    'articulate': 'https://www.articulate.com/', 'duolingo': 'https://www.duolingo.com/',
}
SECONDARY = {
    'articulate-360-ai': ['authoring-tools'], 'mindsmith': ['authoring-tools'], 'coursebox': ['authoring-tools'],
    'synthesia': ['video-interactive'], 'gradescope': ['assessment-credentialing'], 'turnitin': ['assessment-credentialing'],
}
GROUPS = [
    ['chatgpt', 'gemini-for-education', 'microsoft-copilot', 'claude', 'perplexity', 'notebooklm'],
    ['magicschool-ai', 'schoolai', 'brisk-teaching', 'diffit', 'curipod', 'khanmigo'],
    ['quizlet', 'wayground', 'kahoot', 'gradescope', 'turnitin'],
    ['coursebox', 'mindsmith', 'articulate-360-ai', 'synthesia', 'docebo'],
    ['khanmigo', 'duolingo-max', 'photomath', 'quizlet'],
]
STANDARDS = {'articulate-360-ai': ['scorm-1.2', 'scorm-2004', 'xapi', 'cmi5', 'aicc']}

# Matrix field -> (area, public question). Order here is the order on the page.
QUESTIONS = {
    'AI disclosure - customer data trains models': ('dataPrivacy', 'Trains AI models on customer data'),
    'AI retention': ('dataPrivacy', 'How long prompts and chats are kept'),
    'AI processors': ('dataPrivacy', 'Who processes the data'),
    'AI disclosure - models used': ('dataPrivacy', 'AI models used'),
    'AI minimum age': ('learnerOversight', 'Minimum learner age'),
    'AI staff review': ('learnerOversight', 'Staff can review AI output before learners see it'),
    'AI staff limits': ('learnerOversight', 'Staff can set limits on the AI'),
    'AI chat logs': ('learnerOversight', 'Staff can see learner conversations'),
    'AI answer approach': ('pedagogy', 'How it responds to learners'),
    'AI own content': ('pedagogy', 'Answers from your own course content'),
    'AI cites sources': ('pedagogy', 'Shows its sources'),
    'AI output owner': ('outputOwnership', 'Who owns what the AI produces'),
}
# Researcher boilerplate in the workbook's note columns: true of every row, so not shown.
BOILERPLATE = re.compile(r'^(Blank means|Model disclosure identifies|Approach can vary|Grounding is marked only)')
NOT_ESTABLISHED = re.compile(r'^(not disclosed|not established|research ongoing|none)\b', re.I)
CHECKED = '2026-11-09'

# Hand decisions on single rows, each explained in the pull request.
OVERRIDES = {
    # The conflict is about training, not the provider list; the models row shares its note.
    ('coursebox', 'AI disclosure - models used'): {'conflict': False, 'drop_note': True},
    # The matrix value says "not disclosed" but its own note records the Trust Center's
    # enterprise no-training statement.
    ('perplexity', 'AI disclosure - customer data trains models'): {
        'value': 'No, for Enterprise customer data', 'note': 'The Trust Center statement covers Enterprise customers. Other plans not established.'},
}


def text(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def split(v):
    s = text(v)
    if not s:
        return []
    out, buf, depth = [], '', 0
    for ch in s:
        depth += ch == '('
        depth -= ch == ')' and depth > 0
        if ch == ';' and depth == 0:
            out.append(buf.strip()); buf = ''
        else:
            buf += ch
    out.append(buf.strip())
    return [x[0].upper() + x[1:] for x in out if x]


def pretty(v):
    s = text(v)
    if s is None:
        return None
    if s.lower() in ('yes', 'no'):
        return s.capitalize()
    return s[0].upper() + s[1:]


def fact(value, source, checked=CHECKED):
    return {'value': value, 'source': source, 'checked': checked, 'origin': 'vendor-supplied'}


def markets(s):
    s = (s or '').lower()
    out = []
    if 'higher education' in s: out.append('higher-education')
    if 'k–12' in s or 'k-12' in s or 'schools' in s: out.append('schools')
    if 'corporate' in s or 'enterprise' in s or 'training providers' in s: out.append('corporate')
    if 'course businesses' in s: out.append('creators')
    return out


def level_of(status, origin, source, value):
    status = status or ''
    if 'Conflict' in status:
        return 'research-ongoing', True
    if origin == 'Vendor-published' and source and status.startswith(('Verified', 'Partially verified')) and value and not NOT_ESTABLISHED.match(value):
        return 'vendor-disclosed', False
    return 'research-ongoing', False


def trains_enum(v):
    w = (v or '').lower()
    for k in ('opt-out', 'opt-in', 'no', 'yes'):
        if w.startswith(k):
            return k
    return 'not-disclosed'


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = list(wb['AI Learning Directory'].iter_rows(values_only=True))
    head = rows[0]
    matrix = list(wb['AI Evidence Matrix'].iter_rows(values_only=True))[1:]
    outreach = list(wb['Vendor Outreach'].iter_rows(values_only=True))[1:]
    report = []

    for raw in rows[1:]:
        r = dict(zip(head, raw))
        name = text(r['Product name'])
        if not name:
            continue
        pid, vid = IDS[name]
        core = text(r['Core product source']) or text(r['Website'])
        privacy = text(r['AI / privacy source']) or core
        checked = r['Date last verified'].strftime('%Y-%m-%d') if r['Date last verified'] else CHECKED
        gaps, tasks = [], []

        # --- AI profile from the evidence matrix -------------------------------------------
        areas = {a: {'answers': []} for a in ('dataPrivacy', 'learnerOversight', 'pedagogy', 'outputOwnership')}
        rows_for = {m[2]: m for m in matrix if m[0] == name}
        established = {}
        for field, (area, question) in QUESTIONS.items():
            m = rows_for.get(field)
            if not m:
                areas[area]['answers'].append({'question': question, 'level': 'research-ongoing'})
                continue
            value, status, origin, source, mchecked, note = text(m[3]), m[4], m[5], text(m[6]), m[7], text(m[8])
            source = source if source and source.startswith('http') else None
            lvl, conflict = level_of(status, origin, source, value)
            ov = OVERRIDES.get((pid, field), {})
            if 'conflict' in ov and not ov['conflict'] and conflict:
                conflict = False
                lvl = 'vendor-disclosed' if source and value else 'research-ongoing'
            if 'value' in ov:
                value, note, lvl = ov['value'], ov['note'], 'vendor-disclosed'
            if ov.get('drop_note'):
                note = None
            a = {'question': question, 'level': lvl}
            if value and not NOT_ESTABLISHED.match(value):
                a['value'] = pretty(value)
            if lvl != 'research-ongoing' or conflict:
                a['source'] = source
                a['checked'] = mchecked.strftime('%Y-%m-%d') if hasattr(mchecked, 'strftime') else checked
                if note and not note.startswith('No field-specific'):
                    a['note'] = note
            if conflict:
                a['conflict'] = True
            if lvl == 'research-ongoing':
                q = text(m[11])
                if q:
                    tasks.append(f'Ask vendor ({question}): {q}')
            areas[area]['answers'].append(a)
            established[field] = (lvl, a)

        # Area summaries: the researcher's notes, where they say something about this product.
        for col, area in (('AI data notes', 'dataPrivacy'), ('AI oversight notes', 'learnerOversight'),
                          ('AI age notes', 'learnerOversight'), ('AI grounding notes', 'pedagogy'),
                          ('AI integrity notes', 'pedagogy'), ('AI output notes', 'outputOwnership')):
            n = text(r.get(col))
            if n and not BOILERPLATE.match(n):
                tasks.append(f'Researcher note ({area}), not shown until sourced: {n}')

        def matrix_list(field):
            m = rows_for.get(field)
            if m and level_of(m[4], m[5], text(m[6]), text(m[3]))[0] == 'vendor-disclosed':
                return split(m[3])
            return []

        ai_profile = {'toolTypes': matrix_list('AI tool types'), 'audience': matrix_list('AI audience'), 'areas': areas}

        # aiDisclosure (the At a glance rows): only what the matrix established.
        tr = established.get('AI disclosure - customer data trains models')
        mo = established.get('AI disclosure - models used')
        disc = {'models': [], 'trainsOnCustomerData': 'not-disclosed'}
        notes = []
        disc_source = privacy
        if tr and tr[0] == 'vendor-disclosed':
            disc['trainsOnCustomerData'] = trains_enum(tr[1].get('value'))
            notes.append(tr[1]['value'])
            disc_source = tr[1]['source']
        elif tr and tr[1].get('conflict'):
            notes.append('Sources conflict on whether customer content trains AI models: see the data privacy answers.')
        if mo and mo[0] == 'vendor-disclosed' and mo[1].get('value'):
            disc['models'] = [mo[1]['value']]
        if notes:
            disc['notes'] = ' '.join(notes)
        ai_disclosure = fact(disc, disc_source, checked)

        # --- Load or start the record ---------------------------------------------------------
        file = PRODUCTS / f'{pid}.json'
        existing = json.loads(file.read_text()) if file.exists() else None
        if existing:
            d = existing
            d['secondaryCategories'] = sorted(set(d.get('secondaryCategories', [])) | {'ai-for-learning'})
            d['aiProfile'] = ai_profile
            if d.get('aiDisclosure', {}).get('value', {}).get('trainsOnCustomerData', 'not-disclosed') == 'not-disclosed' or disc['trainsOnCustomerData'] != 'not-disclosed':
                d['aiDisclosure'] = ai_disclosure
            d['researchTasks'] = list(dict.fromkeys(d.get('researchTasks', []) + tasks))
            d['alternatives'] = list(dict.fromkeys(d.get('alternatives', []) + [x for g in GROUPS if pid in g for x in g if x != pid][:3]))
            file.write_text(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
            report.append((pid, 'merged'))
            continue

        d = {
            'name': name if name != 'Quizizz (Wayground)' else 'Wayground (formerly Quizizz)',
            'vendor': vid,
            'category': 'ai-for-learning',
            'secondaryCategories': SECONDARY.get(pid, []),
            'website': text(r['Website']),
            'summary': text(r['Summary']),
        }
        mk = markets(r['Markets'])
        if mk:
            d['primaryMarket'] = fact(mk, core, checked)
        else:
            gaps.append({'field': 'primaryMarket', 'note': f'Workbook: {r["Markets"]}'})
        for key, col in (('useCases', 'Use cases'), ('keyFeatures', 'Key features'), ('integrations', 'Integrations')):
            v = split(r[col])
            if v:
                d[key] = fact(v, core, checked)
        if pid in STANDARDS:
            d['standards'] = fact(STANDARDS[pid], core, checked)
        else:
            gaps.append({'field': 'standards', 'note': f'Workbook: {r["Interoperability standards"]}'})
        price = text(r['Pricing / commercial model']) or ''
        quote = 'quote' in price.lower()
        d['pricing'] = fact({'public': not quote, 'notes': price.rstrip('.') + '.'}, text(r['Website']), checked)
        if quote:
            d['pricingModel'] = fact({'basis': 'quote'}, text(r['Website']), checked)
        else:
            gaps.append({'field': 'pricing basis', 'note': price})
        gaps.append({'field': 'price from', 'note': 'Not in workbook'})
        if not quote:
            gaps.append({'field': 'free tier', 'note': price})
            gaps.append({'field': 'trial', 'note': 'Not in workbook'})
        d['deployment'] = fact(['cloud'], core, checked)
        for f in ('accessibility standard', 'security', 'data residency', 'geographic availability'):
            gaps.append({'field': f, 'note': 'Not in AI workbook'})
        d['aiDisclosure'] = ai_disclosure
        d['aiProfile'] = ai_profile
        d['alternatives'] = list(dict.fromkeys(x for g in GROUPS if pid in g for x in g if x != pid))[:5]
        d['evidence'] = []
        d['commercialRelationship'] = {'kind': 'none'}
        d['status'] = 'active'
        d['lastVerified'] = checked
        d['draft'] = False
        gap_text = text(r['Research gaps / next action'])
        if gap_text:
            tasks.insert(0, gap_text)
        for o in outreach:
            if o[1] == name:
                tasks.insert(0, f'[{o[0]}] {o[3]}: {o[4]} (route: {o[2]}; evidence wanted: {o[5]})')
        d['researchTasks'] = list(dict.fromkeys(tasks))
        d['dataGaps'] = gaps
        file.write_text(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
        report.append((pid, 'created'))

        vfile = VENDORS / f'{vid}.json'
        if not vfile.exists():
            from urllib.parse import urlparse
            site = VENDOR_SITES.get(vid) or f'https://{urlparse(text(r["Website"])).netloc}/'
            v = {
                'name': VENDOR_NAMES[vid], 'website': site, 'status': 'active', 'lastVerified': checked, 'draft': False,
                'researchTasks': ['Company details (headquarters, founded, size, funding, ownership) not in the AI workbook.'],
                'dataGaps': [{'field': f, 'note': 'Not in AI workbook'} for f in ('headquarters', 'founded', 'size', 'funding', 'ownership')],
            }
            vfile.write_text(json.dumps(v, indent=2, ensure_ascii=False) + '\n')

    for pid, what in report:
        print(f'{what:8} {pid}')


if __name__ == '__main__':
    main(sys.argv[1])
