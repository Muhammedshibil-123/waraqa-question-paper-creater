import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { Page, ScaledPages, PAGE_H, PAGE_W, MM, paperStyle } from '../paper/Pager';
import { DEFAULT_SETTINGS } from '../lib/templates';
import { ExportStage, shareOrDownload } from '../export/stage';
import { Icon, IconBtn, Btn, Sheet, Toggle, TextInput, TextArea, Row, Seg, Stepper, useToast, Confirm, NumInput } from '../ui/kit';
import { uid, clone, safeName } from '../lib/utils';
import { db } from '../lib/db';

/* ---------------- model ---------------- */
const sub = (name, max = '') => ({ id: uid(), name, max });
export const SHEET_TEMPLATES = [
  { id: 'pt', name: 'All subjects', desc: 'MAL, ENG, HIN, MAT, EVS & GK, ARA, IT', title: 'PT II EXAMINATION 2025-26 CUMULATIVE SHEET', subjects: ['MAL', 'ENG', 'HIN', 'MAT', 'EVS & GK', 'ARA', 'IT'], opts: { adm: false, rank: true, sign: true } },
  { id: 'madrasa', name: 'Madrasa', desc: 'QUR, ARA, MS1, MS2', title: 'ANNUAL EXAMINATION 2025-26 CUMULATIVE SHEET', subjects: ['QUR', 'ARA', 'MS1', 'MS2'], opts: { adm: false, rank: true, sign: true } },
  { id: 'adm', name: 'With Adm No', desc: 'Roll and admission number, no rank', title: 'CUMULATIVE SHEET – ANNUAL EXAMINATION 2025-26', subjects: ['ENG', 'MAL', 'ARA', 'HIN', 'MAT', 'EVS/GK', 'IT', 'GK'], opts: { adm: true, rank: false, sign: true } },
  { id: 'blank', name: 'Blank sheet', desc: 'Add your own subjects', title: 'CUMULATIVE SHEET', subjects: ['Subject 1', 'Subject 2'], opts: { adm: false, rank: true, sign: true } },
];

export function makeSheet(t, { grade = '', students = [] } = {}) {
  const now = Date.now();
  return {
    id: uid(), kind: 'marksheet', templateId: t.id,
    name: `${grade ? 'Grade ' + grade + ', ' : ''}${t.title.replace(/CUMULATIVE SHEET/g, '').replace(/^[\s–-]+|[\s–-]+$/g, '').replace(/\s+/g, ' ').trim() || 'Mark sheet'}`,
    title: t.title, gradeLabel: 'GRADE', grade,
    subjects: t.subjects.map((n) => sub(n)),
    students: students.map((s) => ({ id: uid(), name: s.name || s, adm: s.adm || '', marks: {} })),
    opts: { adm: false, rank: true, sign: true, total: true, ...t.opts },
    footL: 'Signature of Class Teacher:', footR: 'Signature of Principal:',
    size: 13,
    createdAt: now, updatedAt: now,
  };
}

const isNum = (v) => v !== '' && v !== null && v !== undefined && !isNaN(+v);
export function computeSheet(sh) {
  const totals = sh.students.map((st) => {
    const vals = sh.subjects.map((s) => st.marks?.[s.id]);
    const nums = vals.filter(isNum).map(Number);
    if (!nums.length) return null;
    return +nums.reduce((a, b) => a + b, 0).toFixed(2);
  });
  const sorted = totals.filter((t) => t !== null && t > 0).sort((a, b) => b - a);
  const ranks = totals.map((t) => (t === null || t <= 0 ? '' : sorted.indexOf(t) + 1));
  return { totals, ranks };
}

/* ---------------- printable pages ---------------- */
function SheetCols({ sh }) {
  const extra = (sh.opts.adm ? 1 : 0) + (sh.opts.total !== false ? 1 : 0) + (sh.opts.rank ? 1 : 0);
  const fixed = 6 + (sh.opts.adm ? 7 : 0) + (sh.opts.total !== false ? 8 : 0) + (sh.opts.rank ? 7 : 0) + (sh.opts.sign ? 16 : 0);
  const name = 24;
  const each = Math.max(4, (100 - fixed - name) / Math.max(1, sh.subjects.length));
  return (
    <colgroup>
      <col style={{ width: '6%' }} />
      {sh.opts.adm && <col style={{ width: '7%' }} />}
      <col style={{ width: name + '%' }} />
      {sh.subjects.map((s) => <col key={s.id} style={{ width: each + '%' }} />)}
      {sh.opts.total !== false && <col style={{ width: '8%' }} />}
      {sh.opts.rank && <col style={{ width: '7%' }} />}
      {sh.opts.sign && <col style={{ width: '16%' }} />}
      {extra < 0 && null}
    </colgroup>
  );
}

function buildSheetChunks(sh) {
  const { totals, ranks } = computeSheet(sh);
  const T = ({ children, cls }) => <table className={'mtab ' + (cls || '')}><SheetCols sh={sh} /><tbody>{children}</tbody></table>;
  const head = (
    <T cls="mhead">
      <tr>
        <th>{sh.opts.adm ? 'ROLL' : 'SL.NO'}</th>
        {sh.opts.adm && <th>ADM NO</th>}
        <th>NAME OF STUDENT</th>
        {sh.subjects.map((s) => <th key={s.id} dir="auto">{s.name}{s.max ? <small>({s.max})</small> : null}</th>)}
        {sh.opts.total !== false && <th>TOTAL</th>}
        {sh.opts.rank && <th>RANK</th>}
        {sh.opts.sign && <th>PARENT’S SIGNATURE</th>}
      </tr>
    </T>
  );
  const rows = sh.students.map((st, i) => ({
    key: st.id,
    el: (
      <T cls="mrow">
        <tr>
          <td>{i + 1}</td>
          {sh.opts.adm && <td>{st.adm}</td>}
          <td className="nm" dir="auto">{st.name}</td>
          {sh.subjects.map((s) => <td key={s.id}>{st.marks?.[s.id] ?? ''}</td>)}
          {sh.opts.total !== false && <td className="b">{totals[i] ?? ''}</td>}
          {sh.opts.rank && <td className="b">{ranks[i]}</td>}
          {sh.opts.sign && <td />}
        </tr>
      </T>
    ),
  }));
  return {
    title: (
      <div className="mtitle">
        <div className="mt-1">{sh.title}</div>
        {(sh.grade || sh.gradeLabel) && <div className="mt-2">{sh.gradeLabel}{sh.grade ? ` : ${sh.grade}` : ''}</div>}
      </div>
    ),
    head, rows,
    foot: (
      <div className="mfoot"><span>{sh.footL}</span><span>{sh.footR}</span></div>
    ),
  };
}

export function SheetPages({ sh, onPages }) {
  const s = { ...DEFAULT_SETTINGS, margin: 12, size: sh.size || 13, pageNo: true, border: false, labels: 'en', footer: '' };
  const sig = JSON.stringify(sh);
  const c = useMemo(() => buildSheetChunks(sh), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const ref = useRef(null);
  const [layout, setLayout] = useState(null); // { pages, c } computed together
  useLayoutEffect(() => {
    const root = ref.current; if (!root) return;
    const kids = Array.from(root.children).map((n) => n.getBoundingClientRect().height);
    const [tH, hH, ...rest] = kids;
    const fH = rest.pop();
    const rH = rest;
    const avail = PAGE_H - 2 * s.margin * MM - 26;
    const out = [];
    let cur = { rows: [], title: true }; let h = tH + hH;
    rH.forEach((rh, i) => {
      if (h + rh > avail && cur.rows.length) { out.push(cur); cur = { rows: [], title: false }; h = hH; }
      cur.rows.push(i); h += rh;
    });
    if (h + fH > avail) { out.push(cur); cur = { rows: [], title: false, noHead: true }; }
    cur.foot = true; out.push(cur);
    setLayout({ pages: out, c });
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = layout?.pages || null;
  const lc = layout?.c || c;
  useEffect(() => { if (pages) onPages?.(pages.length); }, [pages, onPages]);
  return (
    <>
      <div className="paper measurer msheet" ref={ref} style={{ ...paperStyle(s), width: PAGE_W - 2 * s.margin * MM }} aria-hidden>
        {c.title}{c.head}{c.rows.map((r) => <div key={r.key}>{r.el}</div>)}{c.foot}
      </div>
      {pages && pages.map((p, i) => (
        <Page key={i} s={s} n={i + 1} total={pages.length} className="msheet">
          {p.title && lc.title}
          {!p.noHead && lc.head}
          {p.rows.map((ri) => lc.rows[ri] && <React.Fragment key={lc.rows[ri].key}>{lc.rows[ri].el}</React.Fragment>)}
          {p.foot && lc.foot}
        </Page>
      ))}
    </>
  );
}

/* ---------------- editor ---------------- */
export default function SheetEditor({ initial, onSaved, onBack }) {
  const [sh, setSh] = useState(initial);
  const [tab, setTab] = useState(initial.students.length ? 'marks' : 'setup');
  const [subj, setSubj] = useState(initial.subjects[0]?.id);
  const [mode, setMode] = useState('subject');
  const [paste, setPaste] = useState('');
  const [job, setJob] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [del, setDel] = useState(null);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1000px)').matches);
  const toast = useToast();
  const first = useRef(true);
  const deferred = useDeferredValue(sh);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const fn = () => setWide(mq.matches); mq.addEventListener('change', fn); return () => mq.removeEventListener('change', fn);
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(async () => { await db.put('docs', sh); onSaved(sh); }, 400);
    return () => clearTimeout(t);
  }, [sh]); // eslint-disable-line react-hooks/exhaustive-deps

  const up = (fn) => setSh((cur) => { const d = clone(cur); fn(d); d.updatedAt = Date.now(); return d; });
  const setMark = (sid, subId, v) => up((d) => { const st = d.students.find((x) => x.id === sid); st.marks = { ...(st.marks || {}), [subId]: v }; });
  const { totals, ranks } = computeSheet(sh);
  const curSub = sh.subjects.find((x) => x.id === subj) || sh.subjects[0];

  const addStudents = () => {
    const names = paste.split(/\r?\n/).map((l) => l.replace(/^\s*\d+[.)\-\s]+/, '').trim()).filter(Boolean);
    if (!names.length) return;
    up((d) => { d.students.push(...names.map((n) => ({ id: uid(), name: n, adm: '', marks: {} }))); });
    setPaste('');
    toast(`${names.length} students added`);
  };

  const onEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const all = Array.from(document.querySelectorAll('.mk-in'));
    const i = all.indexOf(e.target);
    all[i + 1]?.focus();
    all[i + 1]?.select?.();
  };

  const run = (kind, share) => new Promise((resolve, reject) => setJob({ kind, share, name: sh.name, resolve, reject }))
    .then((r) => r === 'downloaded' && toast('Saved to your downloads')).catch(() => toast('Could not create the file. Try Print.'));

  const csv = async () => {
    const head = ['SL.NO', ...(sh.opts.adm ? ['ADM NO'] : []), 'NAME', ...sh.subjects.map((s) => s.name), 'TOTAL', 'RANK'];
    const lines = sh.students.map((st, i) => [i + 1, ...(sh.opts.adm ? [st.adm] : []), st.name, ...sh.subjects.map((s) => st.marks?.[s.id] ?? ''), totals[i] ?? '', ranks[i]]);
    const text = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    await shareOrDownload(new Blob(['\ufeff' + text], { type: 'text/csv' }), safeName(sh.name) + '.csv', sh.name);
  };

  const marksPane = (
    <div className="edit-pane">
      {!sh.students.length ? (
        <div className="first-q"><p>Add your students first.</p><Btn kind="primary" onClick={() => setTab('setup')}>Add students</Btn></div>
      ) : (
        <>
          <div className="seg small"><button type="button" className={mode === 'subject' ? 'on' : ''} onClick={() => setMode('subject')}>One subject at a time</button><button type="button" className={mode === 'grid' ? 'on' : ''} onClick={() => setMode('grid')}>Full table</button></div>
          {mode === 'subject' ? (
            <>
              <div className="sub-chips">
                {sh.subjects.map((s) => {
                  const filled = sh.students.filter((st) => (st.marks?.[s.id] ?? '') !== '').length;
                  return <button type="button" key={s.id} className={'chip' + (curSub?.id === s.id ? ' on' : '')} onClick={() => setSubj(s.id)} dir="auto">{s.name} <small>{filled}/{sh.students.length}</small></button>;
                })}
              </div>
              <div className="mk-list">
                {sh.students.map((st, i) => (
                  <div key={st.id} className="mk-row">
                    <span className="ino">{i + 1}</span>
                    <span className="mk-nm" dir="auto">{st.name}</span>
                    <input className="tin mk-in" inputMode="decimal" value={st.marks?.[curSub.id] ?? ''} onChange={(e) => setMark(st.id, curSub.id, e.target.value)} onKeyDown={onEnter} enterKeyHint="next" aria-label={`${st.name} ${curSub.name}`} />
                    <button type="button" className={'chip ab' + (st.marks?.[curSub.id] === 'Ab' ? ' on' : '')} onClick={() => setMark(st.id, curSub.id, st.marks?.[curSub.id] === 'Ab' ? '' : 'Ab')}>Ab</button>
                  </div>
                ))}
              </div>
              <p className="muted small">Press Next/Enter on the keypad to jump to the next student. Type Ab for absent or Nil for not applicable.</p>
            </>
          ) : (
            <div className="mk-grid-wrap">
              <table className="mk-grid">
                <thead><tr><th>#</th><th>Name</th>{sh.subjects.map((s) => <th key={s.id}>{s.name}</th>)}<th>Total</th>{sh.opts.rank && <th>Rank</th>}</tr></thead>
                <tbody>
                  {sh.students.map((st, i) => (
                    <tr key={st.id}>
                      <td>{i + 1}</td><td className="nm" dir="auto">{st.name}</td>
                      {sh.subjects.map((s) => <td key={s.id}><input className="tin mk-in" inputMode="decimal" value={st.marks?.[s.id] ?? ''} onChange={(e) => setMark(st.id, s.id, e.target.value)} onKeyDown={onEnter} /></td>)}
                      <td className="b">{totals[i] ?? ''}</td>{sh.opts.rank && <td className="b">{ranks[i]}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );

  const setupPane = (
    <div className="edit-pane panel">
      <Row label="Sheet title" stack><TextInput value={sh.title} onChange={(v) => up((d) => { d.title = v; })} big /></Row>
      <div className="two">
        <Row label="Label" stack><TextInput value={sh.gradeLabel} onChange={(v) => up((d) => { d.gradeLabel = v; })} /></Row>
        <Row label="Grade / class" stack><TextInput value={sh.grade} onChange={(v) => up((d) => { d.grade = v; })} placeholder="VB" /></Row>
      </div>
      <h3 className="mini-h">Subjects</h3>
      <div className="subj-ed">
        {sh.subjects.map((s, i) => (
          <div key={s.id} className="opt-ed">
            <TextInput value={s.name} onChange={(v) => up((d) => { d.subjects[i].name = v; })} placeholder="Subject" />
            <NumInput value={s.max} onChange={(v) => up((d) => { d.subjects[i].max = v; })} placeholder="Max" className="max-in" />
            <IconBtn n="up" label="Move left" className="sm" onClick={() => up((d) => { if (i) [d.subjects[i - 1], d.subjects[i]] = [d.subjects[i], d.subjects[i - 1]]; })} />
            <IconBtn n="x" label="Remove subject" className="sm" onClick={() => setDel({ kind: 'subject', i, name: s.name })} />
          </div>
        ))}
        <button type="button" className="add-line" onClick={() => up((d) => { d.subjects.push(sub('')); })}><Icon n="plus" size={18} /> Add subject</button>
      </div>
      <h3 className="mini-h">Students ({sh.students.length})</h3>
      <Row label="Add students" hint="one name per line, paste from WhatsApp or Excel" stack>
        <TextArea value={paste} onChange={setPaste} minRows={3} placeholder={'Ahmed Rishad\nAnwer Yaseen'} />
      </Row>
      <div className="ed-tools"><Btn kind="primary" icon="plus" onClick={addStudents} disabled={!paste.trim()}>Add to list</Btn><Btn kind="ghost" icon="list" onClick={() => up((d) => { d.students.sort((a, b) => a.name.localeCompare(b.name)); })}>Sort A–Z</Btn></div>
      <div className="stu-ed">
        {sh.students.map((st, i) => (
          <div key={st.id} className="opt-ed">
            <span className="ino">{i + 1}</span>
            <TextInput value={st.name} onChange={(v) => up((d) => { d.students[i].name = v; })} />
            {sh.opts.adm && <TextInput value={st.adm} onChange={(v) => up((d) => { d.students[i].adm = v; })} placeholder="Adm" className="max-in" />}
            <IconBtn n="up" label="Move up" className="sm" onClick={() => up((d) => { if (i) [d.students[i - 1], d.students[i]] = [d.students[i], d.students[i - 1]]; })} />
            <IconBtn n="x" label="Remove student" className="sm" onClick={() => setDel({ kind: 'student', i, name: st.name })} />
          </div>
        ))}
      </div>
      <h3 className="mini-h">Columns</h3>
      <div className="toggles">
        <Toggle label="Admission number" checked={sh.opts.adm} onChange={(v) => up((d) => { d.opts.adm = v; })} />
        <Toggle label="Total" checked={sh.opts.total !== false} onChange={(v) => up((d) => { d.opts.total = v; })} />
        <Toggle label="Rank" hint="Worked out from the total" checked={sh.opts.rank} onChange={(v) => up((d) => { d.opts.rank = v; })} />
        <Toggle label="Parent’s signature" checked={sh.opts.sign} onChange={(v) => up((d) => { d.opts.sign = v; })} />
      </div>
      <Row label="Text size"><Stepper value={sh.size || 13} min={9} max={18} onChange={(v) => up((d) => { d.size = v; })} suffix="px" /></Row>
      <Row label="Bottom left" stack><TextInput value={sh.footL} onChange={(v) => up((d) => { d.footL = v; })} /></Row>
      <Row label="Bottom right" stack><TextInput value={sh.footR} onChange={(v) => up((d) => { d.footR = v; })} /></Row>
    </div>
  );

  const preview = (
    <div className="preview">
      <div className="pv-bar"><span className="pv-pages">{sh.students.length} students</span><Btn kind="primary" icon="download" onClick={() => setExportOpen(true)}>Download</Btn></div>
      <div className="pv-scroll"><ScaledPages gap={18}><SheetPages sh={deferred} /></ScaledPages></div>
    </div>
  );

  const pane = tab === 'marks' ? marksPane : setupPane;
  return (
    <div className={'editor' + (wide ? ' wide' : '')}>
      <header className="ebar">
        <IconBtn n="back" label="Back" onClick={onBack} />
        <button type="button" className="doc-name" onClick={() => setTab('setup')}><span dir="auto">{sh.name}</span><small>Mark sheet</small></button>
        {!wide && tab !== 'preview' && <Btn kind="primary" icon="download" onClick={() => setExportOpen(true)}>Download</Btn>}
      </header>
      {wide ? (
        <div className="split">
          <div className="split-l">
            <div className="seg tabs">
              <button type="button" className={tab === 'marks' ? 'on' : ''} onClick={() => setTab('marks')}>Marks</button>
              <button type="button" className={tab === 'setup' ? 'on' : ''} onClick={() => setTab('setup')}>Students &amp; subjects</button>
            </div>
            {pane}
          </div>
          <div className="split-r">{preview}</div>
        </div>
      ) : (
        <main className="emain">{tab === 'preview' ? preview : pane}</main>
      )}
      {!wide && (
        <nav className="tabbar">
          {[['marks', 'edit', 'Marks'], ['setup', 'list', 'Students'], ['preview', 'eye', 'Preview']].map(([k, ic, l]) => (
            <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={ic} size={22} /><span>{l}</span></button>
          ))}
        </nav>
      )}
      <Sheet open={exportOpen} onClose={() => setExportOpen(false)} title="Download or share">
        <div className="exp-grid">
          <button type="button" className="exp" onClick={() => { setExportOpen(false); run('pdf'); }}><Icon n="download" size={22} /><b>PDF</b><small>Save to phone</small></button>
          {navigator.share && <button type="button" className="exp" onClick={() => { setExportOpen(false); run('pdf', true); }}><Icon n="share" size={22} /><b>Share PDF</b><small>WhatsApp, Gmail…</small></button>}
          <button type="button" className="exp" onClick={() => { setExportOpen(false); run('print'); }}><Icon n="print" size={22} /><b>Print</b><small>Sharpest PDF too</small></button>
          <button type="button" className="exp" onClick={() => { setExportOpen(false); csv(); }}><Icon n="sheet" size={22} /><b>Excel (CSV)</b><small>Opens in Excel</small></button>
        </div>
      </Sheet>
      <Confirm open={!!del} onClose={() => setDel(null)} title={del?.kind === 'subject' ? 'Remove this subject?' : 'Remove this student?'} body={`${del?.name || ''} and their marks will be removed.`} okLabel="Remove"
        onOk={() => up((d) => { if (del.kind === 'subject') d.subjects.splice(del.i, 1); else d.students.splice(del.i, 1); })} />
      {job && <ExportStage job={job} onDone={() => setJob(null)} renderPages={(onPages) => <SheetPages sh={sh} onPages={onPages} />} />}
    </div>
  );
}
