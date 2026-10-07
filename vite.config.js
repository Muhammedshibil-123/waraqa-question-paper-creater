import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`        -> installable PWA in dist/ (deploy to Vercel / Netlify / GitHub Pages)
// `npm run build:single` -> one self-contained HTML file in dist-single/ (for quick sharing / preview)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    define: { 'import.meta.env.VITE_PWA': JSON.stringify(single ? '0' : '1') },
    plugins: [
      react(),
      single
        ? [viteSingleFile(), { name: 'pwa-stub', resolveId: (id) => (id === 'virtual:pwa-register' ? '\0pwa-stub' : null), load: (id) => (id === '\0pwa-stub' ? 'export const registerSW = () => {};' : null) }]
        : VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            includeAssets: ['icon.svg', 'apple-touch-icon.png'],
            workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, navigateFallbackDenylist: [/^\/api\//, /^\/mcp/] },
            manifest: {
              name: 'Waraqa – Question paper maker',
              short_name: 'Waraqa',
              description: 'Make Arabic, English and Malayalam question papers and mark sheets on your phone.',
              theme_color: '#1e4a3b',
              background_color: '#edf2ee',
              display: 'standalone',
              orientation: 'portrait',
              start_url: './',
              scope: './',
              icons: [
                { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
          }),
    ],
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: 100000000, cssCodeSplit: false, chunkSizeWarningLimit: 9000 }
      : { outDir: 'dist', chunkSizeWarningLimit: 1500 },
  };
});
