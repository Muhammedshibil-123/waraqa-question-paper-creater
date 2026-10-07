import React, { useState } from 'react';
import { MODELS, MODEL, newSection, isPlain } from '../lib/models';
import { TypeEditor } from './TypeEditors';
import { TextInput, Stepper, Btn, IconBtn, Icon, Sheet, Row, Confirm, useToast } from '../ui/kit';
import { detectDir, sectionLabel, fmtMarks, uid, clone } from '../lib/utils';
import { db } from '../lib/db';

function SectionCard({ s, label, open, onToggle, set, onMove, onDup, onDel, onBank, isFirst, isLast, settings }) {
  const m = MODEL[s.type];
  const dir = detectDir(s.title, settings.dir);
  const count = s.items ? s.items.length : null;
  const [confirm, setConfirm] = useState(false);
  const plain = isPlain(s.type);
  return (
    <div className={'sec' + (open ? ' open' : '') + (s.hidden ? ' hidden' : '') + (plain ? ' brk' : '')} id={'sec-' + s.id}>
      <button type="button" className="sec-h" onClick={onToggle} aria-expanded={open}>
        <span className="sec-lbl">{label || (s.type === 'text' ? '¶' : s.type === 'pagebreak' ? '⤓' : s.type === 'linebreak' ? '↵' : '•')}</span>
        <span className="sec-tt">
          <small>{m.name}{count !== null ? `, ${count} ${count === 1 ? 'line' : 'lines'}` : ''}{s.hidden ? ', hidden' : ''}</small>
          <span className="sec-title" dir={dir}>{s.title || s.body || (s.type === 'pagebreak' ? 'New page starts here' : s.type === 'linebreak' ? `Empty space, ${s.lines ?? 1} ${(s.lines ?? 1) === 1 ? 'line' : 'lines'}` : 'Untitled')}</span>
        </span>
        {s.marks !== '' && s.marks !== undefined && !plain && <span className="sec-mk">{fmtMarks(s.marks)}</span>}
        <Icon n={open ? 'chevU' : 'chevD'} size={18} className="sec-chev" />
      </button>
      {open && (
        <div className="sec-b">
          {!plain && (
            <>
              <Row label="Question title" stack>
                <TextInput value={s.title} onChange={(v) => set({ title: v })} placeholder={m.ar} big />
              </Row>
              {m.presets.length > 0 && (
                <div className="presets" aria-label="Common titles">
                  {m.presets.map((p) => (
                    <button type="button" key={p.label} className={'chip' + (s.title === p.title ? ' on' : '')} dir="auto" onClick={() => set({ title: p.title, ...(p.patch && !p.patch.items ? clone(p.patch) : {}) })}>{p.label}</button>
                  ))}
                </div>
              )}
              <Row label="Marks"><Stepper value={s.marks} step={0.5} min={0} max={200} onChange={(v) => set({ marks: v })} /></Row>
            </>
          )}
          <div className="type-ed"><TypeEditor s={s} set={set} /></div>
          <div className="sec-acts">
            <IconBtn n="up" label="Move up" onClick={() => onMove(-1)} disabled={isFirst} />
            <IconBtn n="down" label="Move down" onClick={() => onMove(1)} disabled={isLast} />
            <IconBtn n="copy" label="Duplicate" onClick={onDup} />
            {!plain && <IconBtn n={s.hidden ? 'eye' : 'eyeOff'} label={s.hidden ? 'Show on paper' : 'Hide from paper'} onClick={() => set({ hidden: !s.hidden })} />}
            {!plain && <IconBtn n="bank" label="Save to question bank" onClick={onBank} />}
            <span className="grow" />
            <Btn icon="trash" kind="danger-ghost" onClick={() => setConfirm(true)}>Delete</Btn>
          </div>
        </div>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} title="Delete this question?" body="You can bring it back with Undo." onOk={onDel} />
    </div>
  );
}

export function SectionList({ doc, update, openId, setOpenId, onAdd }) {
  const toast = useToast();
  const s = doc.settings;
  const secs = doc.sections;
  let n = 0;
  const labels = secs.map((x) => (x.hidden || x.type === 'text' || isPlain(x.type) ? '' : sectionLabel(n++, s.secNum === 'none' ? 'number' : s.secNum, detectDir(x.title, s.dir))));

  const setSec = (id, patch) => update((d) => { d.sections = d.sections.map((x) => (x.id === id ? { ...x, ...patch } : x)); }, 'sec:' + id + ':' + Object.keys(patch).join());
  const move = (i, dlt) => update((d) => {
    const j = i + dlt; if (j < 0 || j >= d.sections.length) return;
    [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]];
  });
  const dup = (i) => {
    const id = uid();
    update((d) => {
      const c = clone(d.sections[i]); c.id = id; if (c.items) c.items = c.items.map((x) => ({ ...x, id: uid() }));
      d.sections.splice(i + 1, 0, c);
    });
    setOpenId(id);
  };
  const del = (i) => {
    update((d) => { d.sections.splice(i, 1); });
    toast('Question deleted', { label: 'Undo', fn: () => window.dispatchEvent(new Event('waraqa-undo')) });
  };
  const bank = async (sec) => {
    await db.put('bank', { ...clone(sec), id: uid(), savedAt: Date.now(), from: doc.name });
    toast('Saved to your question bank');
  };

  return (
    <div className="secs">
      {secs.map((x, i) => (
        <React.Fragment key={x.id}>
          <SectionCard
            s={x} label={labels[i]} settings={s}
            open={openId === x.id}
            onToggle={() => setOpenId(openId === x.id ? null : x.id)}
            set={(p) => setSec(x.id, p)}
            onMove={(d) => move(i, d)}
            onDup={() => dup(i)}
            onDel={() => del(i)}
            onBank={() => bank(x)}
            isFirst={i === 0} isLast={i === secs.length - 1}
          />
          {openId === x.id && <button type="button" className="ins-here" onClick={() => onAdd(i + 1)}><Icon n="plus" size={16} /> Add a question below</button>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function AddSheet({ open, onClose, onPick }) {
  const [tab, setTab] = useState('types');
  const [picked, setPicked] = useState(null);
  const [bank, setBank] = useState(null);
  const [q, setQ] = useState('');
  const close = () => { setPicked(null); onClose(); };
  const loadBank = async () => { setTab('bank'); setBank((await db.all('bank')).sort((a, b) => b.savedAt - a.savedAt)); };
  const m = picked && MODEL[picked];
  const filtered = bank?.filter((b) => !q || (b.title + ' ' + (b.from || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <Sheet open={open} onClose={close} title={m ? m.name : 'Add a question'} wide>
      {!m && (
        <div className="seg tabs">
          <button type="button" className={tab === 'types' ? 'on' : ''} onClick={() => setTab('types')}>Question types</button>
          <button type="button" className={tab === 'bank' ? 'on' : ''} onClick={loadBank}>My question bank</button>
        </div>
      )}
      {!m && tab === 'types' && (
        <div className="models">
          {MODELS.map((x) => (
            <button type="button" key={x.type} className="model" onClick={() => (x.presets.length ? setPicked(x.type) : (onPick(newSection(x.type)), close()))}>
              <span className="model-n">{x.name}</span>
              <span className="model-ar" dir="rtl">{x.ar}</span>
              <span className="model-s" dir="auto">{x.sample}</span>
            </button>
          ))}
        </div>
      )}
      {!m && tab === 'bank' && (
        <div className="bank-pick">
          <TextInput value={q} onChange={setQ} placeholder="Search saved questions" />
          {!filtered ? <p className="muted">Loading…</p> : filtered.length === 0 ? (
            <p className="muted">Nothing saved yet. Open any question and tap the bank icon to keep it for later papers.</p>
          ) : filtered.map((b) => (
            <button type="button" key={b.id} className="bank-i" onClick={() => { const c = clone(b); c.id = uid(); delete c.savedAt; delete c.from; if (c.items) c.items = c.items.map((x) => ({ ...x, id: uid() })); onPick(c); close(); }}>
              <span className="model-n" dir="auto">{b.title || MODEL[b.type]?.name}</span>
              <small>{MODEL[b.type]?.name}{b.items ? `, ${b.items.length} lines` : ''}{b.from ? `, from ${b.from}` : ''}</small>
            </button>
          ))}
        </div>
      )}
      {m && (
        <div className="preset-pick">
          <p className="muted">{m.help}</p>
          <h3 className="mini-h">Pick a title</h3>
          {m.presets.map((p) => (
            <button type="button" key={p.label} className="preset" dir="auto" onClick={() => { onPick(newSection(m.type, p)); close(); }}>{p.label}</button>
          ))}
          <div className="sheet-row">
            <Btn icon="back" onClick={() => setPicked(null)}>All types</Btn>
            <Btn kind="primary" onClick={() => { onPick(newSection(m.type)); close(); }}>Start empty</Btn>
          </div>
        </div>
      )}
    </Sheet>
  );
}
