import React, { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { buildChunks, labelsFor } from './render';
import { toArabicDigits } from '../lib/utils';

export const PAGE_W = 794; // A4 @ 96dpi
export const PAGE_H = 1123;
export const MM = 3.7795;

export function paperStyle(s) {
  return {
    '--ar': `"${s.arFont}"`,
    '--la': `"${s.laFont}"`,
    '--ml': `"${s.mlFont || 'Noto Sans Malayalam'}"`,
    '--fs': s.size + 'px',
    '--hs': (s.headSize || s.size + 1) + 'px',
    '--lh': s.lineHeight,
    '--gap': s.gap + 'px',
    '--igap': (s.itemGap ?? 3) + 'px',
  };
}

const footerH = (s) => (s.pageNo || s.footer ? 26 : 0);

/** Splits chunks into pages by measuring them off-screen. Returns page index arrays. */
export function usePagination(chunks, s, sig) {
  const measureRef = useRef(null);
  const [layout, setLayout] = useState(null); // { pages, chunks } always computed together
  const [fontTick, setFontTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const bump = () => alive && setFontTick((t) => t + 1);
    if (document.fonts) {
      document.fonts.ready.then(bump);
      document.fonts.addEventListener?.('loadingdone', bump);
    }
    return () => { alive = false; document.fonts?.removeEventListener?.('loadingdone', bump); };
  }, []);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const nodes = Array.from(root.children);
    const heights = nodes.map((n) => n.getBoundingClientRect().height);
    const avail = PAGE_H - 2 * s.margin * MM - footerH(s) - (s.border ? 8 : 0);
    const out = [[]];
    let h = 0;
    chunks.forEach((c, i) => {
      if (c.brk) { if (out[out.length - 1].length) { out.push([]); h = 0; } return; }
      const ch = heights[i] || 0;
      const cur = out[out.length - 1];
      if (h + ch > avail && cur.length) {
        const carry = [];
        while (cur.length > 1 && chunks[cur[cur.length - 1]].keep) carry.unshift(cur.pop());
        out.push([...carry, i]);
        h = carry.reduce((a, k) => a + heights[k], 0) + ch;
      } else {
        cur.push(i);
        h += ch;
      }
    });
    if (out.length > 1 && !out[out.length - 1].length) out.pop();
    setLayout({ pages: out, chunks });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, fontTick]);

  const measurer = (
    <div className="paper measurer" style={{ ...paperStyle(s), width: PAGE_W - 2 * s.margin * MM - (s.border ? 8 : 0) }} ref={measureRef} aria-hidden>
      {chunks.map((c) => <div key={c.key} className={'ck ck-' + (c.kind || 'x')}>{c.el}</div>)}
    </div>
  );
  return { pages: layout?.pages || null, chunks: layout?.chunks || chunks, measurer };
}

export function Page({ s, n, total, children, className = '' }) {
  const L = labelsFor(s);
  const pad = s.margin * MM;
  const ar = s.labels === 'ar';
  const inset = Math.max(6, pad - 16);
  return (
    <div className={'page paper ' + className} style={{ ...paperStyle(s), padding: pad }}>
      {s.border && <div className="page-border" style={{ inset }} />}
      <div className="page-body" style={s.border ? { padding: '0 4px' } : null}>{children}</div>
      {(s.pageNo || s.footer) && (
        <div className="page-foot" style={{ left: pad, right: pad, bottom: s.border ? inset + 5 : Math.max(10, pad - 22) }} dir={ar ? 'rtl' : 'ltr'}>
          <span>{s.footer}</span>
          {s.pageNo && total > 1 ? <span>{ar ? `${L.Page} ${toArabicDigits(n)} ${L.of} ${toArabicDigits(total)}` : `${L.Page} ${n} ${L.of} ${total}`}</span> : <span />}
        </div>
      )}
    </div>
  );
}

/** Renders full pages (unscaled). Used by preview and by export. */
export function PaperPages({ doc, answers, onPages }) {
  const sig = JSON.stringify([doc.header, doc.settings, doc.sections, answers]);
  const chunks = useMemo(() => buildChunks(doc, { answers }), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const { pages, chunks: laid, measurer } = usePagination(chunks, doc.settings, sig);
  useEffect(() => { if (pages && onPages) onPages(pages.length); }, [pages, onPages]);
  return (
    <>
      {measurer}
      {pages && pages.map((p, i) => (
        <Page key={i} s={doc.settings} n={i + 1} total={pages.length}>
          {p.map((ci) => laid[ci] && <div key={laid[ci].key} className={'ck ck-' + (laid[ci].kind || 'x')}>{laid[ci].el}</div>)}
        </Page>
      ))}
    </>
  );
}

/** Scales A4 pages to the available width */
export function ScaledPages({ children, maxScale = 1, gap = 16, onScale }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const scale = w ? Math.min(maxScale, (w - 2) / PAGE_W) : 0.4;
  useEffect(() => { onScale?.(scale); }, [scale, onScale]);
  return (
    <div ref={ref} className="scaled" style={{ '--scale': scale, '--gap': gap + 'px' }}>
      {React.Children.map(children, (c) => c)}
    </div>
  );
}

/** cheap, unpaginated first-page thumbnail */
export function PaperThumb({ doc }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(el);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);
  const chunks = useMemo(() => (vis ? buildChunks(doc).filter((c) => !c.brk).slice(0, 14) : []), [vis, doc]);
  const scale = w / PAGE_W;
  return (
    <div className="thumb" ref={ref}>
      {vis && w > 0 && (
        <div className="thumb-in" style={{ transform: `scale(${scale})` }}>
          <Page s={doc.settings} n={1} total={1}>
            {chunks.map((c) => <div key={c.key} className={'ck ck-' + (c.kind || 'x')}>{c.el}</div>)}
          </Page>
        </div>
      )}
    </div>
  );
}
