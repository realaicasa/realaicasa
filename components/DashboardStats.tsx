import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { PropertySchema, Lead } from '../types';

interface DashboardStatsProps {
  properties: PropertySchema[];
  leads: Lead[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ properties, leads }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
        <div className="glass-panel p-6 rounded-2xl shadow-sm">
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Portfolio Volume</p>
          <p className="text-2xl font-bold mt-1 text-[var(--text-main)]">{properties.length} Assets</p>
          <div className="mt-2 text-emerald-400 text-xs font-semibold">
            <i className="fa-solid fa-building mr-1"></i> Active listings
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl shadow-sm">
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Qualified Leads</p>
          <p className="text-2xl font-bold mt-1 text-[var(--text-main)]">{leads.length}</p>
          <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
            <i className="fa-solid fa-fire mr-1"></i> Engagement active
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl shadow-sm">
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Gated Estates</p>
          <p className="text-2xl font-bold mt-1 text-[var(--text-main)]">{estateGuardCount}</p>
          <div className="mt-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-tighter">
            High-security protection
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl shadow-sm">
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Capture Rate</p>
          <p className="text-2xl font-bold mt-1 text-[var(--text-main)]">68%</p>
          <div className="mt-2 text-emerald-400 text-xs font-semibold">
            <i className="fa-solid fa-chart-line mr-1"></i> Optimal conversion
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-2xl shadow-sm min-h-[350px]">
          <h3 className="text-sm font-bold text-[var(--text-muted)] mb-6 uppercase tracking-wider">Lead Acquisition Heatmap</h3>
          <div className="h-64 mt-4 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--brand-primary)' }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-sm min-h-[350px]">
          <h3 className="text-sm font-bold text-[var(--text-muted)] mb-6 uppercase tracking-wider">Asset Interaction Intensity</h3>
          <div className="h-64 mt-4 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={properties.slice(0, 5).map(p => ({ name: p.property_id.substring(0, 8), hits: Math.floor(Math.random() * 80) + 20 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{fill: 'var(--glass-bg)'}}
                    contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="hits" radius={[6, 6, 0, 0]}>
                    {properties.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--brand-primary)' : 'var(--glass-border)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;