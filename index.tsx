console.log("[EstateGuard-v1.1.9] Bootstrapping...");
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
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#05080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 glass-panel p-12 rounded-[3rem]">
          <i className="fa-solid fa-shield-halved text-5xl animate-spin text-[#d4af37]"></i>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50">Waking Intelligence...</p>
        </div>
      </div>
    }>
      <App />
      <Analytics />
      <SpeedInsights />
    </React.Suspense>
  </React.StrictMode>
);
