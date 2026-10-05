import React from 'react';
import { createRoot } from 'react-dom/client';
import './fonts';
import './styles.css';
import './paper/paper.css';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);

// Offline support (only in the deployed PWA build)
if (import.meta.env.VITE_PWA === '1' && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
}
