import React, { useState } from 'react';
import { Lead } from '../types';

interface KanbanProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: string) => void;
  onUpdateLead?: (lead: Lead) => void;
  onAddLead?: (lead: Partial<Lead>) => void;
}

const PASTEL_COLORS = [
  { name: 'Soft Blue', bg: 'bg-indigo-50/80', border: 'border-indigo-100', dot: 'bg-indigo-400', text: 'text-indigo-900' },
  { name: 'Soft Green', bg: 'bg-emerald-50/80', border: 'border-emerald-100', dot: 'bg-emerald-400', text: 'text-emerald-900' },
  { name: 'Soft Purple', bg: 'bg-violet-50/80', border: 'border-violet-100', dot: 'bg-violet-400', text: 'text-violet-900' },
  { name: 'Soft Amber', bg: 'bg-amber-50/80', border: 'border-amber-100', dot: 'bg-amber-400', text: 'text-amber-900' },
  { name: 'Soft Rose', bg: 'bg-rose-50/80', border: 'border-rose-100', dot: 'bg-rose-400', text: 'text-rose-900' },
  { name: 'Soft Cyan', bg: 'bg-cyan-50/80', border: 'border-cyan-100', dot: 'bg-cyan-400', text: 'text-cyan-900' },
];

const Kanban: React.FC<KanbanProps> = ({ leads, onStatusChange, onUpdateLead, onAddLead }) => {
  const [columns, setColumns] = useState<string[]>(['New', 'Discovery', 'Leads', 'Showing', 'Negotiation', 'Closed']); // Fixed 'Leads' name here too
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', phone: '', email: '', property_address: '' });
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      setColumns([...columns, newColumnName.trim()]);
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };

  const handleDeleteColumn = (col: string) => {
    if (confirm(`Delete column "${col}"?`)) {
       setColumns(columns.filter(c => c !== col));
    }
  };

  const startRename = (col: string) => {
    setEditingColumn(col);
    setTempColumnName(col);
  };

  const finishRename = () => {
    if (editingColumn && tempColumnName.trim()) {
      setColumns(columns.map(c => c === editingColumn ? tempColumnName.trim() : c));
      leads.filter(l => l.status === editingColumn).forEach(l => {
          onStatusChange(l.id, tempColumnName.trim());
      });
    }
    setEditingColumn(null);
  };

  const deleteLead = (id: string) => {
    if (confirm("Permanently archive this lead?")) {
        // Implementation depends on onUpdateLead or a new onDeleteLead prop
        // For now, we'll assume setting status to 'Archived' hide's it if 'Archived' isn't a column
        onStatusChange(id, 'Archived');
    }
  };

  return (
    <div className="relative group/kanban">
      {/* Scroll Arrows */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-gold hover:scale-110 transition-all opacity-0 group-hover/kanban:opacity-100 hidden md:flex border border-slate-100"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-gold hover:scale-110 transition-all opacity-0 group-hover/kanban:opacity-100 hidden md:flex border border-slate-100"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-8 px-2 no-scrollbar min-h-[600px] snap-x snap-mandatory scroll-smooth"
      >
        {columns.map((col, idx) => {
          const style = PASTEL_COLORS[idx % PASTEL_COLORS.length];
          const isEditing = editingColumn === col;

          return (
            <div key={col} className={`flex-shrink-0 w-[85vw] sm:w-80 snap-center transition-all`}>
              {/* Column Header */}
              <div className={`mb-3 px-3 py-2 rounded-xl flex items-center justify-between group ${style.bg} ${style.border} border`}>
                <div className="flex items-center gap-2 flex-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm`}></span>
                  {isEditing ? (
                    <input 
                      autoFocus
                      value={tempColumnName}
                      onChange={(e) => setTempColumnName(e.target.value)}
                      onBlur={finishRename}
                      onKeyDown={(e) => e.key === 'Enter' && finishRename()}
                      className="bg-transparent border-b border-slate-400 outline-none w-full text-sm font-bold text-slate-800"
                    />
                  ) : (
                    <h3 onClick={() => startRename(col)} className={`font-bold text-sm cursor-text ${style.text} truncate`}>
                      {col}
                    </h3>
                  )}
                </div>
                
                  <div className="flex items-center gap-1 transition-opacity">
                    <span className="bg-white/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {leads.filter(l => l.status === col).length}
                    </span>
                    {leads.filter(l => l.status === col).length === 0 && (
                      <button onClick={() => handleDeleteColumn(col)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    )}
                    {idx === 0 && !isAddingLead && (
                      <button 
                        onClick={() => setIsAddingLead(true)}
                        className="w-6 h-6 bg-[#d4af37] text-slate-950 rounded-md flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                        title="Add Manual Lead"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i>
                      </button>
                    )}
                  </div>
              </div>

              {/* Add Lead Inline Form */}
              {idx === 0 && isAddingLead && (
                <div className="mb-4 bg-white p-4 rounded-2xl border-2 border-gold shadow-xl animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual Ingestion</p>
                      <button onClick={() => setIsAddingLead(false)} className="text-slate-400 hover:text-slate-600">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                   </div>
                   <div className="space-y-3">
                      <input 
                        className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-bold outline-none focus:border-gold"
                        placeholder="Lead Name"
                        value={newLeadData.name}
                        onChange={e => setNewLeadData({...newLeadData, name: e.target.value})}
                      />
                      <input 
                        className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium outline-none focus:border-gold"
                        placeholder="Phone / Email"
                        value={newLeadData.phone}
                        onChange={e => setNewLeadData({...newLeadData, phone: e.target.value})}
                      />
                      <input 
                        className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium outline-none focus:border-gold"
                        placeholder="Property Address (Ref)"
                        value={newLeadData.property_address}
                        onChange={e => setNewLeadData({...newLeadData, property_address: e.target.value})}
                      />
                      <button 
                         onClick={() => {
                           if (newLeadData.name && onAddLead) {
                             onAddLead(newLeadData);
                             setIsAddingLead(false);
                             setNewLeadData({ name: '', phone: '', email: '', property_address: '' });
                           }
                         }}
                         className="w-full bg-gold text-slate-900 py-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-transform"
                      >
                         Secure Prospect
                      </button>
                   </div>
                </div>
              )}
              
              {/* Column Body */}
              <div className={`${style.bg} p-2 rounded-2xl min-h-[500px] space-y-3 border ${style.border} bg-opacity-30 backdrop-blur-sm`}>
                {leads.filter(l => l.status === col).map(lead => (
                  <div 
                    key={lead.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100/50 hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 text-sm">{lead.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        lead.financing_status === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {lead.financing_status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3 truncate font-medium">{lead.property_address}</p>
                    
                    {/* Due Date & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                       <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${lead.due_date ? 'bg-gold/10 border-gold text-gold font-bold' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-gold hover:text-gold'}`}>
                             <i className="fa-regular fa-calendar"></i>
                             <input 
                               type="date" 
                               className="bg-transparent outline-none w-16 opacity-60 hover:opacity-100 cursor-pointer"
                               value={lead.due_date ? new Date(lead.due_date).toISOString().split('T')[0] : ''}
                               onChange={(e) => onUpdateLead && onUpdateLead({...lead, due_date: e.target.value})}
                             />
                          </div>
                          {lead.due_date && (
                             <span className="text-[8px] uppercase tracking-tighter text-gold font-black">Priority</span>
                          )}
                       </div>
                       
                       <div className="flex gap-1 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                            className="w-7 h-7 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                          {columns.indexOf(col) < columns.length - 1 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, columns[columns.indexOf(col) + 1]); }}
                              className="w-7 h-7 bg-slate-50 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                            >
                              <i className="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
                
                {leads.filter(l => l.status === col).length === 0 && (
                  <div className="h-20 flex items-center justify-center border-2 border-dashed border-white/30 rounded-xl text-slate-400/50 text-xs italic">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Column Button */}
        <div className="flex-shrink-0 w-[85vw] sm:w-80 flex flex-col pt-1">
          {isAddingColumn ? (
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
                <input 
                   autoFocus
                   placeholder="New Column Name..."
                   className="w-full text-sm font-bold mb-3 outline-none border-b-2 border-gold pb-1"
                   value={newColumnName}
                   onChange={(e) => setNewColumnName(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                />
                <div className="flex gap-2">
                  <button onClick={handleAddColumn} className="flex-1 bg-gold text-slate-900 py-1.5 rounded-lg text-xs font-bold">Add</button>
                  <button onClick={() => setIsAddingColumn(false)} className="flex-1 bg-slate-100 text-slate-500 py-1.5 rounded-lg text-xs font-bold">Cancel</button>
                </div>
             </div>
          ) : (
             <button 
               onClick={() => setIsAddingColumn(true)}
               className="w-full h-12 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-gold hover:text-gold transition-all"
             >
                <i className="fa-solid fa-plus"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Add Stage</span>
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kanban;