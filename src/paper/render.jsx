import React from 'react';
import { detectDir, fmtNum, sectionLabel, fmtMarks, splitBlanks, hasBlank, seededShuffle, arLetter, enLetter, toArabicDigits } from '../lib/utils';

/* ---------------- small pieces ---------------- */

const LABELS = {
  en: { Class: 'Class', Grade: 'Grade', Marks: 'Marks', Time: 'Time', Name: 'Name', Roll: 'Roll No', ClassDiv: 'Class & Division', Subject: 'Subject', Date: 'Date of Examination', Obtained: 'Marks Obtained', Serial: 'Serial No', Code: 'CODE', Page: 'Page', of: 'of', key: 'ANSWER KEY' },
  ar: { Class: 'الصف', Grade: 'الصف', Marks: 'الدرجة', Time: 'الزمن', Name: 'الاسم', Roll: 'رقم الجلوس', ClassDiv: 'الصف والشعبة', Subject: 'المادة', Date: 'تاريخ الامتحان', Obtained: 'الدرجة المحصلة', Serial: 'الرقم التسلسلي', Code: 'الرمز', Page: 'صفحة', of: 'من', key: 'نموذج الإجابة' },
};
export const labelsFor = (s) => LABELS[s.labels === 'ar' ? 'ar' : 'en'];

export function Blank({ ans, wide, units }) {
  // 4 underscores = default width; each extra one makes the blank longer
  const style = units > 4 && !wide ? { minWidth: `${(units * 1.35).toFixed(2)}em` } : undefined;
  return <span className={'bl' + (wide ? ' wide' : '') + (ans ? ' ans' : '')} style={style}>{ans || '\u00a0'}</span>;
}

/** text with ____ blanks; answers (split by / or ،) fill blanks in order when showing the key */
export function Rich({ text, answer, showAns, forceBlank, blankAtStart }) {
  const parts = splitBlanks(text);
  const answers = showAns && answer ? String(answer).split(/\s*[\/،]\s*/) : [];
  let bi = 0;
  // text keeps every space/newline the teacher typed (see .rt in paper.css)
  const out = parts.map((p, i) => (p.blank ? <Blank key={i} units={p.units} ans={answers[bi++] || (showAns && bi === 1 ? answer : '')} /> : <span key={i} className="rt">{p.text}</span>));
  if (forceBlank && !hasBlank(text)) {
    const b = <Blank key="fb" ans={showAns ? answer : ''} />;
    return blankAtStart ? <>{b} {out}</> : <>{out} {b}</>;
  }
  return <>{out}</>;
}

export function Lines({ n, style }) {
  if (!n) return null;
  return <div className="lines">{Array.from({ length: n }, (_, i) => <div key={i} className={'ln ' + (style === 'line' ? 'solid' : '')} />)}</div>;
}

const Num = ({ n, dir, s }) => <span className="num">{fmtNum(n, s.numeral, dir)}.</span>;

function marksText(m, s, dir) {
  const v = fmtMarks(m, s.numeral === 'arabic' ? 'arabic' : 'western');
  if (!v) return '';
  switch (s.marksFmt) {
    case 'bracket': return `[${v}]`;
    case 'words': return dir === 'rtl' ? `(${v} ${+m === 1 ? 'درجة' : +m <= 10 && +m >= 3 ? 'درجات' : 'درجة'})` : `(${v} ${+m === 1 ? 'mark' : 'marks'})`;
    default: return `(${v})`;
  }
}

function WordBox({ text, style }) {
  if (!text) return null;
  const words = String(text).split(/\s*[\/،,]\s*/).filter(Boolean);
  return (
    <div className={'wordbox ' + (style || 'box')} dir="auto">
      {words.map((w, i) => <span key={i} className="wb-w">{w}</span>)}
    </div>
  );
}

/* ---------------- headers ---------------- */

function Field({ label, wide, children, line = 'dots' }) {
  return <span className={'hf' + (wide ? ' wide' : '')}><span className="hf-l">{label}:</span>{children ? <span className="hf-v">{children}</span> : <span className={'hf-line ' + line} />}</span>;
}

export function PaperHeader({ h, s, answers }) {
  const L = labelsFor(s);
  const dir = s.labels === 'ar' ? 'rtl' : 'ltr';
  const cl = h.classLabel === 'Grade' ? L.Grade : L.Class;
  const f = h.fields || {};
  const ln = s.fieldLine || 'dots';
  const keyBadge = answers ? <div className="key-badge">{L.key}</div> : null;
  const studentRows = (
    <>
      {f.name && <div className="hrow"><Field label={L.Name} wide line={ln} /></div>}
      {(f.roll || f.classDiv || f.subjectLine) && (
        <div className="hrow">
          {f.roll && <Field label={L.Roll} line={ln} />}
          {f.classDiv && <Field label={L.ClassDiv} line={ln} />}
          {f.subjectLine && <Field label={L.Subject} wide line={ln} />}
        </div>
      )}
      {(f.date || f.obtained) && (
        <div className="hrow">
          {f.date && <Field label={L.Date} wide line={ln} />}
          {f.obtained && <span className="hf obt"><span className="hf-l">{L.Obtained}:</span><span className="obt-box" /></span>}
        </div>
      )}
    </>
  );

  if (h.style === 'classic') {
    return (
      <div className="ph ph-classic" dir={dir}>
        {keyBadge}
        {h.logo && <img className="ph-logo-c" src={h.logo.src} alt="" />}
        {h.school && <div className="ph-school">{h.school}</div>}
        <div className="ph-title">{h.examTitle}</div>
        {h.subject && <div className="ph-subject">{h.subject}</div>}
        <div className="hrow spread">
          <span>{h.className ? `${cl}: ${h.className}` : ''}</span>
          <span className="ph-right">
            {h.time ? <span>{L.Time}: {h.time}</span> : null}
            {h.marks ? <span>{L.Marks}: {h.marks}</span> : null}
          </span>
        </div>
        {studentRows}
        <div className="ph-rule" />
      </div>
    );
  }

  if (h.style === 'boxed') {
    return (
      <div className="ph ph-boxed" dir={dir}>
        {keyBadge}
        <div className="pb-top">
          {h.logo ? <img className="ph-logo" src={h.logo.src} alt="" /> : <span className="ph-logo-sp" />}
          <div className="pb-mid">
            {h.school && <div className="ph-school">{h.school}</div>}
            <div className="ph-title">{h.examTitle}</div>
            {h.subject && <div className="ph-subject">{h.subject}</div>}
          </div>
          <span className="ph-logo-sp" />
        </div>
        <div className="pb-grid">
          <span>{cl}: <b>{h.className}</b></span>
          {h.time ? <span>{L.Time}: <b>{h.time}</b></span> : <span />}
          <span>{L.Marks}: <b>{h.marks}</b></span>
        </div>
        <div className="pb-student">{studentRows}</div>
      </div>
    );
  }

  // periodic & annual
  return (
    <div className={'ph ph-' + h.style} dir={dir}>
      {keyBadge}
      <div className="hrow spread top">
        <span className="ph-serial">{h.serial ? `${L.Serial}: ${h.serial}` : ''}</span>
        {h.code ? <span className="ph-code">{L.Code}: {h.code}</span> : <span />}
      </div>
      {h.school && <div className="ph-school">{h.school}</div>}
      <div className="ph-title">{h.examTitle}</div>
      <div className="ph-band">
        <span className="ph-cls">{h.className ? `${cl}: ${h.className}` : ''}</span>
        <span className="ph-subject big">{h.subject}</span>
        <span className="ph-mt">
          {h.marks ? <span>{L.Marks}: {h.marks}</span> : null}
          {h.time ? <span>{L.Time}:{h.time}</span> : null}
        </span>
      </div>
      {studentRows}
      <div className="ph-rule" />
    </div>
  );
}

/* ---------------- section heading ---------------- */

function Heading({ sec, label, s }) {
  const dir = detectDir(sec.title, s.dir);
  const mt = marksText(sec.marks, s, dir);
  const pos = s.marksPos || 'end';
  return (
    <div className={'sh hs-' + (s.headStyle || 'plain') + (s.boldTitle === false ? ' light' : '')} dir={dir}>
      {pos === 'above' && mt && <div className="sh-above">{mt}</div>}
      <div className="sh-row">
        {label && <span className="sh-num">{label}</span>}
        <span className="sh-title">{sec.title}{pos === 'inline' && mt ? <span className="sh-mk-in">{'  '}{mt}</span> : null}</span>
        {pos === 'end' && mt && <span className="sh-mk">{mt}</span>}
      </div>
      {pos === 'below' && mt && <div className="sh-below">{mt}</div>}
    </div>
  );
}

/* ---------------- question models -> chunks ---------------- */

const rows = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
const Grid = ({ cols, dir, children }) => <div className="grid" dir={dir} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>{children}</div>;

function itemsChunks(items, cols, dir, renderItem) {
  if (cols <= 1) return items.map((x, i) => <div key={x.id} dir={detectDir(x.text || x.word || '', dir)}>{renderItem(x, i)}</div>);
  return rows(items.map((x, i) => [x, i]), cols).map((r, ri) => (
    <Grid key={ri} cols={cols} dir={dir}>{r.map(([x, i]) => <div key={x.id} className="cell">{renderItem(x, i)}</div>)}</Grid>
  ));
}

/** content direction comes from the questions themselves, not the instruction line,
    so an English instruction over Arabic content still lays out right-to-left */
export function contentDir(sec, fallback) {
  const first = (sec.items || []).map((x) => x.text || x.word || x.a || x.label || x.r || x.l || x.speaker || '').find((t) => /[\p{L}\u0660-\u0669]/u.test(t))
    || sec.passage || sec.shared || sec.wordBox || (sec.heads || []).join(' ') || '';
  return detectDir(first, fallback);
}

function renderSection(sec, ctx) {
  const { s, answers, start } = ctx;
  const dir = contentDir(sec, detectDir(sec.title, s.dir));
  const items = sec.items || [];
  const n = (i) => start + i;
  const pre = [];
  let body = [];

  switch (sec.type) {
    case 'choose': {
      if (sec.shared) pre.push(<div className="shared" dir="auto">( {sec.shared} )</div>);
      body = itemsChunks(items, sec.columns || 1, dir, (x, i) => {
        const d = detectDir(x.text, dir);
        const opts = (x.options || []).filter(Boolean);
        return (
          <div className="it" dir={d}>
            <Num n={n(i)} dir={d} s={s} />
            <span className="it-b">
              <Rich text={x.text} answer={x.answer} showAns={answers} forceBlank blankAtStart={!!sec.shared} />
              {opts.length > 0 && sec.optStyle !== 'below' && <span className="opts"> ( {opts.join(' / ')} )</span>}
              {opts.length > 0 && sec.optStyle === 'below' && (
                <span className="opts-below">{opts.map((o, k) => <span key={k} className={answers && o === x.answer ? 'ans-mark' : ''}>{d === 'rtl' ? arLetter(k) : enLetter(k)}) {o}</span>)}</span>
              )}
            </span>
          </div>
        );
      });
      break;
    }
    case 'fill': {
      if (sec.wordBox) pre.push(<WordBox text={sec.wordBox} style={sec.boxStyle} />);
      body = itemsChunks(items, sec.columns || 1, dir, (x, i) => {
        const d = detectDir(x.text, dir);
        return <div className="it" dir={d}><Num n={n(i)} dir={d} s={s} /><span className="it-b"><Rich text={x.text} answer={x.answer} showAns={answers} forceBlank /></span></div>;
      });
      break;
    }
    case 'words': {
      body = itemsChunks(items, sec.columns || 2, dir, (x, i) => {
        const d = detectDir(x.word, dir);
        const b = <Blank ans={answers ? x.answer : ''} />;
        return (
          <div className="it" dir={d}>
            <Num n={n(i)} dir={d} s={s} />
            <span className="it-b w-row">
              {sec.blankPos === 'before' ? <>{b} <span className="w-word">{x.word}</span></> : <><span className="w-word">{x.word}</span>{sec.connector ? <span className="w-con"> {sec.connector} </span> : ' '}{b}</>}
            </span>
          </div>
        );
      });
      break;
    }
    case 'short':
    case 'translate': {
      body = items.map((x, i) => {
        const d = detectDir(x.text, dir);
        return (
          <div key={x.id} dir={d}>
            <div className="it" dir={d}><Num n={n(i)} dir={d} s={s} /><span className="it-b"><Rich text={x.text} /></span></div>
            {answers && x.answer ? <div className="ans-line" dir="auto">{x.answer}</div> : <div className="it-lines"><Lines n={+sec.lines || 0} style={s.blank} /></div>}
          </div>
        );
      });
      if (!items.length && sec.lines) body = [<Lines n={+sec.lines} style={s.blank} />];
      break;
    }
    case 'match': {
      const bs = items.map((x, i) => ({ b: x.b, i }));
      const shown = sec.shuffle && !answers ? seededShuffle(bs, sec.seed || 7) : bs;
      const dB = detectDir(items.map((x) => x.b).join(' '), dir);
      if (sec.headA || sec.headB) pre.push(<div className="match head" dir={dir}><span>{sec.headA}</span><span>{sec.headB}</span></div>);
      body = items.map((x, i) => {
        const dA = detectDir(x.a, dir);
        const b = shown[i];
        return (
          <div key={x.id} className="match" dir={dir}>
            <span className="m-a" dir={dA}><Num n={n(i)} dir={dA} s={s} /> {x.a}</span>
            <span className={'m-b' + (answers ? ' ans-mark' : '')} dir={dB}>{sec.lettered !== false && <span className="num">{dB === 'rtl' ? arLetter(i) : enLetter(i)})</span>} {b ? b.b : ''}</span>
          </div>
        );
      });
      break;
    }
    case 'truefalse': {
      body = items.map((x, i) => {
        const d = detectDir(x.text, dir);
        return <div key={x.id} className="it tf" dir={d}><Num n={n(i)} dir={d} s={s} /><span className="it-b"><Rich text={x.text} /></span><span className="tf-box">{answers ? <span className="ans-mark">{x.answer ? '✓' : '✗'}</span> : '\u00a0'}</span></div>;
      });
      break;
    }
    case 'arrange': {
      body = items.map((x, i) => {
        const d = detectDir(x.text, dir);
        if (sec.mode === 'sentences') {
          return <div key={x.id} className="it" dir={d}><span className="ord-box">{answers ? <span className="ans-mark">{d === 'rtl' ? toArabicDigits(x.answer) : x.answer}</span> : '\u00a0'}</span><span className="it-b rt">{x.text}</span></div>;
        }
        const w = String(x.text).split(/\s*\/\s*/).filter(Boolean);
        return (
          <div key={x.id} dir={d}>
            <div className="it" dir={d}><Num n={n(i)} dir={d} s={s} /><span className="it-b arr">{w.join(' / ')}</span></div>
            {answers && x.answer ? <div className="ans-line" dir="auto">{x.answer}</div> : <div className="it-lines"><Lines n={+sec.lines || 0} style={s.blank} /></div>}
          </div>
        );
      });
      break;
    }
    case 'passage': {
      if (sec.passage) pre.push(<div className="passage" dir="auto">{sec.passage}</div>);
      if (sec.starter || +sec.rewriteLines) {
        const d = detectDir(sec.starter, dir);
        body.push(
          <div dir={d}>
            <div className="it" dir={d}><Num n={n(0)} dir={d} s={s} /><span className="it-b">{sec.starter} <Blank wide /></span></div>
            <div className="it-lines"><Lines n={Math.max(0, (+sec.rewriteLines || 0) - 1)} style={s.blank} /></div>
          </div>
        );
      }
      const off = sec.starter || +sec.rewriteLines ? 1 : 0;
      items.forEach((x, i) => {
        const d = detectDir(x.text, dir);
        body.push(
          <div dir={d}>
            <div className="it" dir={d}><Num n={n(i + off)} dir={d} s={s} /><span className="it-b"><Rich text={x.text} answer={x.answer} showAns={answers} /></span></div>
            {answers && x.answer && !hasBlank(x.text) ? <div className="ans-line" dir="auto">{x.answer}</div> : <div className="it-lines"><Lines n={+sec.lines || 0} style={s.blank} /></div>}
          </div>
        );
      });
      break;
    }
    case 'poem': {
      if (sec.wordBox) pre.push(<WordBox text={sec.wordBox} />);
      body = items.map((x) => (
        <div key={x.id} className="poem" dir={detectDir(x.r + x.l, dir)}>
          <span className="pm-h">{x.r ? <Rich text={x.r} /> : <Blank wide />}</span>
          <span className="pm-h">{x.l ? <Rich text={x.l} /> : <Blank wide />}</span>
        </div>
      ));
      break;
    }
    case 'dialogue': {
      body = items.map((x) => (
        <div key={x.id} className="dlg" dir={detectDir(x.speaker + x.text, dir)}>
          <span className="dlg-sp">{x.speaker}{x.speaker ? ':' : ''}</span>
          <span className="dlg-t">{x.text ? <Rich text={x.text} /> : <Blank wide />}</span>
        </div>
      ));
      break;
    }
    case 'table': {
      if (sec.wordBox) pre.push(<WordBox text={sec.wordBox} />);
      const heads = sec.heads || [];
      const cdir = detectDir(heads.join(' '), dir);
      body = [
        <table className="ptable" dir={cdir}>
          <thead><tr>{heads.map((h, c) => <th key={c}>{h}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: +sec.rows || 0 }, (_, r) => (
              <tr key={r}>{heads.map((_, c) => <td key={c}>{(sec.cells || {})[`${r}_${c}`] || '\u00a0'}</td>)}</tr>
            ))}
          </tbody>
        </table>,
      ];
      break;
    }
    case 'picture': {
      const img = sec.image ? (
        <div className="pic" style={{ width: (sec.layout === 'side' ? 100 : sec.imgWidth || 50) + '%', aspectRatio: `${sec.image.w} / ${sec.image.h}` }}>
          <img src={sec.image.src} alt="" />
        </div>
      ) : <div className="pic empty" style={{ width: (sec.layout === 'side' ? 100 : sec.imgWidth || 50) + '%' }}>Picture</div>;
      const side = (
        <div className="pic-side">
          <WordBox text={sec.wordBox} style="plain" />
          <Lines n={+sec.lines || 0} style={s.blank} />
        </div>
      );
      body = [sec.layout === 'side'
        ? <div className="pic-wrap side" dir={dir} style={{ gridTemplateColumns: `${sec.imgWidth || 45}% 1fr` }}>{img}{side}</div>
        : <div className="pic-wrap top" dir={dir}>{img}{side}</div>];
      break;
    }
    case 'colour': {
      const sz = +sec.size || 60;
      body = rows(items, sec.columns || 2).map((r, ri) => (
        <Grid key={ri} cols={sec.columns || 2} dir={dir}>
          {r.map((x) => (
            <div key={x.id} className="col-cell">
              <div className="col-l" dir="auto">{x.label}</div>
              <div className={'shape ' + (sec.shape || 'circle')} style={{ width: sz, height: sz }} />
            </div>
          ))}
        </Grid>
      ));
      break;
    }
    default: break;
  }
  return { pre, body };
}

/** counts how many numbered items a section uses (for continuous numbering) */
function usedNumbers(sec) {
  const n = (sec.items || []).length;
  switch (sec.type) {
    case 'choose': case 'fill': case 'words': case 'short': case 'translate': case 'match': case 'truefalse': return n;
    case 'arrange': return sec.mode === 'sentences' ? 0 : n;
    case 'passage': return n + (sec.starter || +sec.rewriteLines ? 1 : 0);
    default: return 0;
  }
}

/**
 * Build the list of printable chunks. Each chunk: { key, el, keep, brk }
 * keep = keep with the next chunk (headings, word boxes)
 */
export function buildChunks(doc, { answers = false } = {}) {
  const s = doc.settings;
  const chunks = [{ key: 'hdr', el: <PaperHeader h={doc.header} s={s} answers={answers} />, keep: false, kind: 'hdr' }];
  let secIdx = 0;
  let counter = 1;
  (doc.sections || []).filter((x) => !x.hidden).forEach((sec) => {
    if (sec.type === 'pagebreak') { chunks.push({ key: sec.id, brk: true }); return; }
    if (sec.type === 'text') {
      const d = detectDir(sec.body || sec.title, s.dir);
      chunks.push({
        key: sec.id, kind: 'sec',
        el: (
          <div className="txt" dir={d} style={{ textAlign: sec.align === 'center' ? 'center' : sec.align === 'end' ? 'end' : 'start', fontWeight: sec.bold ? 700 : 400 }}>
            {sec.title ? <div className="txt-t">{sec.title}{sec.marks ? ` ${marksText(sec.marks, s, d)}` : ''}</div> : null}
            {sec.body}
          </div>
        ),
      });
      return;
    }
    const dir = detectDir(sec.title, s.dir);
    const label = sectionLabel(secIdx, s.secNum, dir);
    secIdx++;
    const start = s.continuous ? counter : 1;
    const { pre, body } = renderSection(sec, { s, answers, start });
    counter += usedNumbers(sec);
    const head = (
      <>
        <Heading sec={sec} label={label} s={s} />
        {pre.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}
      </>
    );
    // heading glued to first body chunk so a heading never sits alone at a page bottom
    if (body.length) {
      chunks.push({ key: sec.id + ':h', kind: 'sec', el: <div className="sec-first">{head}<div className="body-c">{body[0]}</div></div> });
      body.slice(1).forEach((b, i) => chunks.push({ key: sec.id + ':' + i, kind: 'item', el: <div className="body-c">{b}</div> }));
    } else {
      chunks.push({ key: sec.id + ':h', kind: 'sec', el: <div className="sec-first">{head}</div> });
    }
  });
  return chunks;
}
