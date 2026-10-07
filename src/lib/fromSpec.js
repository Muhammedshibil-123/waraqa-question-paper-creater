import { uid } from './utils';
import { MODEL, parseBulk, totalMarks } from './models';
import { TEMPLATES, makePaper } from './templates';

/* Turns the simple paper an AI sends through the connector (server/mcp.js) into a full Waraqa paper.
   Anything unknown is dropped and missing fields fall back to the model defaults, so a sloppy spec still opens. */

const str = (v) => (v == null ? '' : String(v));
const num = (v, fallback) => (v !== '' && v != null && Number.isFinite(+v) ? +v : fallback);

const ITEM = {
  choose: (x) => ({ text: str(x.text), options: Array.isArray(x.options) ? x.options.map(str) : [], answer: str(x.answer) }),
  words: (x) => ({ word: str(x.word ?? x.text), answer: str(x.answer) }),
  match: (x) => ({ a: str(x.a), b: str(x.b) }),
  truefalse: (x) => ({ text: str(x.text), answer: !(x.answer === false || /^(f|false|x|✗|خ|خطأ)$/i.test(str(x.answer).trim())) }),
  poem: (x) => ({ r: str(x.r), l: str(x.l) }),
  dialogue: (x) => ({ speaker: str(x.speaker), text: str(x.text) }),
  colour: (x) => ({ label: str(x.label ?? x.text) }),
};
const textItem = (x) => ({ text: str(x.text), answer: str(x.answer) });

function item(type, x) {
  if (typeof x === 'string' || typeof x === 'number') return parseBulk(type, String(x))[0] || null;
  if (!x || typeof x !== 'object') return null;
  return { id: uid(), ...(ITEM[type] || textItem)(x) };
}

function section(s) {
  const m = s && MODEL[s.type];
  if (!m || s.type === 'picture') return null;
  const out = { id: uid(), type: s.type, hidden: false, marks: s.type === 'text' || s.type === 'pagebreak' ? '' : 4, ...m.make() };
  for (const [k, def] of Object.entries(out)) {
    if (['id', 'type', 'hidden', 'items', 'image'].includes(k) || s[k] == null) continue;
    const v = s[k];
    if (k === 'marks') out.marks = num(v, out.marks);
    else if (typeof def === 'number') out[k] = num(v, def);
    else if (typeof def === 'boolean') out[k] = !!v;
    else if (Array.isArray(def)) out[k] = Array.isArray(v) ? v.map(str) : def;
    else if (def && typeof def === 'object') out[k] = v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, str(b)])) : def;
    else out[k] = str(v);
  }
  if (out.items && Array.isArray(s.items)) out.items = s.items.map((x) => item(s.type, x)).filter(Boolean);
  if (s.type === 'table' && Array.isArray(out.heads) && !out.heads.length) out.heads = ['', ''];
  return out;
}

export function paperFromSpec(spec, { profile = {}, importId } = {}) {
  const h = spec.header || {};
  const template = TEMPLATES.find((t) => t.id === spec.template) || (spec.direction === 'ltr' ? TEMPLATES.find((t) => t.id === 'english') : TEMPLATES[0]);
  const overrides = {};
  for (const k of ['examTitle', 'subject', 'className', 'time', 'date', 'school']) if (h[k] != null && h[k] !== '') overrides[k] = str(h[k]);
  const doc = makePaper({ template, mode: 'blank', profile, overrides });
  doc.sections = (Array.isArray(spec.sections) ? spec.sections : []).map(section).filter(Boolean);
  doc.header.marks = num(h.marks, totalMarks(doc.sections) || doc.header.marks);
  if (spec.direction === 'rtl' || spec.direction === 'ltr') doc.settings.dir = spec.direction;
  if (spec.name) doc.name = str(spec.name).slice(0, 80);
  if (importId) doc.importId = importId;
  return doc;
}
