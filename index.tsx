console.log("[EstateGuard-v1.2.1] Bootstrapping...");

// Aggressive Cache Buster for v1.2.1+
const APP_VERSION = "1.2.1";
const storedVersion = localStorage.getItem("estateguard_version");
if (storedVersion && storedVersion !== APP_VERSION) {
  console.log(`[EstateGuard] Version mismatch (${storedVersion} vs ${APP_VERSION}). Clearing cache...`);
  localStorage.setItem("estateguard_version", APP_VERSION);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) registration.unregister();
    });
  }
  window.location.reload();
} else {
  localStorage.setItem("estateguard_version", APP_VERSION);
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
