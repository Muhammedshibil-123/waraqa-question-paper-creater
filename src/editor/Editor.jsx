import React, { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { SectionList, AddSheet } from './Sections';
import { HeaderPanel, DesignPanel } from './Panels';
import { PaperPages, ScaledPages } from '../paper/Pager';
import { ExportStage, shareOrDownload } from '../export/stage';
import { Icon, IconBtn, Btn, Sheet, Toggle, useToast, useKbd, Stepper, TextInput } from '../ui/kit';
import { totalMarks, isPlain } from '../lib/models';
import { clone, downloadBlob, safeName, fmtMarks, detectDir, uid } from '../lib/utils';
import { db } from '../lib/db';

function useHistory(initial) {
  const [h, setH] = useState({ past: [], present: initial, future: [], tag: null, t: 0 });
  const update = useCallback((fn, tag) => {
    setH((cur) => {
      const draft = clone(cur.present);
      fn(draft);
      draft.updatedAt = Date.now();
      const now = Date.now();
      const merge = tag && tag === cur.tag && now - cur.t < 900;
      return { past: merge ? cur.past : [...cur.past.slice(-79), cur.present], present: draft, future: [], tag: tag || null, t: now };
    });
  }, []);
  const undo = useCallback(() => setH((c) => (c.past.length ? { past: c.past.slice(0, -1), present: c.past[c.past.length - 1], future: [c.present, ...c.future], tag: null, t: 0 } : c)), []);
  const redo = useCallback(() => setH((c) => (c.future.length ? { past: [...c.past, c.present], present: c.future[0], future: c.future.slice(1), tag: null, t: 0 } : c)), []);
  return { doc: h.present, update, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}

export default function Editor({ initial, onSaved, onBack, onDuplicate }) {
  const { doc, update, undo, redo, canUndo, canRedo } = useHistory(initial);
  const [tab, setTab] = useState('edit');
  const [openId, setOpenId] = useState(null);
  const [headOpen, setHeadOpen] = useState(!initial.sections.length);
  const [adding, setAdding] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [answers, setAnswers] = useState(false);
  const [job, setJob] = useState(null);
  const [progress, setProgress] = useState(null);
  const [pages, setPages] = useState(0);
  const [saved, setSaved] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1000px)').matches);
  const toast = useToast();
  const { open: kbdOpen, setOpen: setKbd } = useKbd();
  const deferred = useDeferredValue(doc);
  const first = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const fn = () => setWide(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // autosave
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved(false);
    const t = setTimeout(async () => { await db.put('docs', doc); onSaved(doc); setSaved(true); }, 450);
    return () => clearTimeout(t);
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onUndo = () => undo();
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('waraqa-undo', onUndo);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('waraqa-undo', onUndo); window.removeEventListener('keydown', onKey); };
  }, [undo, redo]);

  const setH = (p) => update((d) => { Object.assign(d.header, p); }, 'h:' + Object.keys(p).join());
  const setS = (p) => update((d) => { Object.assign(d.settings, p); }, 's:' + Object.keys(p).join());
  const total = totalMarks(doc.sections);
  const target = +doc.header.marks || 0;
  const diff = +(total - target).toFixed(2);

  const addSection = (sec) => {
    update((d) => { const at = adding === 'end' || adding === null ? d.sections.length : adding; d.sections.splice(at, 0, sec); });
    setOpenId(sec.id);
    setTimeout(() => document.getElementById('sec-' + sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const run = (kind, opts = {}) => new Promise((resolve, reject) => {
    setProgress(kind === 'print' ? null : { i: 0, n: pages || 1 });
    setJob({ kind, share: !!opts.share, name: doc.name + (answers ? ' - answer key' : ''), resolve, reject });
  }).then((r) => { if (r === 'downloaded') toast('Saved to your downloads'); }).catch(() => toast('Could not create the file. Try again, or use Print.')).finally(() => setProgress(null));

  const exportDocx = async () => {
    try {
      const { buildDocx } = await import('../export/docx');
      const blob = await buildDocx(doc, { answers });
      const name = safeName(doc.name + (answers ? ' - answer key' : '')) + '.docx';
      const r = await shareOrDownload(blob, name, doc.name);
      if (r === 'downloaded') toast('Word file saved');
    } catch (e) { console.error(e); toast('Word export failed'); }
  };
  const exportJson = async () => {
    const blob = new Blob([JSON.stringify({ app: 'waraqa', version: 1, docs: [doc] })], { type: 'application/json' });
    await shareOrDownload(blob, safeName(doc.name) + '.waraqa.json', doc.name);
  };
  const saveTemplate = async () => {
    const t = { id: uid(), name: doc.name, desc: 'Your own template', header: clone(doc.header), settings: clone(doc.settings), sections: clone(doc.sections), mine: true, savedAt: Date.now() };
    await db.put('mytemplates', t);
    toast('Saved in My templates');
  };

  const preview = (
    <div className="preview">
      <div className="pv-bar">
        <Toggle label="Answer key" checked={answers} onChange={setAnswers} />
        <span className="pv-pages">{pages ? `${pages} ${pages === 1 ? 'page' : 'pages'}` : ''}</span>
        <Btn kind="primary" icon="download" onClick={() => setExportOpen(true)}>Download</Btn>
      </div>
      <div className="pv-scroll">
        <ScaledPages gap={18}>
          <PaperPages doc={deferred} answers={answers} onPages={setPages} />
        </ScaledPages>
      </div>
    </div>
  );

  const editPane = (
    <div className="edit-pane">
      {tab !== 'design' ? (
        <>
          <div className={'card head-card' + (headOpen ? ' open' : '')}>
            <button type="button" className="sec-h" onClick={() => setHeadOpen(!headOpen)} aria-expanded={headOpen}>
              <span className="sec-lbl hd"><Icon n="page" size={18} /></span>
              <span className="sec-tt"><small>Paper details</small><span className="sec-title">{doc.header.examTitle || 'Exam title'}</span></span>
              <Icon n={headOpen ? 'chevU' : 'chevD'} size={18} className="sec-chev" />
            </button>
            {headOpen && <HeaderPanel h={doc.header} setH={setH} s={doc.settings} setS={setS} />}
          </div>
          {doc.sections.length === 0 && (
            <div className="first-q">
              <p>Your paper has no questions yet.</p>
            </div>
          )}
          <SectionList doc={doc} update={update} openId={openId} setOpenId={setOpenId} onAdd={(i) => setAdding(i)} />
          <button type="button" className="add-q" onClick={() => setAdding('end')}><Icon n="plus" size={20} /> Add question</button>
        </>
      ) : (
        <DesignPanel s={doc.settings} setS={setS} />
      )}
    </div>
  );

  return (
    <div className={'editor' + (wide ? ' wide' : '') + ' tab-' + tab}>
      <header className="ebar">
        <IconBtn n="back" label="Back to papers" onClick={onBack} />
        <button type="button" className="doc-name" onClick={() => setRenaming(true)} title="Rename">
          <span dir="auto">{doc.name}</span>
          <small>{saved ? 'Saved' : 'Saving…'}</small>
        </button>
        <button type="button" className={'meter' + (diff === 0 ? ' ok' : diff > 0 ? ' over' : ' under')} onClick={() => setMarksOpen(true)} title="Marks check">
          {fmtMarks(total) || 0}<span>/</span>{fmtMarks(target) || 0}
        </button>
        <IconBtn n="undo" label="Undo" onClick={undo} disabled={!canUndo} />
        <IconBtn n="redo" label="Redo" onClick={redo} disabled={!canRedo} className="hide-xs" />
        <IconBtn n="kbd" label="Arabic keyboard" className={'kbd-tg' + (kbdOpen ? ' on' : '')} onClick={() => setKbd(!kbdOpen)} />
        {!wide && tab !== 'preview' && <Btn kind="primary" icon="download" className="hide-sm" onClick={() => setExportOpen(true)}>Download</Btn>}
      </header>

      {wide ? (
        <div className="split">
          <div className="split-l">
            <div className="seg tabs">
              <button type="button" className={tab !== 'design' ? 'on' : ''} onClick={() => setTab('edit')}><Icon n="edit" size={16} /> Questions</button>
              <button type="button" className={tab === 'design' ? 'on' : ''} onClick={() => setTab('design')}><Icon n="palette" size={16} /> Design</button>
            </div>
            {editPane}
          </div>
          <div className="split-r">{preview}</div>
        </div>
      ) : (
        <main className="emain">{tab === 'preview' ? preview : editPane}</main>
      )}

      {!wide && (
        <nav className="tabbar">
          {[['edit', 'edit', 'Questions'], ['preview', 'eye', 'Preview'], ['design', 'palette', 'Design']].map(([k, ic, l]) => (
            <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={ic} size={22} /><span>{l}</span></button>
          ))}
        </nav>
      )}

      <AddSheet open={adding !== null} onClose={() => setAdding(null)} onPick={addSection} />

      <Sheet open={exportOpen} onClose={() => setExportOpen(false)} title="Download or share">
        <Toggle label="Answer key copy" hint="Fills blanks with the answers in red" checked={answers} onChange={setAnswers} />
        <div className="exp-grid">
          <button type="button" className="exp" onClick={() => { setExportOpen(false); run('pdf'); }}><Icon n="download" size={22} /><b>PDF</b><small>Save to phone</small></button>
          {navigator.share && <button type="button" className="exp" onClick={() => { setExportOpen(false); run('pdf', { share: true }); }}><Icon n="share" size={22} /><b>Share PDF</b><small>WhatsApp, Gmail…</small></button>}
          <button type="button" className="exp" onClick={() => { setExportOpen(false); run('print'); }}><Icon n="print" size={22} /><b>Print</b><small>Sharpest PDF too</small></button>
          <button type="button" className="exp" onClick={() => { setExportOpen(false); exportDocx(); }}><Icon n="doc" size={22} /><b>Word</b><small>Editable .docx</small></button>
          <button type="button" className="exp" onClick={() => { setExportOpen(false); run('png', { share: true }); }}><Icon n="image" size={22} /><b>Images</b><small>One per page</small></button>
          <button type="button" className="exp" onClick={() => { setExportOpen(false); exportJson(); }}><Icon n="file" size={22} /><b>Paper file</b><small>Send to another phone</small></button>
        </div>
        <div className="exp-more">
          <Btn icon="save" kind="ghost" onClick={() => { setExportOpen(false); saveTemplate(); }}>Save as my template</Btn>
          <Btn icon="copy" kind="ghost" onClick={() => { setExportOpen(false); onDuplicate(doc); }}>Make a copy</Btn>
        </div>
      </Sheet>

      <Sheet open={marksOpen} onClose={() => setMarksOpen(false)} title="Marks check">
        <p className={'marks-sum' + (diff === 0 ? ' ok' : '')}>
          {diff === 0 ? `All questions add up to ${fmtMarks(target)}. ` : diff > 0 ? `Questions add up to ${fmtMarks(total)}, that is ${fmtMarks(diff)} more than ${fmtMarks(target)}.` : `Questions add up to ${fmtMarks(total)}, ${fmtMarks(-diff)} less than ${fmtMarks(target)}.`}
        </p>
        <div className="marks-list">
          {doc.sections.filter((x) => !isPlain(x.type) && x.type !== 'text').map((x) => (
            <div key={x.id} className={'marks-row' + (x.hidden ? ' hidden' : '')}>
              <span dir={detectDir(x.title)}>{x.title || 'Untitled'}</span>
              <Stepper value={x.marks} step={0.5} min={0} onChange={(v) => update((d) => { d.sections.find((y) => y.id === x.id).marks = v; }, 'mk:' + x.id)} />
            </div>
          ))}
        </div>
        <div className="marks-row total"><span>Total marks on the paper</span><Stepper value={doc.header.marks} step={1} min={0} onChange={(v) => setH({ marks: v })} /></div>
      </Sheet>

      <Sheet open={renaming} onClose={() => setRenaming(false)} title="Paper name" footer={<Btn kind="primary" onClick={() => setRenaming(false)}>Done</Btn>}>
        <TextInput value={doc.name} onChange={(v) => update((d) => { d.name = v; }, 'name')} big autoFocus />
        <p className="muted small">Only you see this name. It is also used for the PDF file name.</p>
      </Sheet>

      {job && (
        <ExportStage
          job={job}
          onDone={() => setJob(null)}
          onProgress={(i, n) => setProgress({ i, n })}
          renderPages={(onPages) => <PaperPages doc={doc} answers={answers} onPages={onPages} />}
        />
      )}
      {progress && (
        <div className="busy" role="status"><span className="spin" />Making page {progress.i || 1} of {progress.n}…</div>
      )}
    </div>
  );
}

export function useBlobDownload() { return downloadBlob; }
