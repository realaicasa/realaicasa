import React, { useState } from 'react';
import { Lead } from '../types';

interface KanbanProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: string) => void;
  onUpdateLead?: (lead: Lead) => void;
}

const PASTEL_COLORS = [
  { name: 'Soft Blue', bg: 'bg-indigo-50/80', border: 'border-indigo-100', dot: 'bg-indigo-400', text: 'text-indigo-900' },
  { name: 'Soft Green', bg: 'bg-emerald-50/80', border: 'border-emerald-100', dot: 'bg-emerald-400', text: 'text-emerald-900' },
  { name: 'Soft Purple', bg: 'bg-violet-50/80', border: 'border-violet-100', dot: 'bg-violet-400', text: 'text-violet-900' },
  { name: 'Soft Amber', bg: 'bg-amber-50/80', border: 'border-amber-100', dot: 'bg-amber-400', text: 'text-amber-900' },
  { name: 'Soft Rose', bg: 'bg-rose-50/80', border: 'border-rose-100', dot: 'bg-rose-400', text: 'text-rose-900' },
  { name: 'Soft Cyan', bg: 'bg-cyan-50/80', border: 'border-cyan-100', dot: 'bg-cyan-400', text: 'text-cyan-900' },
];

const Kanban: React.FC<KanbanProps> = ({ leads, onStatusChange, onUpdateLead }) => {
  const [columns, setColumns] = useState<string[]>(['New', 'Discovery', 'Qualified', 'Showing', 'Negotiation', 'Closed']);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempColumnName, setTempColumnName] = useState('');

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
      // In a real app, we'd batch update lead statuses too, but here we just update the View column name
      // Leads with the old status would become invisible unless we update them.
      // For this demo, we can just update the View. 
      // Ideally, we trigger onStatusChange for all leads in that column.
      leads.filter(l => l.status === editingColumn).forEach(l => {
          onStatusChange(l.id, tempColumnName.trim());
      });
    }
    setEditingColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-8 px-2 no-scrollbar min-h-[600px] snap-x snap-mandatory">
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
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-white/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  {leads.filter(l => l.status === col).length}
                </span>
                {leads.filter(l => l.status === col).length === 0 && (
                   <button onClick={() => handleDeleteColumn(col)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500">
                     <i className="fa-solid fa-xmark text-xs"></i>
                   </button>
                )}
              </div>
            </div>
            
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
                        <label className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-gold cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                           <i className="fa-regular fa-calendar"></i>
                           <input 
                             type="date" 
                             className="bg-transparent outline-none w-16 opacity-60 hover:opacity-100"
                             value={lead.due_date ? new Date(lead.due_date).toISOString().split('T')[0] : ''}
                             onChange={(e) => onUpdateLead && onUpdateLead({...lead, due_date: e.target.value})}
                           />
                        </label>
                     </div>
                     
                     <div className="flex gap-1">
                        {columns.indexOf(col) < columns.length - 1 && (
                          <button 
                            onClick={() => onStatusChange(lead.id, columns[columns.indexOf(col) + 1])}
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
  );
};

export default Kanban;