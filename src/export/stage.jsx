import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { downloadBlob, safeName } from '../lib/utils';

const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);
const frames = (n = 2) => new Promise((r) => { const f = () => (n-- <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });

async function waitAssets(root) {
  try { await document.fonts?.ready; } catch { /* */ }
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; }))));
  await frames(3);
}

async function capture(root, { pixelRatio = 2, onProgress } = {}) {
  const { toJpeg, getFontEmbedCSS } = await import('html-to-image');
  const pages = Array.from(root.querySelectorAll('.page'));
  const fontEmbedCSS = await getFontEmbedCSS(pages[0]).catch(() => undefined);
  const opts = { quality: 0.93, pixelRatio, backgroundColor: '#ffffff', fontEmbedCSS, width: 794, height: 1123, style: { boxShadow: 'none', margin: '0' } };
  if (isIOS) { try { await toJpeg(pages[0], opts); } catch { /* warm-up for Safari */ } }
  const out = [];
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i + 1, pages.length);
    out.push(await toJpeg(pages[i], opts));
  }
  return out;
}

async function toPdfBlob(images) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  images.forEach((src, i) => {
    if (i) pdf.addPage();
    pdf.addImage(src, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });
  return pdf.output('blob');
}

const dataUrlToBlob = async (u) => (await fetch(u)).blob();

export async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}

/**
 * Renders pages off-screen (or for printing), then runs the job.
 * job = { kind: 'pdf' | 'png' | 'print', share, name, resolve, reject }
 * renderPages(onPages) must render <Page> elements (e.g. <PaperPages onPages />)
 */
export function ExportStage({ job, renderPages, onDone, onProgress }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!count || started.current) return;
    started.current = true;
    (async () => {
      const root = ref.current;
      try {
        await waitAssets(root);
        const name = safeName(job.name);
        if (job.kind === 'print') {
          document.documentElement.classList.add('printing');
          await frames(2);
          const done = () => { document.documentElement.classList.remove('printing'); window.removeEventListener('afterprint', done); };
          window.addEventListener('afterprint', done);
          window.print();
          setTimeout(done, 1500);
          job.resolve('printed');
        } else if (job.kind === 'pdf') {
          const imgs = await capture(root, { onProgress });
          const blob = await toPdfBlob(imgs);
          job.resolve(job.share ? await shareOrDownload(blob, name + '.pdf', job.name) : (downloadBlob(blob, name + '.pdf'), 'downloaded'));
        } else if (job.kind === 'png') {
          const imgs = await capture(root, { onProgress });
          const files = await Promise.all(imgs.map(async (u, i) => new File([await dataUrlToBlob(u)], `${name}${imgs.length > 1 ? '-' + (i + 1) : ''}.jpg`, { type: 'image/jpeg' })));
          if (job.share && navigator.canShare && navigator.canShare({ files })) {
            try { await navigator.share({ files, title: job.name }); } catch { /* cancelled */ }
          } else files.forEach((f, i) => setTimeout(() => downloadBlob(f, f.name), i * 350));
          job.resolve('done');
        }
      } catch (e) {
        console.error(e);
        job.reject(e);
      } finally {
        onDone();
      }
    })();
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div ref={ref} className={job.kind === 'print' ? 'print-host' : 'export-stage'} aria-hidden>
      {renderPages(setCount)}
    </div>,
    document.body,
  );
}
