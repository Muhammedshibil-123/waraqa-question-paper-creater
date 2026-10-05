import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from './editor/Editor';
import SheetEditor, { SHEET_TEMPLATES, makeSheet } from './marksheet/MarkSheet';
import ArabicKeyboard from './ui/ArabicKeyboard';
import { PaperThumb } from './paper/Pager';
import { Icon, IconBtn, Btn, Sheet, Menu, TextInput, Seg, Row, NumInput, Confirm, Empty, useToast, KbdProvider, ToastProvider } from './ui/kit';
import { TEMPLATES, makePaper } from './lib/templates';
import { MODEL } from './lib/models';
import { db, exportAll, importAll, askPersistence, storageInfo } from './lib/db';
import { uid, clone, timeAgo, readFileAsText, loadImage, detectDir } from './lib/utils';
import { shareOrDownload } from './export/stage';

/* ---------------- routing ---------------- */
function useRoute() {
  const parse = () => { const h = location.hash.replace(/^#\/?/, ''); const [view, id] = h.split('/'); return { view: view || 'home', id }; };
  const [r, setR] = useState(parse);
  useEffect(() => { const fn = () => setR(parse()); window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); }, []);
  return r;
}
const go = (path) => { location.hash = path; };

/* ---------------- install prompt ---------------- */
let deferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; window.dispatchEvent(new Event('waraqa-installable')); });
}
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);

function useInstall() {
  const [can, setCan] = useState(!!deferredPrompt);
  useEffect(() => { const fn = () => setCan(true); window.addEventListener('waraqa-installable', fn); return () => window.removeEventListener('waraqa-installable', fn); }, []);
  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; setCan(false);
    return true;
  };
  return { can: can && !isStandalone(), install };
}

/* ---------------- new paper ---------------- */
function NewPaper({ open, onClose, onCreate, profile }) {
  const [step, setStep] = useState(0);
  const [tpl, setTpl] = useState(null);
  const [mine, setMine] = useState([]);
  const [mode, setMode] = useState('sample');
  const [f, setF] = useState({});
  useEffect(() => { if (open) { setStep(0); setTpl(null); db.all('mytemplates').then((t) => setMine(t.sort((a, b) => b.savedAt - a.savedAt))); } }, [open]);
  const samples = useMemo(() => Object.fromEntries(TEMPLATES.map((t) => [t.id, makePaper({ template: t })])), []);
  const choose = (t) => {
    setTpl(t);
    setMode(t.mine ? 'sample' : 'sample');
    setF({ examTitle: t.header.examTitle, subject: t.header.subject, className: t.header.className, marks: t.header.marks, time: t.header.time });
    setStep(1);
  };
  const create = () => {
    const d = makePaper({ template: tpl, mode, profile, overrides: { examTitle: f.examTitle, subject: f.subject, className: f.className, marks: f.marks, time: f.time } });
    if (tpl.mine) { d.settings = clone(tpl.settings); }
    onCreate(d);
  };
  return (
    <Sheet open={open} onClose={onClose} title={step === 0 ? 'Choose a template' : 'About this paper'} wide
      footer={step === 1 ? <><Btn icon="back" onClick={() => setStep(0)}>Templates</Btn><Btn kind="primary" onClick={create}>Create paper</Btn></> : null}>
      {step === 0 && (
        <>
          {mine.length > 0 && <h3 className="mini-h">My templates</h3>}
          {mine.length > 0 && (
            <div className="tpl-grid">
              {mine.map((t) => (
                <button type="button" key={t.id} className="tpl" onClick={() => choose(t)}>
                  <PaperThumb doc={{ ...makePaper({ template: t }), header: t.header }} />
                  <span className="tpl-n" dir="auto">{t.name}</span>
                  <small>Your own template</small>
                </button>
              ))}
            </div>
          )}
          {mine.length > 0 && <h3 className="mini-h">Ready templates</h3>}
          <div className="tpl-grid">
            {TEMPLATES.map((t) => (
              <button type="button" key={t.id} className="tpl" onClick={() => choose(t)}>
                <PaperThumb doc={samples[t.id]} />
                <span className="tpl-n">{t.name}</span>
                <small>{t.desc}</small>
              </button>
            ))}
            <button type="button" className="tpl blank" onClick={() => { setTpl({ ...TEMPLATES[0], id: 'blank' }); setMode('blank'); setF({ examTitle: TEMPLATES[0].header.examTitle, subject: 'ARABIC', className: '', marks: 40, time: '' }); setStep(1); }}>
              <span className="tpl-blank"><Icon n="plus" size={30} /></span>
              <span className="tpl-n">Blank paper</span>
              <small>Start from nothing</small>
            </button>
          </div>
        </>
      )}
      {step === 1 && tpl && (
        <div className="panel">
          <Row label="Exam title" stack><TextInput big value={f.examTitle} onChange={(v) => setF({ ...f, examTitle: v })} /></Row>
          <div className="two">
            <Row label="Subject" stack><TextInput value={f.subject} onChange={(v) => setF({ ...f, subject: v })} /></Row>
            <Row label={tpl.header.classLabel || 'Class'} stack><TextInput value={f.className} onChange={(v) => setF({ ...f, className: v })} placeholder="IV" /></Row>
          </div>
          <div className="two">
            <Row label="Total marks" stack><NumInput value={f.marks} onChange={(v) => setF({ ...f, marks: v })} /></Row>
            <Row label="Time" stack><TextInput value={f.time} onChange={(v) => setF({ ...f, time: v })} placeholder="2 hr" /></Row>
          </div>
          {tpl.id !== 'blank' && (
            <>
              <h3 className="mini-h">Questions</h3>
              <div className="mode-pick">
                {[['sample', 'Keep the sample questions', 'Edit them into your own'], ['structure', 'Same question types, empty', 'Titles and marks stay, questions are cleared'], ['blank', 'No questions', 'Only the header and design']].map(([k, l, d]) => (
                  <button type="button" key={k} className={'mode' + (mode === k ? ' on' : '')} onClick={() => setMode(k)}><span className="radio" /><span><b>{l}</b><small>{d}</small></span></button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

function NewSheet({ open, onClose, onCreate, docs }) {
  const [grade, setGrade] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const sheets = docs.filter((d) => d.kind === 'marksheet' && d.students.length);
  return (
    <Sheet open={open} onClose={onClose} title="New mark sheet" wide>
      <div className="two">
        <Row label="Grade / class" stack><TextInput value={grade} onChange={setGrade} placeholder="VB" /></Row>
        {sheets.length > 0 && (
          <Row label="Copy students from" stack>
            <select className="tin" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
              <option value="">Nobody, I will add them</option>
              {sheets.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.students.length})</option>)}
            </select>
          </Row>
        )}
      </div>
      <div className="sheet-tpls">
        {SHEET_TEMPLATES.map((t) => (
          <button type="button" key={t.id} className="mode" onClick={() => {
            const src = sheets.find((s) => s.id === copyFrom);
            onCreate(makeSheet(t, { grade, students: src ? src.students.map((x) => ({ name: x.name, adm: x.adm })) : [] }));
          }}>
            <Icon n="sheet" size={22} /><span><b>{t.name}</b><small>{t.desc}</small></span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- settings ---------------- */
function SettingsSheet({ open, onClose, profile, setProfile, onRestored, installer }) {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) storageInfo().then(setInfo); }, [open]);
  const backup = async () => {
    const data = await exportAll();
    const r = await shareOrDownload(new Blob([JSON.stringify(data)], { type: 'application/json' }), `waraqa-backup-${new Date().toISOString().slice(0, 10)}.json`, 'Waraqa backup');
    if (r === 'downloaded') toast('Backup saved to downloads');
  };
  const restore = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await readFileAsText(file));
      if (data.docs && !data.bank && data.docs.length === 1) { await db.put('docs', { ...data.docs[0], id: uid(), updatedAt: Date.now() }); onRestored(); toast('Paper added'); return; }
      const n = await importAll(data);
      onRestored(); toast(`${n} items restored`);
    } catch (err) { toast(err.message || 'That file could not be read'); }
  };
  const logo = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setBusy(true); try { setProfile({ ...profile, logo: await loadImage(file, 400) }); } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="panel">
        <h3 className="mini-h">Your school</h3>
        <p className="muted small">Used to fill new papers so you do not type it each time.</p>
        <Row label="School name" stack><TextInput value={profile.school} onChange={(v) => setProfile({ ...profile, school: v })} placeholder="optional" /></Row>
        <Row label="Serial No prefix" stack><TextInput value={profile.serial} onChange={(v) => setProfile({ ...profile, serial: v })} placeholder="NLS 02" /></Row>
        <div className="logo-row">
          {profile.logo ? <img src={profile.logo.src} alt="School logo" /> : <span className="logo-ph"><Icon n="image" size={22} /></span>}
          <label className="btn ghost"><Icon n="upload" size={18} /><span>{busy ? 'Loading…' : profile.logo ? 'Change logo' : 'Add school logo'}</span><input type="file" accept="image/*" hidden onChange={logo} /></label>
          {profile.logo && <Btn kind="danger-ghost" icon="trash" onClick={() => setProfile({ ...profile, logo: null })} />}
        </div>

        <h3 className="mini-h">Keep your work safe</h3>
        <p className="muted small">Papers live only on this phone. Make a backup now and then, and keep it in Google Drive or WhatsApp.</p>
        <div className="ed-tools">
          <Btn kind="primary" icon="save" onClick={backup}>Back up everything</Btn>
          <label className="btn ghost"><Icon n="upload" size={18} /><span>Restore or open a file</span><input type="file" accept=".json,application/json" hidden onChange={restore} /></label>
        </div>
        {info && info.quota > 0 && <p className="muted small">Using {(info.used / 1048576).toFixed(1)} MB of storage.</p>}

        <h3 className="mini-h">App</h3>
        {installer.can ? <Btn kind="ghost" icon="install" onClick={installer.install}>Install on this phone</Btn>
          : isStandalone() ? <p className="muted small">Installed as an app.</p>
          : <p className="muted small">{isIOS ? 'To install: tap Share in Safari, then “Add to Home Screen”.' : 'To install: open the browser menu (⋮) and tap “Install app” or “Add to Home screen”.'}</p>}
      </div>
    </Sheet>
  );
}

/* ---------------- dashboard ---------------- */
function Home({ docs, refresh, onOpen, profile, setProfile }) {
  const [tab, setTab] = useState(() => sessionStorage.getItem('waraqa:tab') || 'papers');
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [del, setDel] = useState(null);
  const [rename, setRename] = useState(null);
  const [settings, setSettings] = useState(false);
  const [bank, setBank] = useState([]);
  const installer = useInstall();
  const toast = useToast();
  useEffect(() => { sessionStorage.setItem('waraqa:tab', tab); if (tab === 'bank') db.all('bank').then((b) => setBank(b.sort((a, c) => c.savedAt - a.savedAt))); }, [tab]);

  const papers = docs.filter((d) => d.kind !== 'marksheet');
  const sheets = docs.filter((d) => d.kind === 'marksheet');
  const classes = [...new Set(papers.map((d) => d.header?.className).filter(Boolean))].sort();
  const list = (tab === 'papers' ? papers : sheets)
    .filter((d) => !q || (d.name + ' ' + (d.header?.examTitle || '') + ' ' + (d.title || '')).toLowerCase().includes(q.toLowerCase()))
    .filter((d) => tab !== 'papers' || !cls || d.header?.className === cls)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const create = async (d) => { await db.put('docs', d); setNewOpen(false); setSheetOpen(false); await refresh(); onOpen(d); };
  const duplicate = async (d) => { const c = clone(d); c.id = uid(); c.name = d.name + ' (copy)'; c.createdAt = c.updatedAt = Date.now(); await db.put('docs', c); await refresh(); toast('Copy made'); };
  const shareFile = async (d) => { await shareOrDownload(new Blob([JSON.stringify({ app: 'waraqa', version: 1, docs: [d] })], { type: 'application/json' }), d.name.replace(/[\\/:*?"<>|]+/g, '') + '.waraqa.json', d.name); };
  const saveTpl = async (d) => { await db.put('mytemplates', { id: uid(), name: d.name, desc: 'Your own template', header: clone(d.header), settings: clone(d.settings), sections: clone(d.sections), mine: true, savedAt: Date.now() }); toast('Saved in My templates'); };

  return (
    <div className="home">
      <header className="hbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>ورقة</span>
          <span className="brand-n">Waraqa<small>Question papers</small></span>
        </div>
        <IconBtn n="gear" label="Settings" onClick={() => setSettings(true)} />
      </header>

      {installer.can && (
        <div className="install-banner">
          <Icon n="install" size={20} />
          <span>Install Waraqa on this phone. It opens like an app and works without internet.</span>
          <Btn kind="primary" onClick={installer.install}>Install</Btn>
        </div>
      )}

      <div className="home-tabs seg tabs">
        <button type="button" className={tab === 'papers' ? 'on' : ''} onClick={() => setTab('papers')}>Papers <small>{papers.length}</small></button>
        <button type="button" className={tab === 'sheets' ? 'on' : ''} onClick={() => setTab('sheets')}>Mark sheets <small>{sheets.length}</small></button>
        <button type="button" className={tab === 'bank' ? 'on' : ''} onClick={() => setTab('bank')}>Question bank</button>
      </div>

      {tab !== 'bank' && (papers.length > 4 || sheets.length > 4 || q) && (
        <div className="search">
          <Icon n="search" size={18} />
          <input className="tin" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'papers' ? 'Search papers' : 'Search mark sheets'} />
        </div>
      )}
      {tab === 'papers' && classes.length > 1 && (
        <div className="cls-chips">
          <button type="button" className={'chip' + (!cls ? ' on' : '')} onClick={() => setCls('')}>All classes</button>
          {classes.map((c) => <button type="button" key={c} className={'chip' + (cls === c ? ' on' : '')} onClick={() => setCls(c)}>Class {c}</button>)}
        </div>
      )}

      {tab === 'bank' ? (
        bank.length === 0 ? (
          <Empty title="Your question bank is empty">Open any question in a paper and tap the bank icon. It will wait here for your next paper.</Empty>
        ) : (
          <div className="bank-list">
            {bank.map((b) => (
              <div key={b.id} className="bank-i">
                <span className="model-n" dir={detectDir(b.title)}>{b.title || MODEL[b.type]?.name}</span>
                <small>{MODEL[b.type]?.name}{b.items ? `, ${b.items.length} lines` : ''}{b.from ? `, from ${b.from}` : ''}</small>
                <IconBtn n="trash" label="Remove" className="sm" onClick={async () => { await db.del('bank', b.id); setBank(bank.filter((x) => x.id !== b.id)); }} />
              </div>
            ))}
          </div>
        )
      ) : list.length === 0 && !q ? (
        tab === 'papers' ? (
          <Empty title="Make your first paper" action={<Btn kind="primary" icon="plus" onClick={() => setNewOpen(true)}>New paper</Btn>}>
            Pick a template, change the questions, and download a ready PDF. Arabic, English and Malayalam all work.
          </Empty>
        ) : (
          <Empty title="No mark sheets yet" action={<Btn kind="primary" icon="plus" onClick={() => setSheetOpen(true)}>New mark sheet</Btn>}>
            Type the marks once and the totals and ranks are worked out for you.
          </Empty>
        )
      ) : (
        <div className="doc-grid">
          {list.map((d) => (
            <div key={d.id} className="doc-card">
              <button type="button" className="doc-open" onClick={() => onOpen(d)}>
                {d.kind === 'marksheet' ? (
                  <span className="sheet-thumb"><Icon n="sheet" size={28} /><b>{d.students.length}</b><small>students</small></span>
                ) : <PaperThumb doc={d} />}
                <span className="doc-n" dir="auto">{d.name}</span>
                <small>{d.kind === 'marksheet' ? `${d.subjects.length} subjects` : `${d.header.marks || 0} marks, ${d.sections.length} questions`}</small>
                <small className="when">{timeAgo(d.updatedAt)}</small>
              </button>
              <IconBtn n="more" label="Options" className="doc-more" onClick={() => setMenu(d)} />
            </div>
          ))}
        </div>
      )}

      {tab !== 'bank' && list.length > 0 && (
        <button type="button" className="fab" onClick={() => (tab === 'papers' ? setNewOpen(true) : setSheetOpen(true))}>
          <Icon n="plus" size={22} /><span>{tab === 'papers' ? 'New paper' : 'New mark sheet'}</span>
        </button>
      )}

      <NewPaper open={newOpen} onClose={() => setNewOpen(false)} onCreate={create} profile={profile} />
      <NewSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onCreate={create} docs={docs} />
      <Menu open={!!menu} onClose={() => setMenu(null)} title={menu?.name} items={menu ? [
        { icon: 'edit', label: 'Rename', onClick: () => setRename({ ...menu }) },
        { icon: 'copy', label: 'Make a copy', hint: 'For the next exam', onClick: () => duplicate(menu) },
        menu.kind !== 'marksheet' && { icon: 'save', label: 'Save as my template', onClick: () => saveTpl(menu) },
        { icon: 'share', label: 'Send this file', hint: 'Opens on another phone', onClick: () => shareFile(menu) },
        { icon: 'trash', label: 'Delete', danger: true, onClick: () => setDel(menu) },
      ] : []} />
      <Confirm open={!!del} onClose={() => setDel(null)} title="Delete for good?" body={`“${del?.name}” will be removed from this phone. This cannot be undone.`} onOk={async () => { await db.del('docs', del.id); refresh(); toast('Deleted'); }} />
      <Sheet open={!!rename} onClose={() => setRename(null)} title="Rename" footer={<Btn kind="primary" onClick={async () => { await db.put('docs', { ...docs.find((x) => x.id === rename.id), name: rename.name, updatedAt: Date.now() }); setRename(null); refresh(); }}>Save</Btn>}>
        {rename && <TextInput big value={rename.name} onChange={(v) => setRename({ ...rename, name: v })} autoFocus />}
      </Sheet>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} profile={profile} setProfile={setProfile} onRestored={refresh} installer={installer} />
    </div>
  );
}

/* ---------------- root ---------------- */
function Root() {
  const route = useRoute();
  const [docs, setDocs] = useState(null);
  const [profile, setProfileState] = useState({ school: '', serial: '', logo: null });
  const toast = useToast();

  const refresh = useCallback(async () => setDocs(await db.all('docs')), []);
  useEffect(() => {
    refresh();
    askPersistence();
    db.get('meta', 'profile').then((p) => p && setProfileState(p.value));
  }, [refresh]);
  const setProfile = (p) => { setProfileState(p); db.put('meta', { id: 'profile', value: p }); };
  const onSaved = useCallback((d) => setDocs((cur) => (cur ? cur.map((x) => (x.id === d.id ? d : x)) : cur)), []);

  if (!docs) return <div className="boot"><span className="brand-mark">ورقة</span></div>;
  const current = route.id && docs.find((d) => d.id === route.id);

  if ((route.view === 'paper' || route.view === 'sheet') && !current) {
    return <div className="boot"><p>This paper is not on this phone.</p><Btn kind="primary" onClick={() => go('/')}>Go to my papers</Btn></div>;
  }
  if (route.view === 'paper' && current) {
    return <Editor key={current.id} initial={current} onSaved={onSaved} onBack={() => { refresh(); go('/'); }}
      onDuplicate={async (d) => { const c = clone(d); c.id = uid(); c.name = d.name + ' (copy)'; c.createdAt = c.updatedAt = Date.now(); await db.put('docs', c); await refresh(); toast('Copy made, now editing the copy'); go('/paper/' + c.id); }} />;
  }
  if (route.view === 'sheet' && current) {
    return <SheetEditor key={current.id} initial={current} onSaved={onSaved} onBack={() => { refresh(); go('/'); }} />;
  }
  return <Home docs={docs} refresh={refresh} profile={profile} setProfile={setProfile} onOpen={(d) => go((d.kind === 'marksheet' ? '/sheet/' : '/paper/') + d.id)} />;
}

export default function App() {
  return (
    <ToastProvider>
      <KbdProvider>
        <Root />
        <ArabicKeyboard />
      </KbdProvider>
    </ToastProvider>
  );
}
