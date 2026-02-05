
import React, { useState } from 'react';
import { PropertySchema, PropertyTier } from '../types';

interface PropertyDetailsProps {
  property: PropertySchema;
  onDelete: () => void;
  onTest: () => void;
  onUpdate?: (updated: PropertySchema) => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onDelete, onTest, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState<PropertySchema>({ ...property });

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUpdate) {
      // Create a clean copy to ensure state triggers
      const finalized = { ...editedProperty };
      onUpdate(finalized);
      alert("SUCCESS: Data successfully synchronized with the Secure Asset Cloud.");
    }
    setIsEditing(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`DANGER: Are you sure you want to remove ${property.listing_details.address} from the portfolio? This will permanently delete the asset schema.`)) {
      onDelete();
    }
  };

  const handleEditToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Refresh edit state with current props in case of external changes
    setEditedProperty({ ...property });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Asset Specification Adjustment</h4>
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Location Address</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                value={editedProperty.listing_details.address}
                onChange={e => setEditedProperty({
                  ...editedProperty, 
                  listing_details: { ...editedProperty.listing_details, address: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valuation ($)</label>
                <input 
                  type="number"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                  value={editedProperty.listing_details.price}
                  onChange={e => setEditedProperty({
                    ...editedProperty, 
                    listing_details: { ...editedProperty.listing_details, price: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Scale (Sq Ft)</label>
                <input 
                  type="number"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                  value={editedProperty.listing_details.key_stats.sq_ft}
                  onChange={e => setEditedProperty({
                    ...editedProperty, 
                    listing_details: { 
                      ...editedProperty.listing_details, 
                      key_stats: { ...editedProperty.listing_details.key_stats, sq_ft: Number(e.target.value) } 
                    }
                  })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Market Narrative</label>
              <textarea 
                rows={4}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium resize-none focus:ring-2 focus:ring-gold outline-none transition-all"
                value={editedProperty.listing_details.hero_narrative}
                onChange={e => setEditedProperty({
                  ...editedProperty, 
                  listing_details: { ...editedProperty.listing_details, hero_narrative: e.target.value }
                })}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSave}
            className="flex-1 bg-slate-950 text-gold py-5 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-transform"
          >
            Update Synchronized Data
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
            className="px-10 bg-white border border-slate-200 py-5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 bg-slate-200 relative group">
          <img 
            src={`https://picsum.photos/seed/${property.property_id}/800/600`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            alt="Property Hero" 
            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{property.category}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${property.tier === PropertyTier.ESTATE_GUARD ? 'bg-slate-900 text-gold shadow-lg shadow-gold/10' : 'bg-slate-100 text-slate-500'}`}>
                {property.tier}
              </span>
            </div>
            <h3 className="text-3xl font-luxury font-bold text-slate-900 leading-tight">{property.listing_details.address || 'Address Unspecified'}</h3>
            <p className="text-slate-500 text-sm mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Secure Asset Cloud • {property.property_id}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
               <p className="text-xl font-bold text-slate-900">
                 {property.listing_details.price > 0 
                  ? `$${property.listing_details.price.toLocaleString()}` 
                  : 'Awaiting Quote'}
               </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Scale</p>
               <p className="text-xl font-bold text-slate-900">{property.listing_details.key_stats.sq_ft ? property.listing_details.key_stats.sq_ft.toLocaleString() : 'N/A'} SQ FT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
        <div>
          <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-4">Market Narrative</h4>
          <p className="text-slate-700 text-sm leading-relaxed italic border-l-4 border-gold pl-6 py-1">
            "{property.listing_details.hero_narrative || 'Market briefing currently in production.'}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div>
             <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <i className="fa-solid fa-lock text-gold"></i> Gated Protocols
             </h4>
             <div className="flex flex-wrap gap-2">
               {property.visibility_protocol.gated_fields.length > 0 ? (
                 property.visibility_protocol.gated_fields.map((field, idx) => (
                   <span key={idx} className="bg-slate-950 text-gold px-4 py-1.5 rounded-full text-[10px] font-bold shadow-md">
                     {field.replace(/_/g, ' ')}
                   </span>
                 ))
               ) : (
                 <span className="text-slate-400 text-xs italic">Public access authorized.</span>
               )}
             </div>
           </div>
           <div>
             <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <i className="fa-solid fa-user-tie text-gold"></i> Agent Intelligence
             </h4>
             <div className="text-[11px] text-slate-600 space-y-2 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-inner">
               <p><span className="font-bold text-slate-900 uppercase">Motivation:</span> {property.agent_notes.motivation || 'Verify with HQ'}</p>
               <p><span className="font-bold text-slate-900 uppercase">Access:</span> {property.agent_notes.showing_instructions || 'Appointment Required'}</p>
             </div>
           </div>
        </div>
      </div>

      <div className="pt-8 flex flex-col sm:flex-row gap-4">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTest(); }}
          className="gold-button flex-1 py-5 rounded-2xl font-bold text-sm shadow-2xl shadow-gold/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <i className="fa-solid fa-shield-halved"></i>
          Test Guard Sandbox
        </button>
        <button 
          onClick={handleEditToggle}
          className="bg-white border border-slate-200 text-slate-600 px-10 py-5 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <i className="fa-solid fa-pen-to-square"></i>
          Edit Details
        </button>
        <button 
          onClick={handleRemove}
          className="bg-red-50 text-red-600 px-10 py-5 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <i className="fa-solid fa-trash-can"></i>
          Remove Asset
        </button>
      </div>
    </div>
  );
};

export default PropertyDetails;
