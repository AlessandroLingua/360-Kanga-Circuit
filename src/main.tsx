import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Capacitor } from '@capacitor/core';
import { startDriveSync } from './services/driveSync';
import './styles.css';

// Offline cache for the web/PWA build (native shells and Electron already bundle every asset).
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !Capacitor.isNativePlatform() && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

startDriveSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
