import { detectDir, fmtNum, sectionLabel, fmtMarks, splitBlanks, hasBlank, seededShuffle, arLetter, enLetter } from '../lib/utils';
import { labelsFor, contentDir } from '../paper/render';

const AR_MAP = { 'Noto Naskh Arabic': 'Traditional Arabic', Amiri: 'Amiri', 'Scheherazade New': 'Scheherazade New', Cairo: 'Cairo' };
const LA_MAP = { Tinos: 'Times New Roman', Arimo: 'Arial' };
const DOTS = '……………';

export async function buildDocx(doc, { answers = false } = {}) {
  const D = await import('docx');
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun, PageBreak, TabStopType, ShadingType, VerticalAlign } = D;
  const s = doc.settings;
  const h = doc.header;
  const L = labelsFor(s);
  const margin = Math.round(s.margin * 56.7);
  const contentW = 11906 - margin * 2;
  const font = { ascii: LA_MAP[s.laFont] || 'Times New Roman', hAnsi: LA_MAP[s.laFont] || 'Times New Roman', cs: AR_MAP[s.arFont] || 'Traditional Arabic', eastAsia: 'Times New Roman' };
  const pt = (px) => Math.round(px * 0.75 * 2); // half-points
  const base = pt(s.size);
  const head = pt(s.headSize || s.size + 1);
  const spacing = { line: Math.round(240 * Math.min(2, Math.max(1.15, s.lineHeight * 0.88))), after: 70 };

  const run = (text, o = {}) => new TextRun({ text: String(text ?? ''), font, size: o.size || base, sizeComplexScript: o.size || base, bold: o.bold, boldComplexScript: o.bold, rightToLeft: o.rtl, color: o.color, underline: o.underline ? {} : undefined });
  const para = (children, o = {}) => new Paragraph({ children, bidirectional: o.dir === 'rtl', alignment: o.align, spacing: { ...spacing, ...(o.spacing || {}) }, indent: o.indent, border: o.border, tabStops: o.tabStops, keepNext: o.keepNext });
  const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const NO_BORDERS = { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB };
  const line = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
  const ALL = { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line };
  const RED = 'C2412E';

  const richRuns = (text, dir, answer) => {
    const ans = answers && answer ? String(answer).split(/\s*[\/،]\s*/) : [];
    let bi = 0;
    return splitBlanks(text).map((p) => {
      if (!p.blank) return run(p.text, { rtl: dir === 'rtl' });
      const a = ans[bi++];
      return a ? run(` ${a} `, { rtl: dir === 'rtl', color: RED, bold: true }) : run(p.units > 4 ? '…'.repeat(Math.round(p.units * 1.25)) : DOTS, { rtl: dir === 'rtl' });
    });
  };
  const lines = (n) => Array.from({ length: +n || 0 }, () => para([run(' ')], { border: { bottom: { style: s.blank === 'line' ? BorderStyle.SINGLE : BorderStyle.DOTTED, size: 6, color: '333333', space: 1 } }, indent: { start: 600 }, spacing: { after: 60 } }));
  const ansPara = (text) => para([run(text, { color: RED, bold: true, rtl: detectDir(text) === 'rtl' })], { dir: detectDir(text), indent: { start: 600 } });
  const imgData = (src) => Uint8Array.from(atob(src.split(',')[1]), (c) => c.charCodeAt(0));

  const grid = (cells, cols, dir) => {
    const rowsArr = [];
    for (let i = 0; i < cells.length; i += cols) rowsArr.push(cells.slice(i, i + cols));
    const w = Math.floor(contentW / cols);
    return new Table({
      width: { size: contentW, type: WidthType.DXA }, columnWidths: Array(cols).fill(w), borders: NO_BORDERS, visuallyRightToLeft: dir === 'rtl',
      rows: rowsArr.map((r) => new TableRow({ children: Array.from({ length: cols }, (_, c) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: NO_BORDERS, children: r[c] ? (Array.isArray(r[c]) ? r[c] : [r[c]]) : [para([run('')])] })) })),
    });
  };
  const marksStr = (m, dir) => {
    const v = fmtMarks(m);
    if (!v) return '';
    if (s.marksFmt === 'bracket') return `[${v}]`;
    if (s.marksFmt === 'words') return dir === 'rtl' ? `(${v} درجات)` : `(${v} marks)`;
    return `(${v})`;
  };

  const out = [];
  /* ---------- header ---------- */
  const hdir = s.labels === 'ar' ? 'rtl' : 'ltr';
  const cls = `${h.classLabel === 'Grade' ? L.Grade : L.Class}: ${h.className || ''}`;
  const center = (t, size = pt(16), bold = true) => para([run(t, { bold, size, rtl: detectDir(t) === 'rtl' })], { align: AlignmentType.CENTER, spacing: { after: 20 } });
  const tabs = [{ type: TabStopType.CENTER, position: Math.round(contentW / 2) }, { type: TabStopType.RIGHT, position: contentW }];
  if (answers) out.push(para([run(L.key, { bold: true, color: RED })], { align: AlignmentType.RIGHT }));
  const formal = h.style === 'periodic' || h.style === 'annual';
  if (formal) out.push(para([run(h.serial ? `${L.Serial}: ${h.serial}` : '', { bold: true, size: pt(12.5) }), run('\t\t'), run(h.code ? ` ${L.Code}: ${h.code} ` : '', { bold: true, size: pt(13) })], { tabStops: tabs }));
  if (h.logo && !formal) out.push(para([new ImageRun({ data: imgData(h.logo.src), type: /png/.test(h.logo.src) ? 'png' : 'jpg', transformation: { width: 64, height: Math.round(64 * h.logo.h / h.logo.w) } })], { align: AlignmentType.CENTER }));
  if (h.school) out.push(center(h.school, pt(19)));
  out.push(center(h.examTitle, pt(16.5)));
  if (formal) {
    out.push(para([run(cls), run('\t'), run(h.subject || '', { bold: true, size: pt(24) }), run('\t'), run(h.marks ? `${L.Marks}: ${h.marks}` : '')], { tabStops: tabs, dir: hdir }));
    if (h.time) out.push(para([run(`\t\t${L.Time}: ${h.time}`)], { tabStops: tabs }));
  } else {
    if (h.subject) out.push(center(h.subject, pt(16)));
    const right = [h.time ? `${L.Time}: ${h.time}` : '', h.marks ? `${L.Marks}: ${h.marks}` : ''].filter(Boolean).join('    ');
    out.push(para([run(h.className ? cls : '', { bold: true }), run('\t\t'), run(right, { bold: true })], { tabStops: tabs, dir: hdir }));
  }
  const f = h.fields || {};
  const fl = s.fieldLine || 'dots';
  const blankLine = (n) => (fl === 'solid' ? '_'.repeat(n) : fl === 'dash' ? '- '.repeat(Math.round(n / 2)) : '.'.repeat(Math.round(n * 1.4)));
  const fld = (label) => `${label}: ${blankLine(16)}`;
  if (f.name) out.push(para([run(`${L.Name}: ${blankLine(54)}`)], { dir: hdir }));
  const r2 = [f.roll && fld(L.Roll), f.classDiv && fld(L.ClassDiv), f.subjectLine && fld(L.Subject)].filter(Boolean);
  if (r2.length) out.push(para([run(r2.join('   '))], { dir: hdir }));
  const r3 = [f.date && `${L.Date}: ${blankLine(22)}`, f.obtained && `${L.Obtained}: [          ]`].filter(Boolean);
  if (r3.length) out.push(para([run(r3.join('   '))], { dir: hdir }));
  out.push(para([run('')], { border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000', space: 1 } }, spacing: { after: 120 } }));

  /* ---------- sections ---------- */
  let secIdx = 0;
  let counter = 1;
  for (const sec of doc.sections.filter((x) => !x.hidden)) {
    if (sec.type === 'pagebreak') { out.push(new Paragraph({ children: [new PageBreak()] })); continue; }
    if (sec.type === 'linebreak') { out.push(para([run('')], { spacing: { before: 0, after: 0, line: Math.round(spacing.line * (+sec.lines || 1)) } })); continue; }
    const hd = detectDir(sec.title || sec.body, s.dir);
    if (sec.type === 'text') {
      if (sec.title) out.push(para([run(sec.title, { bold: true, size: head, rtl: hd === 'rtl' })], { dir: hd }));
      out.push(para([run(sec.body, { bold: sec.bold, rtl: hd === 'rtl' })], { dir: hd, align: sec.align === 'center' ? AlignmentType.CENTER : undefined }));
      continue;
    }
    const hrtl = hd === 'rtl';
    const label = sectionLabel(secIdx++, s.secNum, hd);
    const mk = s.marksPos === 'none' ? '' : marksStr(sec.marks, hd);
    const hruns = [label ? run(label + '   ', { bold: true, size: head, rtl: hrtl }) : null, run(sec.title, { bold: true, size: head, rtl: hrtl, underline: s.headStyle === 'underline' }), mk ? run('   \u200E' + mk, { bold: true, size: head }) : null].filter(Boolean);
    out.push(new Paragraph({ children: hruns, bidirectional: hrtl, spacing: { before: Math.round(s.gap * 12), after: 60 }, keepNext: true, shading: s.headStyle === 'shaded' ? { type: ShadingType.CLEAR, fill: 'ECECEC', color: 'auto' } : undefined }));

    const dir = contentDir(sec, hd);
    const rtl = dir === 'rtl';
    const start = s.continuous ? counter : 1;
    const num = (i, d) => fmtNum(start + i, s.numeral, d) + '. ';
    const items = sec.items || [];
    const ip = (children, d) => para(children, { dir: d, indent: { start: 300 } });
    const wordLine = (text) => ip([run(`( ${text.split(/\s*[\/،,]\s*/).join('  /  ')} )`, { bold: true, rtl })], dir);

    switch (sec.type) {
      case 'choose': case 'fill': {
        if (sec.shared) out.push(ip([run(`( ${sec.shared} )`, { bold: true, rtl })], dir));
        if (sec.wordBox) {
          out.push(new Table({ width: { size: contentW, type: WidthType.DXA }, columnWidths: [contentW], borders: ALL, rows: [new TableRow({ children: [new TableCell({ width: { size: contentW, type: WidthType.DXA }, borders: ALL, children: [para([run(sec.wordBox.split(/\s*[\/،,]\s*/).join('   /   '), { bold: true, rtl })], { align: AlignmentType.CENTER, dir })] })] })] }));
        }
        const cells = items.map((x, i) => {
          const d = detectDir(x.text, dir);
          const txt = hasBlank(x.text) ? x.text : sec.shared ? '____ ' + x.text : x.text + ' ____';
          const r = [run(num(i, d), { rtl: d === 'rtl' }), ...richRuns(txt, d, x.answer)];
          const opts = (x.options || []).filter(Boolean);
          if (opts.length) r.push(run(sec.optStyle === 'below' ? '   ' + opts.map((o, k) => `${d === 'rtl' ? arLetter(k) : enLetter(k)}) ${o}`).join('    ') : `  ( ${opts.join(' / ')} )`, { rtl: d === 'rtl' }));
          return ip(r, d);
        });
        if ((sec.columns || 1) > 1) out.push(grid(cells, sec.columns, dir)); else out.push(...cells);
        break;
      }
      case 'words': {
        const cells = items.map((x, i) => {
          const d = detectDir(x.word, dir);
          const has = answers && x.answer;
          const blank = has ? ` ${x.answer} ` : DOTS;
          const parts = sec.blankPos === 'before' ? `${blank} ${x.word}` : `${x.word} ${sec.connector || ''} ${blank}`;
          return ip([run(num(i, d), { rtl: d === 'rtl' }), run(parts, { rtl: d === 'rtl', color: has ? RED : undefined })], d);
        });
        const cols = sec.columns || 2;
        if (cols > 1) out.push(grid(cells, cols, dir)); else out.push(...cells);
        break;
      }
      case 'short': case 'translate': case 'arrange': case 'passage': {
        if (sec.type === 'passage' && sec.passage) {
          const pd = detectDir(sec.passage);
          out.push(para([run(sec.passage, { rtl: pd === 'rtl' })], { dir: pd, align: AlignmentType.JUSTIFIED, indent: { start: 300, firstLine: 400 } }));
        }
        let off = 0;
        if (sec.type === 'passage' && (sec.starter || +sec.rewriteLines)) {
          const d = detectDir(sec.starter, dir);
          out.push(ip([run(num(0, d) + (sec.starter || '') + ' ' + DOTS + DOTS + DOTS, { rtl: d === 'rtl' })], d));
          out.push(...lines(Math.max(0, (+sec.rewriteLines || 0) - 1)));
          off = 1;
        }
        items.forEach((x, i) => {
          const d = detectDir(x.text, dir);
          if (sec.type === 'arrange' && sec.mode === 'sentences') {
            out.push(ip([run(answers && x.answer ? `( ${x.answer} )  ` : '(      )  ', { rtl: d === 'rtl', color: answers ? RED : undefined }), run(x.text, { rtl: d === 'rtl' })], d));
            return;
          }
          out.push(ip([run(num(i + off, d), { rtl: d === 'rtl' }), ...richRuns(x.text, d, sec.type === 'passage' ? x.answer : '')], d));
          if (answers && x.answer && !(sec.type === 'passage' && hasBlank(x.text))) out.push(ansPara(x.answer)); else out.push(...lines(sec.lines));
        });
        if (!items.length && sec.type === 'short') out.push(...lines(sec.lines));
        break;
      }
      case 'match': {
        const shown = sec.shuffle !== false && !answers ? seededShuffle(items.map((x) => x.b), sec.seed || 7) : items.map((x) => x.b);
        const dB = detectDir(items.map((x) => x.b).join(' '), dir);
        const cells = [];
        if (sec.headA || sec.headB) cells.push(para([run(sec.headA, { bold: true, rtl })], { dir }), para([run(sec.headB, { bold: true, rtl })], { dir }));
        items.forEach((x, i) => {
          const dA = detectDir(x.a, dir);
          cells.push(ip([run(num(i, dA) + x.a, { rtl: dA === 'rtl' })], dA));
          cells.push(para([run((sec.lettered !== false ? (dB === 'rtl' ? arLetter(i) : enLetter(i)) + ') ' : '') + (shown[i] || ''), { rtl: dB === 'rtl', color: answers ? RED : undefined })], { dir: dB }));
        });
        out.push(grid(cells, 2, dir));
        break;
      }
      case 'truefalse':
        items.forEach((x, i) => {
          const d = detectDir(x.text, dir);
          out.push(ip([run(num(i, d) + x.text + '   ', { rtl: d === 'rtl' }), run(answers ? `( ${x.answer ? '✓' : '✗'} )` : '(      )', { rtl: d === 'rtl', color: answers ? RED : undefined })], d));
        });
        break;
      case 'poem': {
        if (sec.wordBox) out.push(wordLine(sec.wordBox));
        const cells = items.flatMap((x) => [x.r, x.l].map((t) => para(t ? richRuns(t, detectDir(t, dir)) : [run(DOTS + DOTS + DOTS)], { dir: detectDir(t || '', dir), align: AlignmentType.CENTER })));
        out.push(grid(cells, 2, dir));
        break;
      }
      case 'dialogue':
        items.forEach((x) => {
          const d = detectDir(x.speaker + x.text, dir);
          out.push(ip([run(x.speaker ? x.speaker + ': ' : '', { bold: true, rtl: d === 'rtl' }), ...(x.text ? richRuns(x.text, d) : [run(DOTS + DOTS + DOTS + DOTS + DOTS, { rtl: d === 'rtl' })])], d));
        });
        break;
      case 'table': {
        if (sec.wordBox) out.push(wordLine(sec.wordBox));
        const heads = sec.heads || [];
        const cdir = detectDir(heads.join(' '), dir);
        const w = Math.floor(contentW / Math.max(1, heads.length));
        const cell = (t, bold) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: ALL, verticalAlign: VerticalAlign.CENTER, shading: bold ? { type: ShadingType.CLEAR, fill: 'F0F0F0', color: 'auto' } : undefined, children: [para([run(t || ' ', { bold, rtl: detectDir(t || '', cdir) === 'rtl' })], { align: AlignmentType.CENTER, dir: cdir, spacing: { before: 60, after: 60 } })] });
        out.push(new Table({
          width: { size: contentW, type: WidthType.DXA }, columnWidths: Array(heads.length).fill(w), borders: ALL, visuallyRightToLeft: cdir === 'rtl',
          rows: [new TableRow({ tableHeader: true, children: heads.map((t) => cell(t, true)) }), ...Array.from({ length: +sec.rows || 0 }, (_, r) => new TableRow({ children: heads.map((_, c) => cell((sec.cells || {})[`${r}_${c}`] || '')) }))],
        }));
        break;
      }
      case 'picture': {
        if (sec.image) {
          const wpx = Math.round((contentW / 15) * ((sec.imgWidth || 45) / 100));
          out.push(para([new ImageRun({ data: imgData(sec.image.src), type: /png/.test(sec.image.src) ? 'png' : 'jpg', transformation: { width: wpx, height: Math.round(wpx * sec.image.h / sec.image.w) } })], { align: AlignmentType.CENTER }));
        }
        if (sec.wordBox) out.push(wordLine(sec.wordBox));
        out.push(...lines(sec.lines));
        break;
      }
      case 'colour': {
        const cells = items.map((x) => [
          para([run(x.label, { bold: true, rtl: detectDir(x.label) === 'rtl' })], { align: AlignmentType.CENTER, dir }),
          para([run(sec.shape === 'square' ? '▢' : '◯', { size: pt(Math.min(54, (sec.size || 60) * 0.6)) })], { align: AlignmentType.CENTER, spacing: { after: 160 } }),
        ]);
        out.push(grid(cells, sec.columns || 2, dir));
        break;
      }
      default: break;
    }
    if (['choose', 'fill', 'words', 'short', 'translate', 'match', 'truefalse'].includes(sec.type) || (sec.type === 'arrange' && sec.mode !== 'sentences')) counter += items.length;
    if (sec.type === 'passage') counter += items.length + (sec.starter || +sec.rewriteLines ? 1 : 0);
  }

  const document = new Document({
    styles: { default: { document: { run: { font, size: base, sizeComplexScript: base } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: margin, bottom: margin, left: margin, right: margin } } }, children: out }],
  });
  return Packer.toBlob(document);
}
