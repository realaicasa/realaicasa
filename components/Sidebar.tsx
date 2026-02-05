
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Command Center' },
    { id: 'properties', icon: 'fa-home', label: 'Properties' },
    { id: 'leads', icon: 'fa-user-tie', label: 'Hot Leads' },
    { id: 'ingestion', icon: 'fa-file-import', label: 'Ingestion Portal' },
    { id: 'chat', icon: 'fa-shield-halved', label: 'Guard Testing' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col shadow-xl">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <i className="fa-solid fa-shield-halved text-white text-xl"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight">EstateGuard <span className="text-indigo-400">AI</span></h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <img src="https://picsum.photos/40/40?grayscale" className="rounded-full w-10 h-10 border border-slate-700" alt="Agent" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">Westlake Premier</p>
            <p className="text-xs text-slate-500 truncate">Elite Tier Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
