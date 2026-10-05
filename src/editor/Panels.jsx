import React, { useState } from 'react';
import { TextInput, Seg, Toggle, Row, Stepper, Btn, Icon, NumInput } from '../ui/kit';
import { loadImage } from '../lib/utils';

export const AR_FONTS = [
  ['Noto Naskh Arabic', 'Naskh', 'Clear, like a textbook'],
  ['Amiri', 'Amiri', 'Classic book style'],
  ['Scheherazade New', 'Scheherazade', 'Large, clear harakat'],
  ['Cairo', 'Cairo', 'Modern and simple'],
];
export const LA_FONTS = [['Tinos', 'Times style'], ['Arimo', 'Arial style']];

const TITLES = ['PERIODIC TEST I', 'PERIODIC TEST II', 'HALF YEARLY EXAMINATION', 'ANNUAL EXAMINATION', 'UNIT TEST', 'MODEL EXAMINATION', 'CLASS TEST'];

export function HeaderPanel({ h, setH, s, setS }) {
  const [busy, setBusy] = useState(false);
  const f = h.fields || {};
  const setF = (k, v) => setH({ fields: { ...f, [k]: v } });
  const pickLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { setH({ logo: await loadImage(file, 400) }); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <div className="panel">
      <Row label="Header layout" stack>
        <Seg value={h.style} onChange={(v) => setH({ style: v })} options={[['classic', 'Half yearly'], ['periodic', 'Periodic'], ['annual', 'Annual'], ['boxed', 'Boxed']]} />
      </Row>
      <Row label="Exam title" stack>
        <TextInput value={h.examTitle} onChange={(v) => setH({ examTitle: v })} big />
      </Row>
      <div className="presets">
        {TITLES.map((t) => <button type="button" key={t} className="chip" onClick={() => { const yr = (h.examTitle.match(/\(?\d{4}\s*[-–]\s*\d{2,4}\)?/) || [''])[0]; setH({ examTitle: (t + ' ' + yr).trim() }); }}>{t.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}</button>)}
      </div>
      <div className="two">
        <Row label="Subject" stack><TextInput value={h.subject} onChange={(v) => setH({ subject: v })} /></Row>
        <Row label="School" stack><TextInput value={h.school} onChange={(v) => setH({ school: v })} placeholder="optional" /></Row>
      </div>
      <div className="three">
        <Row label={<Seg small value={h.classLabel} onChange={(v) => setH({ classLabel: v })} options={[['Class', 'Class'], ['Grade', 'Grade']]} />} stack>
          <TextInput value={h.className} onChange={(v) => setH({ className: v })} placeholder="IV" />
        </Row>
        <Row label="Total marks" stack><NumInput value={h.marks} onChange={(v) => setH({ marks: v })} step={0.5} /></Row>
        <Row label="Time" stack><TextInput value={h.time} onChange={(v) => setH({ time: v })} placeholder="1 hr" /></Row>
      </div>
      {(h.style === 'periodic' || h.style === 'annual') && (
        <div className="two">
          <Row label="Serial No" stack><TextInput value={h.serial} onChange={(v) => setH({ serial: v })} placeholder="NLS 02" /></Row>
          <Row label="Code" stack><TextInput value={h.code} onChange={(v) => setH({ code: v })} placeholder="011" /></Row>
        </div>
      )}
      <div className="logo-row">
        {h.logo ? <img src={h.logo.src} alt="School logo" /> : <span className="logo-ph"><Icon n="image" size={22} /></span>}
        <label className="btn ghost"><Icon n="upload" size={18} /><span>{busy ? 'Loading…' : h.logo ? 'Change logo' : 'School logo'}</span><input type="file" accept="image/*" hidden onChange={pickLogo} /></label>
        {h.logo && <Btn kind="danger-ghost" icon="trash" onClick={() => setH({ logo: null })} />}
      </div>
      <h3 className="mini-h">Lines for students to fill</h3>
      <div className="toggles">
        <Toggle label="Name" checked={f.name} onChange={(v) => setF('name', v)} />
        <Toggle label="Roll No" checked={f.roll} onChange={(v) => setF('roll', v)} />
        <Toggle label="Class & Division" checked={f.classDiv} onChange={(v) => setF('classDiv', v)} />
        <Toggle label="Subject line" checked={f.subjectLine} onChange={(v) => setF('subjectLine', v)} />
        <Toggle label="Date of examination" checked={f.date} onChange={(v) => setF('date', v)} />
        <Toggle label="Marks obtained box" checked={f.obtained} onChange={(v) => setF('obtained', v)} />
      </div>
      <Row label="Fill-in line style" hint="Name, Roll No, Class & Division"><Seg small value={s.fieldLine || 'dots'} onChange={(v) => setS({ fieldLine: v })} options={[['dots', '········'], ['dash', '- - - -'], ['solid', '______']]} /></Row>
      <Row label="Header words in"><Seg small value={s.labels} onChange={(v) => setS({ labels: v })} options={[['en', 'English'], ['ar', 'العربية']]} /></Row>
    </div>
  );
}

export function DesignPanel({ s, setS }) {
  return (
    <div className="panel">
      <h3 className="mini-h">Arabic font</h3>
      <div className="fonts">
        {AR_FONTS.map(([v, n, d]) => (
          <button type="button" key={v} className={'font-c' + (s.arFont === v ? ' on' : '')} onClick={() => setS({ arFont: v })}>
            <span className="fc-s" style={{ fontFamily: `"${v}"` }} dir="rtl">بِسْمِ اللهِ الرَّحْمَٰنِ</span>
            <span className="fc-n">{n}</span>
            <small>{d}</small>
          </button>
        ))}
      </div>
      <Row label="English font"><Seg small value={s.laFont} onChange={(v) => setS({ laFont: v })} options={LA_FONTS} /></Row>
      <Row label="Text size"><Stepper value={s.size} min={11} max={26} onChange={(v) => setS({ size: v })} suffix="px" /></Row>
      <Row label="Question title size"><Stepper value={s.headSize || s.size + 1} min={11} max={30} onChange={(v) => setS({ headSize: v })} suffix="px" /></Row>
      <Row label="Line spacing"><Stepper value={s.lineHeight} step={0.1} min={1.2} max={3} onChange={(v) => setS({ lineHeight: v })} /></Row>
      <Row label="Space between questions"><Stepper value={s.gap} step={2} min={0} max={60} onChange={(v) => setS({ gap: v })} suffix="px" /></Row>
      <Row label="Space between lines"><Stepper value={s.itemGap ?? 3} step={1} min={0} max={30} onChange={(v) => setS({ itemGap: v })} suffix="px" /></Row>
      <Row label="Page margin"><Stepper value={s.margin} step={1} min={6} max={30} onChange={(v) => setS({ margin: v })} suffix="mm" /></Row>

      <h3 className="mini-h">Numbering</h3>
      <Row label="Question numbers" stack><Seg small value={s.secNum} onChange={(v) => setS({ secNum: v })} options={[['roman', 'I II III'], ['number', '1 2 3'], ['ordinal', 'أولاً'], ['letter', 'A B C'], ['none', 'None']]} /></Row>
      <Row label="Line numbers" stack><Seg small value={s.numeral} onChange={(v) => setS({ numeral: v })} options={[['auto', 'Auto'], ['arabic', '١ ٢ ٣'], ['western', '1 2 3']]} /></Row>
      <Toggle label="Continue numbers across questions" hint="1 to 29 through the whole paper" checked={s.continuous} onChange={(v) => setS({ continuous: v })} />

      <h3 className="mini-h">Marks and titles</h3>
      <Row label="Marks look" stack><Seg small value={s.marksFmt} onChange={(v) => setS({ marksFmt: v })} options={[['paren', '(5)'], ['bracket', '[5]'], ['words', '(5 marks)']]} /></Row>
      <Row label="Marks place" stack><Seg small value={s.marksPos} onChange={(v) => setS({ marksPos: v })} options={[['end', 'Line end'], ['inline', 'After title'], ['below', 'Below'], ['above', 'Above'], ['none', 'Hide']]} /></Row>
      <Row label="Title style" stack><Seg small value={s.headStyle} onChange={(v) => setS({ headStyle: v })} options={[['plain', 'Bold'], ['underline', 'Underline'], ['shaded', 'Shaded'], ['boxed', 'Boxed']]} /></Row>
      <Row label="Writing lines"><Seg small value={s.blank} onChange={(v) => setS({ blank: v })} options={[['dots', '·········'], ['line', '_______']]} /></Row>
      <Row label="Paper direction" hint="for titles without letters"><Seg small value={s.dir} onChange={(v) => setS({ dir: v })} options={[['rtl', 'Right to left'], ['ltr', 'Left to right']]} /></Row>

      <h3 className="mini-h">Page</h3>
      <Toggle label="Page border" checked={s.border} onChange={(v) => setS({ border: v })} />
      <Toggle label="Page numbers" checked={s.pageNo} onChange={(v) => setS({ pageNo: v })} />
      <Row label="Footer text" stack><TextInput value={s.footer} onChange={(v) => setS({ footer: v })} placeholder="All the best  /  بالتوفيق" /></Row>
    </div>
  );
}
