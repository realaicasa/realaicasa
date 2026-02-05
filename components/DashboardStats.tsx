import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { PropertySchema, Lead } from '../types';

interface DashboardStatsProps {
  properties: PropertySchema[];
  leads: Lead[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ properties, leads }) => {
  const data = [
    { name: 'Mon', leads: 4 },
    { name: 'Tue', leads: 7 },
    { name: 'Wed', leads: 5 },
    { name: 'Thu', leads: 12 },
    { name: 'Fri', leads: 9 },
    { name: 'Sat', leads: 15 },
    { name: 'Sun', leads: 11 },
  ];

  const estateGuardCount = properties.filter(p => p.tier === 'Estate Guard').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Portfolio Volume</p>
          <p className="text-2xl font-bold mt-1">{properties.length} Assets</p>
          <div className="mt-2 text-emerald-600 text-xs font-semibold">
            <i className="fa-solid fa-building mr-1"></i> Active listings
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Qualified Leads</p>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
          <div className="mt-2 text-gold text-xs font-semibold">
            <i className="fa-solid fa-fire mr-1"></i> Engagement active
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Gated Estates</p>
          <p className="text-2xl font-bold mt-1">{estateGuardCount}</p>
          <div className="mt-2 text-slate-400 text-xs font-semibold">
            High-security protection
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Capture Rate</p>
          <p className="text-2xl font-bold mt-1">68%</p>
          <div className="mt-2 text-emerald-600 text-xs font-semibold">
            <i className="fa-solid fa-chart-line mr-1"></i> Optimal conversion
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Lead Acquisition Heatmap</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Asset Interaction Intensity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={properties.slice(0, 5).map(p => ({ name: p.property_id, hits: Math.floor(Math.random() * 80) + 20 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hits" radius={[6, 6, 0, 0]}>
                  {properties.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#d4af37' : '#111827'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;