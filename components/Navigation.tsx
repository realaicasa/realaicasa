import React from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brandColor?: string;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, brandColor = '#d4af37' }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Command' },
    { id: 'properties', icon: 'fa-building', label: 'Portfolio' },
    { id: 'leads', icon: 'fa-layer-group', label: 'Qualified' },
    { id: 'ingestion', icon: 'fa-plus-circle', label: 'Ingest' },
    { id: 'chat', icon: 'fa-robot', label: 'Concierge' },
    { id: 'settings', icon: 'fa-cog', label: 'Identity' },
  ];

  return (
    <>
      <div className="hidden md:flex w-64 bg-slate-950 text-white min-h-screen p-6 flex-col shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 rounded-lg" style={{ backgroundColor: brandColor }}>
            <i className="fa-solid fa-shield-halved text-slate-950 text-xl"></i>
          </div>
          <h1 className="text-xl font-luxury font-bold tracking-tight">RealAi</h1>
        </div>

        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
              }`}
              style={activeTab === item.id ? { backgroundColor: brandColor, color: '#000' } : {}}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900">
                <i className="fa-solid fa-user-tie text-gold"></i>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">EstateGuard Hub</p>
              <p className="text-[10px] text-gold uppercase font-bold tracking-tighter">Enterprise Access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 px-2 py-3 z-50 flex justify-around items-center rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${
              activeTab === item.id ? 'text-gold' : 'text-slate-600'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Navigation;