import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  sortableKeyboardCoordinates, 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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

const SortableLead: React.FC<{ 
  lead: Lead; 
  col: string; 
  onDelete: (id: string) => void; 
  onUpdate: (lead: Lead) => void; 
  onStatusChange: (id: string, nextCol: string) => void; 
  columns: string[];
  onClick: () => void;
}> = ({ lead, col, onDelete, onUpdate, onStatusChange, columns, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id, data: { lead, col } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="glass-card p-4 rounded-xl shadow-sm border border-[var(--glass-border)] hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden bg-[var(--card-bg)]"
    >
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: lead.priority_score ? `rgba(var(--brand-primary-rgb), ${lead.priority_score / 10})` : 'transparent' }}></div>
      <div className="flex justify-between items-start mb-2 pointer-events-none">
        <p className="font-bold text-[var(--text-main)] text-sm">{lead.name}</p>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-sm ${
          lead.financing_status === 'Cash' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
        }`}>
          {lead.financing_status}
        </span>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mb-3 truncate font-medium pointer-events-none">{lead.property_address}</p>
      
      <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)] mt-2">
         <div className="flex items-center gap-2" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]/30 transition-all">
               <i className="fa-regular fa-calendar" style={lead.due_date ? { color: 'var(--brand-primary)' } : {}}></i>
               <input 
                 type="date" 
                 className="bg-transparent outline-none w-16 opacity-60 hover:opacity-100 cursor-pointer text-[9px] text-[var(--text-main)]"
                 value={lead.due_date ? new Date(lead.due_date).toISOString().split('T')[0] : ''}
                 onChange={(e) => onUpdate({...lead, due_date: e.target.value})}
               />
            </div>
         </div>
         
         <div className="flex gap-1" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
              className="w-7 h-7 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all border border-red-500/20"
            >
              <i className="fa-solid fa-trash-can text-[10px]"></i>
            </button>
         </div>
      </div>
    </div>
  );
};

const DroppableColumn: React.FC<{ col: string; children: React.ReactNode; style: any }> = ({ col, children, style }) => {
  const { setNodeRef } = useDroppable({ id: col });
  return (
    <div 
      ref={setNodeRef}
      className={`glass-panel p-2 rounded-2xl min-h-[500px] space-y-3 bg-opacity-30`}
    >
      {children}
    </div>
  );
};

const Kanban: React.FC<KanbanProps> = ({ leads, onStatusChange, onUpdateLead, onAddLead }) => {
  const [columns, setColumns] = useState<string[]>(['New', 'Discovery', 'Leads', 'Showing', 'Negotiation', 'Closed']);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLeadData, setNewLeadData] = useState({ name: '', phone: '', email: '', property_address: '' });
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const leadId = active.id as string;
    const overId = over.id as string;
    if (columns.includes(overId)) {
      if (active.data.current?.col !== overId) {
        onStatusChange(leadId, overId);
      }
    }
  };

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
        onStatusChange(id, 'Archived');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  return (
    <div className="relative group/kanban px-2">
      {/* Scroll Arrows */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-[#05080f]/50 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-white/40 hover:text-white hover:scale-110 transition-all opacity-0 group-hover/kanban:opacity-100 hidden md:flex border border-white/10"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-[#05080f]/50 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-white/40 hover:text-white hover:scale-110 transition-all opacity-0 group-hover/kanban:opacity-100 hidden md:flex border border-white/10"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-8 px-2 no-scrollbar min-h-[600px] snap-x snap-mandatory scroll-smooth"
        >
          {columns.map((col, idx) => {
            const style = PASTEL_COLORS[idx % PASTEL_COLORS.length];
            const isEditing = editingColumn === col;
            const columnLeads = leads.filter(l => l.status === col);

            return (
              <div key={col} className={`flex-shrink-0 w-[85vw] sm:w-80 snap-center transition-all`}>
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
                  
                    <div className="flex items-center gap-1">
                      <span className="bg-white/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {columnLeads.length}
                      </span>
                      {columnLeads.length === 0 && (
                        <button onClick={() => handleDeleteColumn(col)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500">
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      )}
                      {idx === 0 && !isAddingLead && (
                        <button 
                          onClick={() => setIsAddingLead(true)}
                          className="w-6 h-6 text-slate-950 rounded-md flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                          style={{ backgroundColor: 'var(--brand-primary)' }}
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                        </button>
                      )}
                    </div>
                </div>

                {idx === 0 && isAddingLead && (
                  <div 
                    className="mb-4 glass-card p-4 rounded-2xl border-2 shadow-xl" 
                    style={{ borderColor: 'var(--brand-primary)' }}
                    onPointerDown={e => e.stopPropagation()} // CRITICAL: Stop DnD kit from hijacking clicks
                  >
                     <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Manual Ingestion</p>
                        <button onClick={() => setIsAddingLead(false)} className="text-white/30 hover:text-white">
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                     </div>
                     <div className="space-y-3" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                        <input className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold outline-none text-[var(--text-main)]" placeholder="Lead Name" value={newLeadData.name} onChange={e => setNewLeadData({...newLeadData, name: e.target.value})} />
                        <input className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-medium outline-none text-[var(--text-main)]" placeholder="Phone / Email" value={newLeadData.phone} onChange={e => setNewLeadData({...newLeadData, phone: e.target.value})} />
                        <input className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-medium outline-none text-[var(--text-main)]" placeholder="Property Address" value={newLeadData.property_address} onChange={e => setNewLeadData({...newLeadData, property_address: e.target.value})} />
                        <button onClick={() => { if (newLeadData.name && onAddLead) { onAddLead(newLeadData); setIsAddingLead(false); setNewLeadData({ name: '', phone: '', email: '', property_address: '' }); } }} className="w-full py-2 rounded-lg text-xs font-bold text-slate-950" style={{ backgroundColor: 'var(--brand-primary)' }}>Secure Prospect</button>
                     </div>
                  </div>
                )}
                
                <DroppableColumn col={col} style={style}>
                  <SortableContext items={columnLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {columnLeads.map(lead => (
                      <SortableLead 
                        key={lead.id} 
                        lead={lead} 
                        col={col} 
                        onDelete={deleteLead} 
                        onUpdate={onUpdateLead!} 
                        onStatusChange={onStatusChange}
                        columns={columns}
                        onClick={() => handleLeadClick(lead)}
                      />
                    ))}
                    {columnLeads.length === 0 && (
                      <div className="h-20 flex items-center justify-center border-2 border-dashed border-white/30 rounded-xl text-slate-400/50 text-xs italic pointer-events-none">
                        Empty Stage
                      </div>
                    )}
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}

          <div className="flex-shrink-0 w-[85vw] sm:w-80 flex flex-col pt-1">
            {isAddingColumn ? (
               <div className="glass-panel p-4 rounded-xl shadow-xl border border-[var(--glass-border)]">
                  <input 
                    autoFocus 
                    placeholder="New Stage Name..." 
                    className="w-full text-sm font-bold mb-3 bg-transparent border-b border-[var(--glass-border)] outline-none text-[var(--text-main)] pb-1 focus:border-brand-primary" 
                    value={newColumnName} 
                    onChange={(e) => setNewColumnName(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()} 
                    style={{ '--brand-primary': 'var(--brand-primary)' } as any}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddColumn} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-950" style={{ backgroundColor: 'var(--brand-primary)' }}>Deploy Stage</button>
                    <button onClick={() => setIsAddingColumn(false)} className="flex-1 bg-[var(--glass-bg)] text-[var(--text-muted)] py-1.5 rounded-lg text-xs font-bold border border-[var(--glass-border)]">Cancel</button>
                  </div>
               </div>
            ) : (
               <button onClick={() => setIsAddingColumn(true)} className="w-full h-12 border-2 border-dashed border-[var(--glass-border)] rounded-xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--text-main)] transition-all group">
                  <i className="fa-solid fa-plus group-hover:scale-110 transition-transform"></i>
                  <span className="font-bold text-[10px] uppercase tracking-wider">New Pipeline Stage</span>
               </button>
            )}
          </div>
        </div>
      </DndContext>

      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
           <div className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-xl" onClick={() => setSelectedLead(null)}></div>
           <div className="relative glass-panel w-full max-w-5xl rounded-[3.5rem] shadow-[0_32px_120px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] border border-[var(--glass-border)] bg-[var(--bg-main)]">
              {/* Sidebar: Core Identity */}
              <div className="w-full md:w-80 bg-[var(--glass-bg)] backdrop-blur-md border-r border-[var(--glass-border)] p-10 flex flex-col gap-8 overflow-y-auto">
                 <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block opacity-30 text-[var(--text-main)]">Prospect Fingerprint</span>
                    <h3 className="text-3xl font-luxury font-bold text-[var(--text-main)] tracking-tight">{selectedLead.name}</h3>
                    <div className="flex gap-2 mt-4">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border ${
                         selectedLead.financing_status === 'Cash' 
                           ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                           : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                       }`}>
                          {selectedLead.financing_status} CAPITAL
                       </span>
                    </div>
                 </div>

                 <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group">
                       <i className="fa-solid fa-phone w-5 text-center transition-transform group-hover:scale-110" style={{ color: 'var(--brand-primary)' }}></i>
                       <span className="text-xs font-bold tracking-wide">{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                       <div className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group">
                          <i className="fa-solid fa-envelope w-5 text-center transition-transform group-hover:scale-110" style={{ color: 'var(--brand-primary)' }}></i>
                          <span className="text-xs font-bold truncate tracking-wide">{selectedLead.email}</span>
                       </div>
                    )}
                 </div>

                  <div className="pt-8 border-t border-[var(--glass-border)]">
                     <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-5">Intelligence Grade</p>
                     <div className="bg-[var(--glass-bg)] p-6 rounded-[2rem] border border-[var(--glass-border)] shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">Priority Index</p>
                           <span className="text-[11px] font-black uppercase" style={{ color: 'var(--brand-primary)' }}>
                             {selectedLead.priority_score || 0}/10
                           </span>
                        </div>
                        <input 
                           type="range" min="0" max="10" 
                           className="w-full accent-brand-primary cursor-pointer h-1.5 bg-white/10 rounded-full"
                           style={{ '--brand-primary': 'var(--brand-primary)' } as any}
                           value={selectedLead.priority_score || 0}
                           onChange={(e) => {
                             const updated = {...selectedLead, priority_score: parseInt(e.target.value)};
                             setSelectedLead(updated);
                             onUpdateLead!(updated);
                           }}
                        />
                     </div>
                  </div>

                  <div className="pt-4">
                     <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Engagement Context</p>
                     <div className="bg-[var(--glass-bg)] p-6 rounded-[2rem] border border-[var(--glass-border)]">
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-2">Target Asset</p>
                        <p className="text-xs font-bold text-[var(--text-main)] max-w-full break-words leading-relaxed italic">{selectedLead.property_address}</p>
                     </div>
                  </div>

                  <div className="mt-auto pt-10">
                     <button onClick={() => setSelectedLead(null)} className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] font-bold text-xs shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all uppercase tracking-widest hover:bg-white/90">
                       Done Reviewing
                     </button>
                  </div>
              </div>

              {/* Main Content: Logs and Intelligence */}
              <div className="flex-1 p-10 md:p-16 overflow-y-auto space-y-16 no-scrollbar bg-[var(--bg-main)]/40 text-[var(--text-main)]">
                 <section>
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-xl font-luxury font-bold text-[var(--text-main)] flex items-center gap-4">
                          <i className="fa-solid fa-user-shield" style={{ color: 'var(--brand-primary)' }}></i>
                          Intelligence Dossier
                       </h4>
                       <div className="flex items-center gap-3 bg-[var(--glass-bg)] px-4 py-2 rounded-xl border border-[var(--glass-border)]">
                          <i className="fa-regular fa-calendar text-[11px]" style={{ color: 'var(--brand-primary)' }}></i>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Follow-up:</span>
                          <input 
                            type="date" 
                            className="bg-transparent border-none outline-none text-[10px] font-bold text-[var(--text-main)] cursor-pointer uppercase"
                            value={selectedLead.due_date ? new Date(selectedLead.due_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const updated = {...selectedLead, due_date: e.target.value};
                              setSelectedLead(updated);
                              onUpdateLead!(updated);
                            }}
                          />
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                       <div className="relative">
                          <textarea 
                             className="w-full p-8 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2.5rem] text-sm font-medium focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none min-h-[200px] text-[var(--text-main)] leading-relaxed"
                             style={{ '--brand-primary': 'var(--brand-primary)' } as any}
                             placeholder="Capture internal strategy, gate requirements, or agent insights..."
                             value={selectedLead.agent_notes || ""}
                             onChange={(e) => {
                                const updated = {...selectedLead, agent_notes: e.target.value};
                                setSelectedLead(updated);
                                onUpdateLead!(updated);
                             }}
                          />
                          <button 
                            className="absolute bottom-6 right-6 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-950 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                            style={{ backgroundColor: 'var(--brand-primary)' }}
                            onClick={() => {
                               const timestamp = new Date().toLocaleString();
                               const prefix = `\n[${timestamp}] Agent Note: `;
                               const updated = {
                                 ...selectedLead, 
                                 agent_notes: (selectedLead.agent_notes || "") + prefix
                               };
                               setSelectedLead(updated);
                               onUpdateLead!(updated);
                            }}
                          >
                            <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                            Timestamp Entry
                          </button>
                       </div>
                    </div>
                 </section>

                 <section>
                    <h4 className="text-xl font-luxury font-bold text-[var(--text-main)] mb-8 flex items-center gap-4">
                       <i className="fa-solid fa-fingerprint" style={{ color: 'var(--brand-primary)' }}></i>
                       Captured Dialogue
                    </h4>
                     <div className="space-y-10 relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/5 rounded-full"></div>
                        {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 ? (
                           selectedLead.conversation_history.map((msg: any, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}>
                                 <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-2xl border ${
                                   msg.role === 'user' 
                                     ? 'bg-[var(--glass-bg)] text-[var(--text-main)] rounded-tr-none border-[var(--glass-border)]' 
                                     : 'bg-[var(--glass-bg)] text-[var(--text-main)] border-[var(--glass-border)] rounded-tl-none backdrop-blur-md'
                                 }`}>
                                    <div className={`text-[9px] font-black uppercase opacity-40 mb-3 tracking-[0.2em] flex items-center gap-2 ${msg.role === 'user' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                      {msg.role === 'user' ? <i className="fa-solid fa-user text-[8px]"></i> : <i className="fa-solid fa-robot text-[8px]"></i>}
                                      {msg.role === 'user' ? 'PROSPECT' : 'ELITE CONCIERGE'}
                                    </div>
                                    <p className="font-medium tracking-wide">{msg.content || msg.text || ""}</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="p-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-white/20 bg-white/5">
                              <i className="fa-solid fa-terminal text-4xl mb-6 opacity-20"></i>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No digitized session data available</p>
                           </div>
                        )}
                     </div>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;