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
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100/50 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group relative"
    >
      <div className="flex justify-between items-start mb-2 pointer-events-none">
        <p className="font-bold text-slate-800 text-sm">{lead.name}</p>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
          lead.financing_status === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {lead.financing_status}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 mb-3 truncate font-medium pointer-events-none">{lead.property_address}</p>
      
      <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
         <div className="flex items-center gap-2" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${lead.due_date ? 'bg-gold/10 border-gold text-gold font-bold' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-gold hover:text-gold'}`}>
               <i className="fa-regular fa-calendar"></i>
               <input 
                 type="date" 
                 className="bg-transparent outline-none w-16 opacity-60 hover:opacity-100 cursor-pointer"
                 value={lead.due_date ? new Date(lead.due_date).toISOString().split('T')[0] : ''}
                 onChange={(e) => onUpdate({...lead, due_date: e.target.value})}
               />
            </div>
         </div>
         
         <div className="flex gap-1" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
              className="w-7 h-7 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
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
      className={`${style.bg} p-2 rounded-2xl min-h-[500px] space-y-3 border ${style.border} bg-opacity-30 backdrop-blur-sm`}
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
                          className="w-6 h-6 bg-[#d4af37] text-slate-950 rounded-md flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                        </button>
                      )}
                    </div>
                </div>

                {idx === 0 && isAddingLead && (
                  <div className="mb-4 bg-white p-4 rounded-2xl border-2 border-gold shadow-xl">
                     <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual Ingestion</p>
                        <button onClick={() => setIsAddingLead(false)} className="text-slate-400 hover:text-slate-600">
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                     </div>
                     <div className="space-y-3">
                        <input className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-bold outline-none" placeholder="Lead Name" value={newLeadData.name} onChange={e => setNewLeadData({...newLeadData, name: e.target.value})} />
                        <input className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium outline-none" placeholder="Phone / Email" value={newLeadData.phone} onChange={e => setNewLeadData({...newLeadData, phone: e.target.value})} />
                        <input className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-medium outline-none" placeholder="Property Address" value={newLeadData.property_address} onChange={e => setNewLeadData({...newLeadData, property_address: e.target.value})} />
                        <button onClick={() => { if (newLeadData.name && onAddLead) { onAddLead(newLeadData); setIsAddingLead(false); setNewLeadData({ name: '', phone: '', email: '', property_address: '' }); } }} className="w-full bg-gold text-slate-900 py-2 rounded-lg text-xs font-bold">Secure Prospect</button>
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
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <input autoFocus placeholder="New Column Name..." className="w-full text-sm font-bold mb-3 outline-none border-b-2 border-gold pb-1" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()} />
                  <div className="flex gap-2">
                    <button onClick={handleAddColumn} className="flex-1 bg-gold text-slate-900 py-1.5 rounded-lg text-xs font-bold">Add</button>
                    <button onClick={() => setIsAddingColumn(false)} className="flex-1 bg-slate-100 text-slate-500 py-1.5 rounded-lg text-xs font-bold">Cancel</button>
                  </div>
               </div>
            ) : (
               <button onClick={() => setIsAddingColumn(true)} className="w-full h-12 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-gold hover:text-gold transition-all">
                  <i className="fa-solid fa-plus"></i>
                  <span className="font-bold text-xs uppercase tracking-widest">Add Stage</span>
               </button>
            )}
          </div>
        </div>
      </DndContext>

      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedLead(null)}></div>
           <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]">
              <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-8 overflow-y-auto">
                 <div>
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-2 block">Prospect ID: {selectedLead.id}</span>
                    <h3 className="text-2xl font-luxury font-bold text-slate-900">{selectedLead.name}</h3>
                    <div className="flex gap-2 mt-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${selectedLead.financing_status === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {selectedLead.financing_status} Buyer
                       </span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                       <i className="fa-solid fa-phone text-gold w-4"></i>
                       <span className="text-xs font-bold">{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                       <div className="flex items-center gap-3 text-slate-600">
                          <i className="fa-solid fa-envelope text-gold w-4"></i>
                          <span className="text-xs font-bold truncate">{selectedLead.email}</span>
                       </div>
                    )}
                 </div>
                  <div className="pt-8 border-t border-slate-200">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Intelligence Score</p>
                     <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group">
                        <div className="flex items-center justify-between mb-2">
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Priority Level</p>
                           {(() => {
                              const score = (selectedLead.conversation_history?.length || 0) * 10 + (selectedLead.agent_notes?.length || 0) / 10;
                              const level = score > 50 ? 'Elite' : score > 20 ? 'High' : 'Standard';
                              const color = level === 'Elite' ? 'text-gold' : level === 'High' ? 'text-indigo-600' : 'text-slate-400';
                              return <span className={`text-[10px] font-black uppercase ${color}`}>{level}</span>;
                           })()}
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-gold transition-all duration-1000" 
                              style={{ width: `${Math.min(((selectedLead.conversation_history?.length || 0) * 10 + (selectedLead.agent_notes?.length || 0) / 20), 100)}%` }}
                           ></div>
                        </div>
                     </div>
                  </div>
                  <div className="pt-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Inquiry Context</p>
                     <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target Property</p>
                        <p className="text-xs font-bold text-slate-800 leading-relaxed mb-3">{selectedLead.property_address}</p>
                     </div>
                  </div>
                  <div className="mt-auto">
                     <button onClick={() => setSelectedLead(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs shadow-xl active:scale-95 transition-all">Done Reviewing</button>
                  </div>
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12 no-scrollbar">
                 <section>
                    <h4 className="text-lg font-luxury font-bold text-slate-900 mb-6 flex items-center gap-3">
                       <i className="fa-solid fa-user-tie text-gold"></i>
                       Agent Intelligence Notes
                    </h4>
                    <textarea 
                       className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all resize-none min-h-[150px]"
                       placeholder="Add strategic notes..."
                       value={selectedLead.agent_notes || ""}
                       onChange={(e) => {
                          const updated = {...selectedLead, agent_notes: e.target.value};
                          setSelectedLead(updated);
                          onUpdateLead!(updated);
                       }}
                    />
                 </section>
                 <section>
                    <h4 className="text-lg font-luxury font-bold text-slate-900 mb-6 flex items-center gap-3">
                       <i className="fa-solid fa-comments text-gold"></i>
                       Conversation History
                    </h4>
                     <div className="space-y-6">
                        {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 ? (
                           selectedLead.conversation_history.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                                    <div className={`text-[9px] font-black uppercase opacity-40 mb-2 tracking-widest ${msg.role === 'user' ? 'text-gold' : 'text-slate-500'}`}>{msg.role === 'user' ? 'Prospect' : 'Concierge Intelligence'}</div>
                                    {msg.content}
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                              <i className="fa-solid fa-ghost text-4xl mb-4 opacity-10"></i>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Zero captured dialogue for this session</p>
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