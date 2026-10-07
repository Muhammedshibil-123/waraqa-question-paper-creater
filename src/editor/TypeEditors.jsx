import React, { useState } from 'react';
import { TextInput, TextArea, Seg, Toggle, Row, Stepper, Btn, IconBtn, Icon, Sheet } from '../ui/kit';
import { insertIntoFocused } from '../ui/insert';
import { emptyItemFor, parseBulk, BULK_HINT } from '../lib/models';
import { uid, shuffleWords, loadImage } from '../lib/utils';

/* ---------- generic list of items ---------- */
export function ItemList({ items, onChange, newItem, render, addLabel = 'Add line', numbered = true }) {
  const [menu, setMenu] = useState(null);
  const upd = (i, patch) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const a = items.slice();
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
    setMenu(a[j].id);
  };
  return (
    <div className="ilist">
      {items.map((x, i) => (
        <div key={x.id} className={'irow' + (menu === x.id ? ' menu-on' : '')}>
          <div className="irow-main">
            {numbered && <span className="ino">{i + 1}</span>}
            <div className="irow-f">{render(x, (p) => upd(i, p), i)}</div>
            <IconBtn n="more" label="Line options" className="sm" onClick={() => setMenu(menu === x.id ? null : x.id)} />
          </div>
          {menu === x.id && (
            <div className="irow-acts">
              <Btn icon="up" onClick={() => move(i, -1)} disabled={i === 0}>Up</Btn>
              <Btn icon="down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>Down</Btn>
              <Btn icon="copy" onClick={() => { const a = items.slice(); a.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(x)), id: uid() }); onChange(a); setMenu(null); }}>Copy</Btn>
              <Btn icon="trash" kind="danger-ghost" onClick={() => { onChange(items.filter((_, k) => k !== i)); setMenu(null); }}>Delete</Btn>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="add-line" onClick={() => onChange([...items, newItem()])}><Icon n="plus" size={18} />{addLabel}</button>
    </div>
  );
}

export function BlankKey({ label = 'Blank' }) {
  return (
    <button type="button" className="chip blank-key" onPointerDown={(e) => { e.preventDefault(); insertIntoFocused(' ____ '); }} title="Insert a blank where the cursor is">
      ____ {label}
    </button>
  );
}

function BulkSheet({ open, onClose, type, onAdd }) {
  const [txt, setTxt] = useState('');
  const parsed = txt.trim() ? parseBulk(type, txt) : [];
  return (
    <Sheet open={open} onClose={onClose} title="Paste many lines" footer={
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="primary" disabled={!parsed.length} onClick={() => { onAdd(parsed, false); setTxt(''); onClose(); }}>Add {parsed.length || ''} lines</Btn>
      </>
    }>
      <p className="muted pre">{BULK_HINT[type]}</p>
      <TextArea value={txt} onChange={setTxt} minRows={7} placeholder="Type or paste here…" className="bulk" />
      <p className="muted small">Tip: copy your old questions from Word or WhatsApp and paste them here.</p>
    </Sheet>
  );
}

const ColsSeg = ({ s, set, max = 3 }) => (
  <Row label="Columns"><Seg small value={s.columns || 1} onChange={(v) => set({ columns: v })} options={[1, 2, 3, 4].slice(0, max).map((n) => [n, String(n)])} /></Row>
);
const LinesStep = ({ s, set, label = 'Writing lines' }) => (
  <Row label={label} hint="per answer"><Stepper value={s.lines ?? 1} min={0} max={20} onChange={(v) => set({ lines: v })} /></Row>
);
const WordBoxField = ({ s, set, label = 'Word box', hint = 'Separate words with /' }) => (
  <Row label={label} hint={hint} stack><TextInput value={s.wordBox} onChange={(v) => set({ wordBox: v })} placeholder="قبل / بعد / بسم الله" /></Row>
);

/* ---------- options for "choose" ---------- */
function OptionChips({ item, upd, shared }) {
  const opts = shared ? shared.split(/\s*\/\s*/).filter(Boolean) : item.options || [];
  if (shared) {
    return (
      <div className="opt-chips">
        <span className="muted small">Answer:</span>
        {opts.map((o) => <button type="button" key={o} className={'chip' + (item.answer === o ? ' on' : '')} onClick={() => upd({ answer: item.answer === o ? '' : o })}>{o}</button>)}
      </div>
    );
  }
  const setOpt = (k, v) => { const a = opts.slice(); a[k] = v; upd({ options: a, answer: item.answer === opts[k] ? v : item.answer }); };
  return (
    <div className="opts-ed">
      {opts.map((o, k) => (
        <div key={k} className="opt-ed">
          <button type="button" className={'tick' + (o && item.answer === o ? ' on' : '')} onClick={() => upd({ answer: item.answer === o ? '' : o })} aria-label="Mark as correct answer"><Icon n="check" size={14} /></button>
          <TextInput value={o} onChange={(v) => setOpt(k, v)} placeholder={`Option ${k + 1}`} />
          {opts.length > 1 && <IconBtn n="x" label="Remove option" className="sm" onClick={() => upd({ options: opts.filter((_, j) => j !== k) })} />}
        </div>
      ))}
      {opts.length < 6 && <button type="button" className="chip add" onClick={() => upd({ options: [...opts, ''] })}><Icon n="plus" size={14} /> option</button>}
    </div>
  );
}

const Ans = ({ item, upd, placeholder = 'Answer (for the answer key)' }) => (
  <TextInput className="ans-in" value={item.answer} onChange={(v) => upd({ answer: v })} placeholder={placeholder} />
);

/* ---------- per-type body editors ---------- */
export function TypeEditor({ s, set }) {
  const [bulk, setBulk] = useState(false);
  const items = s.items || [];
  const setItems = (v) => set({ items: v });
  const newItem = () => emptyItemFor(s.type);
  const bulkBtn = BULK_HINT[s.type] ? <Btn icon="list" kind="ghost" onClick={() => setBulk(true)}>Paste many</Btn> : null;
  const bulkSheet = <BulkSheet open={bulk} onClose={() => setBulk(false)} type={s.type} onAdd={(list) => setItems([...items.filter((x) => Object.entries(x).some(([k, v]) => k !== 'id' && k !== 'answer' && (Array.isArray(v) ? v.some(Boolean) : v && v !== true))), ...list])} />;

  const tools = (extra) => <div className="ed-tools"><BlankKey />{extra}{bulkBtn}</div>;

  switch (s.type) {
    case 'choose':
      return (
        <>
          <Toggle label="Same options for every line" hint="Like ( هو / هي ) printed once" checked={!!s.shared} onChange={(v) => set({ shared: v ? 'هو / هي' : '' })} />
          {s.shared ? <Row label="Shared options" stack><TextInput value={s.shared} onChange={(v) => set({ shared: v })} /></Row> : (
            <Row label="Options shown"><Seg small value={s.optStyle || 'paren'} onChange={(v) => set({ optStyle: v })} options={[['paren', '( a / b )'], ['below', 'a) b) c)']]} /></Row>
          )}
          <ColsSeg s={s} set={set} />
          {tools()}
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <>
              <TextArea value={x.text} onChange={(v) => upd({ text: v })} placeholder="Sentence with ____ for the blank" />
              <OptionChips item={x} upd={upd} shared={s.shared} />
            </>
          )} />
          {bulkSheet}
        </>
      );
    case 'fill':
      return (
        <>
          <WordBoxField s={s} set={set} label="Word box (optional)" />
          {s.wordBox && <Row label="Box style"><Seg small value={s.boxStyle || 'box'} onChange={(v) => set({ boxStyle: v })} options={[['box', 'Framed'], ['plain', 'Plain']]} /></Row>}
          <ColsSeg s={s} set={set} max={2} />
          {tools()}
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <><TextArea value={x.text} onChange={(v) => upd({ text: v })} placeholder="Sentence with ____ blank" /><Ans item={x} upd={upd} placeholder="Answers (use / for more blanks)" /></>
          )} />
          {bulkSheet}
        </>
      );
    case 'words': {
      const conns = [['(ج)', '(ج)'], [':', ':'], ['-', '-'], ['×', '×'], ['', 'none']];
      return (
        <>
          <Row label="Between word and blank"><Seg small value={s.connector ?? ''} onChange={(v) => set({ connector: v })} options={conns} /></Row>
          <Row label="Blank position"><Seg small value={s.blankPos || 'after'} onChange={(v) => set({ blankPos: v })} options={[['after', 'After word'], ['before', 'Before word']]} /></Row>
          <ColsSeg s={s} set={set} max={4} />
          <div className="ed-tools">{bulkBtn}</div>
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <div className="two">
              <TextInput value={x.word} onChange={(v) => upd({ word: v })} placeholder="Word" />
              <TextInput className="ans-in" value={x.answer} onChange={(v) => upd({ answer: v })} placeholder="Answer" />
            </div>
          )} />
          {bulkSheet}
        </>
      );
    }
    case 'short':
    case 'translate':
      return (
        <>
          <LinesStep s={s} set={set} />
          {tools()}
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <><TextArea value={x.text} onChange={(v) => upd({ text: v })} placeholder={s.type === 'translate' ? 'Sentence to translate' : 'Question'} /><Ans item={x} upd={upd} /></>
          )} />
          {bulkSheet}
        </>
      );
    case 'match':
      return (
        <>
          <Toggle label="Shuffle the second column" hint="Answer key keeps the right pairs" checked={s.shuffle !== false} onChange={(v) => set({ shuffle: v })} />
          {s.shuffle !== false && <div className="ed-tools"><Btn icon="shuffle" kind="ghost" onClick={() => set({ seed: Math.floor(Math.random() * 9999) + 1 })}>Shuffle again</Btn></div>}
          <Toggle label="Letters on second column" hint="أ ب ج  or  a b c" checked={s.lettered !== false} onChange={(v) => set({ lettered: v })} />
          <Row label="Column titles" hint="optional" stack>
            <div className="two"><TextInput value={s.headA} onChange={(v) => set({ headA: v })} placeholder="Column A" /><TextInput value={s.headB} onChange={(v) => set({ headB: v })} placeholder="Column B" /></div>
          </Row>
          <div className="ed-tools">{bulkBtn}</div>
          <ItemList items={items} onChange={setItems} newItem={newItem} addLabel="Add pair" render={(x, upd) => (
            <div className="two">
              <TextInput value={x.a} onChange={(v) => upd({ a: v })} placeholder="Column A" />
              <TextInput value={x.b} onChange={(v) => upd({ b: v })} placeholder="Matching B" />
            </div>
          )} />
          {bulkSheet}
        </>
      );
    case 'truefalse':
      return (
        <>
          <div className="ed-tools">{bulkBtn}</div>
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <>
              <TextArea value={x.text} onChange={(v) => upd({ text: v })} placeholder="Statement" />
              <Seg small value={x.answer !== false} onChange={(v) => upd({ answer: v })} options={[[true, '✓ True'], [false, '✗ False']]} />
            </>
          )} />
          {bulkSheet}
        </>
      );
    case 'arrange':
      return (
        <>
          <Row label="Students arrange"><Seg small value={s.mode || 'words'} onChange={(v) => set({ mode: v })} options={[['words', 'Words → sentence'], ['sentences', 'Sentences in order']]} /></Row>
          {s.mode !== 'sentences' && <LinesStep s={s} set={set} />}
          <div className="ed-tools">{bulkBtn}</div>
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <>
              <div className="with-btn">
                <TextArea value={x.text} onChange={(v) => upd({ text: v })} placeholder={s.mode === 'sentences' ? 'Sentence' : 'word / word / word'} />
                {s.mode !== 'sentences' && <IconBtn n="shuffle" label="Shuffle words" onClick={() => upd({ text: shuffleWords(x.text), answer: x.answer || x.text.replace(/\s*\/\s*/g, ' ') })} />}
              </div>
              <TextInput className="ans-in" value={x.answer} onChange={(v) => upd({ answer: v })} placeholder={s.mode === 'sentences' ? 'Correct order number' : 'Correct sentence (answer key)'} />
            </>
          )} />
          {bulkSheet}
        </>
      );
    case 'passage':
      return (
        <>
          <Row label="Passage" stack><TextArea value={s.passage} onChange={(v) => set({ passage: v })} minRows={4} placeholder="Type the paragraph here" /></Row>
          <details className="sub">
            <summary>Rewrite part {s.starter || s.rewriteLines ? '(on)' : '(off)'}</summary>
            <Row label="Starting words" hint="e.g. وصلت فاطمة…" stack><TextInput value={s.starter} onChange={(v) => set({ starter: v })} /></Row>
            <Row label="Rewrite lines"><Stepper value={s.rewriteLines || 0} min={0} max={20} onChange={(v) => set({ rewriteLines: v })} /></Row>
          </details>
          <LinesStep s={s} set={set} label="Lines per question" />
          {tools()}
          <ItemList items={items} onChange={setItems} newItem={newItem} addLabel="Add question" render={(x, upd) => (
            <><TextArea value={x.text} onChange={(v) => upd({ text: v })} placeholder="Question" /><Ans item={x} upd={upd} /></>
          )} />
          {bulkSheet}
        </>
      );
    case 'poem':
      return (
        <>
          <WordBoxField s={s} set={set} label="Words to choose (optional)" />
          {tools()}
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <div className="two">
              <TextInput value={x.r} onChange={(v) => upd({ r: v })} placeholder="First half (empty = blank)" />
              <TextInput value={x.l} onChange={(v) => upd({ l: v })} placeholder="Second half (empty = blank)" />
            </div>
          )} />
          {bulkSheet}
        </>
      );
    case 'dialogue':
      return (
        <>
          {tools()}
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => (
            <div className="two sp">
              <TextInput value={x.speaker} onChange={(v) => upd({ speaker: v })} placeholder="Speaker" />
              <TextInput value={x.text} onChange={(v) => upd({ text: v })} placeholder="Line (empty = blank)" />
            </div>
          )} />
          {bulkSheet}
        </>
      );
    case 'table':
      return <TableEditor s={s} set={set} />;
    case 'picture':
      return <PictureEditor s={s} set={set} />;
    case 'colour':
      return (
        <>
          <Row label="Shape"><Seg small value={s.shape || 'circle'} onChange={(v) => set({ shape: v })} options={[['circle', '◯ Circle'], ['square', '▢ Box']]} /></Row>
          <Row label="Size"><input type="range" min="30" max="200" value={s.size || 60} onChange={(e) => set({ size: +e.target.value })} /></Row>
          <ColsSeg s={s} set={set} max={4} />
          <div className="ed-tools">{bulkBtn}</div>
          <ItemList items={items} onChange={setItems} newItem={newItem} render={(x, upd) => <TextInput value={x.label} onChange={(v) => upd({ label: v })} placeholder="Label (e.g. أحمر)" />} />
          {bulkSheet}
        </>
      );
    case 'text':
      return (
        <>
          <Row label="Text" stack><TextArea value={s.body} onChange={(v) => set({ body: v })} minRows={3} placeholder="Instructions, part title or a story…" /></Row>
          <Row label="Align"><Seg small value={s.align || 'center'} onChange={(v) => set({ align: v })} options={[['start', 'Start'], ['center', 'Centre'], ['end', 'End']]} /></Row>
          <Toggle label="Bold" checked={!!s.bold} onChange={(v) => set({ bold: v })} />
        </>
      );
    case 'pagebreak':
      return <p className="muted">Questions after this start on a new page.</p>;
    case 'linebreak':
      return <Row label="Space" hint="empty lines"><Stepper value={s.lines ?? 1} step={0.5} min={0.5} max={20} onChange={(v) => set({ lines: v })} /></Row>;
    default:
      return null;
  }
}

function TableEditor({ s, set }) {
  const heads = s.heads || [];
  const cells = s.cells || {};
  const [fill, setFill] = useState(Object.keys(cells).length > 0);
  return (
    <>
      <WordBoxField s={s} set={set} label="Words to sort (optional)" />
      <Row label="Column titles" stack>
        <div className="heads-ed">
          {heads.map((h, c) => (
            <div key={c} className="opt-ed">
              <TextInput value={h} onChange={(v) => set({ heads: heads.map((x, k) => (k === c ? v : x)) })} placeholder={`Column ${c + 1}`} />
              {heads.length > 1 && <IconBtn n="x" label="Remove column" className="sm" onClick={() => {
                const nc = {};
                Object.entries(cells).forEach(([k, v]) => { const [r, cc] = k.split('_').map(Number); if (cc < c) nc[k] = v; else if (cc > c) nc[`${r}_${cc - 1}`] = v; });
                set({ heads: heads.filter((_, k) => k !== c), cells: nc });
              }} />}
            </div>
          ))}
          {heads.length < 6 && <button type="button" className="chip add" onClick={() => set({ heads: [...heads, ''] })}><Icon n="plus" size={14} /> column</button>}
        </div>
      </Row>
      <Row label="Empty rows"><Stepper value={s.rows || 0} min={1} max={30} onChange={(v) => set({ rows: v })} /></Row>
      <Toggle label="Fill some cells" hint="e.g. pronouns in the first column" checked={fill} onChange={setFill} />
      {fill && (
        <div className="cells-ed" style={{ gridTemplateColumns: `repeat(${heads.length}, minmax(70px,1fr))` }} dir="auto">
          {Array.from({ length: s.rows || 0 }).flatMap((_, r) => heads.map((_, c) => (
            <TextInput key={`${r}_${c}`} value={cells[`${r}_${c}`] || ''} onChange={(v) => set({ cells: { ...cells, [`${r}_${c}`]: v } })} placeholder="…" />
          )))}
        </div>
      )}
    </>
  );
}

function PictureEditor({ s, set }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { set({ image: await loadImage(f) }); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <>
      <div className="pic-ed">
        {s.image ? <img src={s.image.src} alt="" /> : <div className="pic-ph"><Icon n="image" size={28} /><span>No picture yet</span></div>}
        <div className="pic-acts">
          <label className="btn primary"><Icon n="upload" size={18} /><span>{busy ? 'Loading…' : s.image ? 'Change picture' : 'Add picture'}</span><input type="file" accept="image/*" hidden onChange={pick} /></label>
          {s.image && <Btn icon="trash" kind="danger-ghost" onClick={() => set({ image: null })}>Remove</Btn>}
        </div>
      </div>
      <Row label="Layout"><Seg small value={s.layout || 'side'} onChange={(v) => set({ layout: v })} options={[['side', 'Beside lines'], ['top', 'Above lines']]} /></Row>
      <Row label="Picture width"><input type="range" min="20" max="100" value={s.imgWidth || 45} onChange={(e) => set({ imgWidth: +e.target.value })} /></Row>
      <WordBoxField s={s} set={set} label="Words (optional)" />
      <Row label="Writing lines"><Stepper value={s.lines ?? 4} min={0} max={20} onChange={(v) => set({ lines: v })} /></Row>
    </>
  );
}
