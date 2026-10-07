export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
export const clone = (o) => JSON.parse(JSON.stringify(o));

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (s) => String(s).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);

const AR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LTR_RE = /[A-Za-z\u00C0-\u024F\u0D00-\u0D7F\u0900-\u097F]/;
export function detectDir(text, fallback = 'rtl') {
  if (!text) return fallback;
  for (const ch of String(text)) {
    if (AR_RE.test(ch)) return 'rtl';
    if (LTR_RE.test(ch)) return 'ltr';
  }
  return fallback;
}

export function roman(n) {
  if (n >= 40) return String(n);
  const map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  for (const [v, s] of map) while (n >= v) { r += s; n -= v; }
  return r;
}
const AR_ORD = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً', 'سابعاً', 'ثامناً', 'تاسعاً', 'عاشراً', 'حادي عشر', 'ثاني عشر', 'ثالث عشر', 'رابع عشر', 'خامس عشر', 'سادس عشر', 'سابع عشر', 'ثامن عشر', 'تاسع عشر', 'عشرون'];
const AR_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر'];
export const arLetter = (i) => AR_LETTERS[i % AR_LETTERS.length];
export const enLetter = (i) => String.fromCharCode(97 + (i % 26));

/** number for an item, respecting the numeral setting and the item's direction */
export function fmtNum(n, numeral, dir) {
  const useAr = numeral === 'arabic' || (numeral === 'auto' && dir === 'rtl');
  return useAr ? toArabicDigits(n) : String(n);
}

export function sectionLabel(i, style, dir) {
  switch (style) {
    case 'roman': return roman(i + 1);
    case 'number': return fmtNum(i + 1, 'auto', dir);
    case 'ordinal': return AR_ORD[i] || String(i + 1);
    case 'letter': return String.fromCharCode(65 + i);
    default: return '';
  }
}

/** 2.5 -> 2½ */
export function fmtMarks(m, numeral) {
  if (m === '' || m === null || m === undefined || isNaN(+m)) return '';
  const n = +m;
  const whole = Math.floor(n);
  const frac = +(n - whole).toFixed(2);
  let s = String(whole);
  if (frac === 0.5) s = (whole || '') + '½';
  else if (frac === 0.25) s = (whole || '') + '¼';
  else if (frac === 0.75) s = (whole || '') + '¾';
  else if (frac) s = String(n);
  return numeral === 'arabic' ? toArabicDigits(s) : s;
}

const BLANK_SPLIT = /(_{2,}|\.{4,}|…+)/;
const BLANK_ONLY = /^(_{2,}|\.{4,}|…+)$/;
/** blank length in "underscore units" — longer ____ in the editor gives a longer blank on paper */
const blankUnits = (p) => (p[0] === '_' ? p.length : p[0] === '.' ? p.length / 2 : p.length * 1.5);
export function splitBlanks(text) {
  return String(text || '').split(BLANK_SPLIT).filter((p) => p !== '').map((p) => {
    const blank = BLANK_ONLY.test(p);
    return blank ? { blank, text: p, units: blankUnits(p) } : { blank, text: p };
  });
}
export const hasBlank = (t) => BLANK_SPLIT.test(t || '');

/* deterministic shuffle by seed */
export function seededShuffle(arr, seed = 1) {
  const a = arr.slice();
  let s = seed || 1;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function shuffleWords(text) {
  const parts = String(text).split(/\s*\/\s*|\s+/).filter(Boolean);
  let out = parts;
  for (let t = 0; t < 6; t++) { out = seededShuffle(parts, Math.floor(Math.random() * 99999) + 1); if (out.join() !== parts.join()) break; }
  return out.join(' / ');
}

export function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + ' min ago';
  if (d < 86400) return Math.floor(d / 3600) + ' h ago';
  if (d < 86400 * 7) return Math.floor(d / 86400) + ' d ago';
  return new Date(ts).toLocaleDateString();
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
export const safeName = (s) => String(s || 'paper').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 60) || 'paper';

export function readFileAsDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
export function readFileAsText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
}
/** downscale an image to keep storage small; returns {src,w,h} */
export async function loadImage(file, maxW = 1400) {
  const src = await readFileAsDataURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  const isPng = /png/.test(file.type);
  return { src: c.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85), w, h };
}
