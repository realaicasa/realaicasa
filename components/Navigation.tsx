import React from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brandColor?: string;
  qrDataUrl?: string;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, brandColor = '#d4af37', qrDataUrl }) => {
  const { t } = useTranslation();
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: t('sidebar.dashboard') },
    { id: 'properties', icon: 'fa-building', label: t('sidebar.properties') },
    { id: 'leads', icon: 'fa-layer-group', label: t('sidebar.leads') },
    { id: 'ingestion', icon: 'fa-plus-circle', label: t('sidebar.ingestion') },
    { id: 'chat', icon: 'fa-comments', label: t('sidebar.chat') },
    { id: 'settings', icon: 'fa-id-card', label: t('sidebar.settings') },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <div className="hidden md:flex flex-col w-72 bg-[var(--bg-sidebar)] text-[var(--text-main)] h-screen border-r border-[var(--glass-border)] shadow-2xl z-20">
        <div className="p-8 flex items-center gap-4 mb-8">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: brandColor }}
          >
            <i className="fa-solid fa-shield-halved text-slate-950 text-xl"></i>
          </div>
          <h1 className="text-xl font-luxury font-bold tracking-tight">RealAi</h1>
        </div>

        <div className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'shadow-xl font-bold scale-[1.02] border' 
                  : 'text-[var(--text-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]'
              }`}
              style={activeTab === item.id ? { 
                backgroundColor: `${brandColor}15`, 
                borderColor: `${brandColor}30`,
                color: brandColor
              } : {}}
            >
              <i 
                className={`fa-solid ${item.icon} transition-colors`}
                style={activeTab === item.id ? { color: brandColor } : {}}
              ></i>
              <span className="text-xs uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-900">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
          >
            <i className="fa-solid fa-power-off"></i>
            <span className="text-xs uppercase tracking-[0.2em]">{t('sidebar.sign_out', { defaultValue: 'Sign Out' })}</span>
          </button>
        </div>

        {qrDataUrl && (
          <div className="px-8 mb-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-white/5 shadow-2xl group hover:border-gold/20 transition-all">
                <div className="bg-white p-3 rounded-[1.5rem] shadow-inner mb-4">
                  <img src={qrDataUrl} alt="Quick Save" className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[9px] font-black text-gold uppercase tracking-[0.2em] text-center">{t('sidebar.scan_to_save', { defaultValue: 'Scan to Save' })}</p>
                <p className="text-[8px] text-slate-500 font-bold text-center mt-1">PWA AUTO-BRIDGE</p>
            </div>
          </div>
        )}

        <div className="mt-auto p-8 border-t border-slate-900">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[var(--card-bg)] flex items-center justify-center border border-[var(--glass-border)] overflow-hidden">
                <i className="fa-solid fa-user text-[var(--text-muted)] text-xs"></i>
             </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">{t('sidebar.agent_access', { defaultValue: 'Agent Access' })}</p>
                 <p className="text-[10px] text-gold font-bold">{t('sidebar.synchronized', { defaultValue: 'Synchronized' })}</p>
              </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-sidebar)] border-t border-[var(--glass-border)] px-2 py-3 z-50 flex justify-around items-center rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center gap-1 transition-all duration-200"
            style={{ color: activeTab === item.id ? brandColor : 'var(--text-muted)' }}
          >
            <i 
              className={`fa-solid ${item.icon} text-xl transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}
            ></i>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Navigation;