import React, { useEffect, useRef, useState } from 'react';
import { useKbd, Icon } from './kit';

import { getLastField, insertText as insert, backspace } from './insert';

const HARAKAT = [['َ', 'فتحة'], ['ُ', 'ضمة'], ['ِ', 'كسرة'], ['ْ', 'سكون'], ['ّ', 'شدة'], ['ً', 'تنوين فتح'], ['ٌ', 'تنوين ضم'], ['ٍ', 'تنوين كسر'], ['ٰ', 'ألف خنجرية']];
const L1 = 'ض ص ث ق ف غ ع ه خ ح ج'.split(' ');
const L2 = 'ش س ي ب ل ا ت ن م ك ط'.split(' ');
const L3 = 'ذ ء ؤ ر ى ة و ز ظ د'.split(' ');
const L4 = 'أ إ آ ئ ـ'.split(' ');
const D_AR = '١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ٠'.split(' ');
const D_EN = '1 2 3 4 5 6 7 8 9 0'.split(' ');
const SYM = '؟ ! : ؛ ( ) / - « » "'.split(' ');

export default function ArabicKeyboard() {
  const { open, setOpen } = useKbd();
  const [page, setPage] = useState('ar');
  const [hint, setHint] = useState('');
  const hintT = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('kbd-open', open);
    const f = getLastField();
    if (open && f) {
      // re-focus so inputMode=none takes over and the phone keyboard closes
      f.blur(); setTimeout(() => f.focus({ preventScroll: true }), 30);
    }
  }, [open]);

  if (!open) return null;

  const press = (fn) => (e) => {
    e.preventDefault();
    const el = getLastField();
    if (!el) {
      setHint('Tap a text box first');
      clearTimeout(hintT.current);
      hintT.current = setTimeout(() => setHint(''), 1600);
      return;
    }
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    fn(el);
    if (navigator.vibrate) try { navigator.vibrate(6); } catch { /* */ }
  };
  const K = ({ ch, label, cls = '', title }) => (
    <button type="button" className={'kk ' + cls} title={title} onPointerDown={press((el) => insert(el, ch))}>{label ?? ch}</button>
  );

  return (
    <div className="akbd" dir="ltr" onPointerDown={(e) => e.preventDefault()}>
      {hint && <div className="kbd-hint">{hint}</div>}
      {page === 'ar' ? (
        <>
          <div className="kr hk">{HARAKAT.map(([c, t]) => <K key={c} ch={c} label={'\u25CC' + c} title={t} cls="hk" />)}</div>
          <div className="kr">{L1.map((c) => <K key={c} ch={c} />)}</div>
          <div className="kr">{L2.map((c) => <K key={c} ch={c} />)}</div>
          <div className="kr">{L3.map((c) => <K key={c} ch={c} />)}<button type="button" className="kk fn" onPointerDown={press(backspace)} aria-label="Delete"><Icon n="back" size={18} /></button></div>
          <div className="kr">{L4.map((c) => <K key={c} ch={c} />)}<K ch="لا" /><K ch="،" /><K ch="؟" /><K ch=" ………… " label="……" cls="fn wide" title="Blank" /></div>
        </>
      ) : (
        <>
          <div className="kr">{D_AR.map((c) => <K key={c} ch={c} />)}</div>
          <div className="kr">{D_EN.map((c) => <K key={c} ch={c} />)}</div>
          <div className="kr">{SYM.map((c) => <K key={c} ch={c} />)}</div>
          <div className="kr"><K ch=" (ج) " label="(ج)" cls="fn" /><K ch="✓" /><K ch="✗" /><K ch="ﷺ" /><K ch=" ____ " label="____" cls="fn wide" title="Blank" /><K ch="." /><K ch="," /><button type="button" className="kk fn" onPointerDown={press(backspace)} aria-label="Delete"><Icon n="back" size={18} /></button></div>
        </>
      )}
      <div className="kr bottom">
        <button type="button" className="kk fn" onPointerDown={(e) => { e.preventDefault(); setPage(page === 'ar' ? 'num' : 'ar'); }}>{page === 'ar' ? '١٢٣ ؟' : 'أ ب ت'}</button>
        <K ch=" " label="مسافة" cls="space" />
        <button type="button" className="kk fn" onPointerDown={press((el) => (el.tagName === 'TEXTAREA' ? insert(el, '\n') : el.blur()))} aria-label="New line">↵</button>
        <button type="button" className="kk fn close" onPointerDown={(e) => { e.preventDefault(); setOpen(false); }} aria-label="Close keyboard"><Icon n="chevD" size={20} /></button>
      </div>
    </div>
  );
}
