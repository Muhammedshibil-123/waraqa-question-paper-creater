/* Tracks the last focused text field so the on-screen keyboard and the
   "blank" buttons can type into it. */
let lastField = null;
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if ((t.tagName === 'INPUT' && (t.type === 'text' || t.type === 'search' || !t.getAttribute('type'))) || t.tagName === 'TEXTAREA') lastField = t;
  });
}
export const getLastField = () => (lastField && document.contains(lastField) ? lastField : null);

function setNativeValue(el, v) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
export function insertText(el, text) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  setNativeValue(el, el.value.slice(0, start) + text + el.value.slice(end));
  const pos = start + text.length;
  requestAnimationFrame(() => { try { el.setSelectionRange(pos, pos); } catch { /* */ } });
}
export function backspace(el) {
  let start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  if (start === end && start > 0) start -= 1;
  setNativeValue(el, el.value.slice(0, start) + el.value.slice(end));
  requestAnimationFrame(() => { try { el.setSelectionRange(start, start); } catch { /* */ } });
}
export function insertIntoFocused(text) {
  const el = getLastField();
  if (!el) return false;
  if (document.activeElement !== el) el.focus({ preventScroll: true });
  insertText(el, text);
  return true;
}
