
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
        <div className="glass-panel p-8 rounded-[2rem]">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">Asset Core Specification</h4>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Transaction Type</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all cursor-pointer bg-white"
                  value={editedProperty.transaction_type}
                  onChange={e => setEditedProperty({ ...editedProperty, transaction_type: e.target.value as any })}
                >
                  <option value="Sale">For Sale</option>
                  <option value="Rent">For Rent</option>
                  <option value="Lease">For Lease</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Asset Category</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all cursor-pointer bg-white"
                  value={editedProperty.category}
                  onChange={e => setEditedProperty({ ...editedProperty, category: e.target.value as any })}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land">Land</option>
                </select>
              </div>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Asset Status</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all cursor-pointer bg-white"
                  value={editedProperty.status}
                  onChange={e => setEditedProperty({ ...editedProperty, status: e.target.value as any })}
                >
                  <option value="Active">Active Listing</option>
                  <option value="Pending">Under Contract</option>
                  <option value="Sold">Sold / Closed</option>
                  <option value="Rented">Rented</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Asset Image URL</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                value={editedProperty.listing_details.image_url || ''}
                placeholder="https://images.unsplash.com/..."
                onChange={e => setEditedProperty({
                  ...editedProperty, 
                  listing_details: { ...editedProperty.listing_details, image_url: e.target.value }
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

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Market Narrative</label>
              <textarea 
                rows={3}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium resize-none focus:ring-2 focus:ring-gold outline-none transition-all"
                value={editedProperty.listing_details.hero_narrative}
                onChange={e => setEditedProperty({
                  ...editedProperty, 
                  listing_details: { ...editedProperty.listing_details, hero_narrative: e.target.value }
                })}
              />
            </div>
          </div>

          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10 mb-6 border-b border-slate-200 pb-2 flex items-center gap-2">
             <i className="fa-solid fa-list-check text-gold"></i> Premium Amenities
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
             {[
               { label: 'Swimming Pool', field: 'pool', icon: 'fa-water' },
               { label: 'Garage / Parking', field: 'garage', icon: 'fa-car' },
               { label: 'High-speed WiFi', field: 'wifi', icon: 'fa-wifi' },
               { label: 'Laundry Unit', field: 'laundry', icon: 'fa-soap' },
               { label: 'Pets Allowed', field: 'pets_allowed', icon: 'fa-dog' },
               { label: 'Fitness Center', field: 'gym', icon: 'fa-dumbbell' },
               { label: '24/7 Security', field: 'security', icon: 'fa-shield-halved' }
             ].map((item) => (
               <label key={item.field} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox"
                      className="peer sr-only"
                      checked={!!(editedProperty.amenities as any)?.[item.field]}
                      onChange={e => setEditedProperty({
                        ...editedProperty,
                        amenities: {
                          ...editedProperty.amenities,
                          [item.field]: e.target.checked
                        }
                      })}
                    />
                    <div className="w-6 h-6 border-2 border-slate-200 rounded-lg group-hover:border-gold transition-colors peer-checked:bg-gold peer-checked:border-gold flex items-center justify-center">
                      <i className="fa-solid fa-check text-white text-[10px] scale-0 peer-checked:scale-100 transition-transform"></i>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-800 transition-colors">{item.label}</span>
                    <i className={`fa-solid ${item.icon} text-slate-300 text-xs mt-0.5 group-hover:text-gold transition-colors`}></i>
                  </div>
               </label>
             ))}
          </div>

          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10 mb-6 border-b border-slate-200 pb-2 flex items-center gap-2">
             <i className="fa-solid fa-search text-gold"></i> SEO Automation
          </h4>
          <div className="space-y-5">
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Meta Title</label>
               <input 
                 className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                 value={editedProperty.seo?.meta_title || ''}
                 placeholder="Luxury Apartment in Downtown..."
                 onChange={e => setEditedProperty({
                   ...editedProperty, 
                   seo: { ...editedProperty.seo, meta_title: e.target.value }
                 })}
               />
               <p className="text-[9px] text-slate-400 mt-1 ml-1">Recommended: Under 60 characters for peak search ranking.</p>
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Meta Description</label>
               <textarea 
                 rows={2}
                 className="w-full px-5 py-4 rounded-2xl border border-slate-200 mt-1 text-sm font-medium resize-none focus:ring-2 focus:ring-gold outline-none transition-all underline-none"
                 value={editedProperty.seo?.meta_description || ''}
                 placeholder="Discover the ultimate in modern living..."
                 onChange={e => setEditedProperty({
                   ...editedProperty, 
                   seo: { ...editedProperty.seo, meta_description: e.target.value }
                 })}
               />
             </div>
          </div>

          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10 mb-6 border-b border-slate-200 pb-2 flex items-center gap-2">
             <i className="fa-solid fa-brain text-gold"></i> AI Precision Training
          </h4>
          <div className="space-y-4">
             {[
               { label: 'Proximity to Waterfront', field: 'proximityWaterfront', icon: 'fa-water' },
               { label: 'Commute & Transport', field: 'commuteTime', icon: 'fa-car' },
               { label: 'Educational Facilities', field: 'schools', icon: 'fa-school' },
               { label: 'Healthcare & Hospitals', field: 'hospitals', icon: 'fa-hospital' },
               { label: 'Markets & Essentials', field: 'supermarkets', icon: 'fa-cart-shopping' }
             ].map((item) => (
               <div key={item.field}>
                 <div className="flex items-center gap-2 mb-1 ml-1">
                    <i className={`fa-solid ${item.icon} text-gold/60 text-[10px]`}></i>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</label>
                 </div>
                 <input 
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                   value={(editedProperty.ai_training as any)?.[item.field] || ''}
                   onChange={e => setEditedProperty({
                     ...editedProperty,
                     ai_training: {
                       ...editedProperty.ai_training,
                       [item.field]: e.target.value
                     }
                   })}
                   placeholder={`Specify ${item.label.toLowerCase()} details...`}
                 />
               </div>
             ))}
          </div>
        </div>
        <div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t border-slate-100 mt-4">
          <button 
            onClick={handleSave}
            className="flex-1 py-5 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-transform text-slate-950"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Sychronize Asset Cloud
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
            src={property.listing_details.image_url || `https://picsum.photos/seed/${property.property_id}/800/600`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            alt="Property Hero" 
            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80')}
          />
          <div className={`absolute top-4 right-4 backdrop-blur-md px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border ${
            property.transaction_type === 'Rent' || property.transaction_type === 'Lease'
              ? 'bg-emerald-600/90 text-white border-emerald-400/30'
              : 'bg-gold/90 text-slate-950 border-white/20'
          }`}>
             {property.transaction_type === 'Rent' || property.transaction_type === 'Lease' ? 'Rental Asset' : 'Sale Listing'}
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{property.category}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${property.tier === PropertyTier.ESTATE_GUARD ? 'bg-slate-900 text-gold shadow-lg shadow-gold/10' : 'bg-slate-100 text-slate-500'}`}>
                {property.tier}
              </span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                property.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                property.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                'bg-slate-100 text-slate-500'
              }`}>
                {property.status}
              </span>
            </div>
            <h3 className="text-3xl font-luxury font-bold text-slate-900 leading-tight">{property.listing_details.address || 'Address Unspecified'}</h3>
            <p className="text-slate-500 text-sm flex items-center gap-2">
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
          <h4 className="font-black text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4">Market Narrative</h4>
          <p className="text-white/70 text-sm leading-relaxed italic border-l-4 pl-6 py-1" style={{ borderColor: 'var(--brand-primary)' }}>
            "{property.listing_details.hero_narrative || 'Market briefing currently in production.'}"
          </p>
        </div>

        {property.amenities && Object.values(property.amenities).some(v => !!v) && (
          <div>
            <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <i className="fa-solid fa-gem text-gold"></i> Exclusive Amenities
            </h4>
            <div className="flex flex-wrap gap-3">
               {[
                 { label: 'Pool', field: 'pool', icon: 'fa-water' },
                 { label: 'Garage', field: 'garage', icon: 'fa-car' },
                 { label: 'WiFi', field: 'wifi', icon: 'fa-wifi' },
                 { label: 'Laundry', field: 'laundry', icon: 'fa-soap' },
                 { label: 'Pets', field: 'pets_allowed', icon: 'fa-dog' },
                 { label: 'Gym', field: 'gym', icon: 'fa-dumbbell' },
                 { label: 'Security', field: 'security', icon: 'fa-shield-halved' }
               ].map(item => {
                 const val = (property.amenities as any)?.[item.field];
                 if (!val) return null;
                 return (
                   <div key={item.field} className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                      <i className={`fa-solid ${item.icon} text-gold text-xs`}></i>
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{item.label}</span>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {property.ai_training && Object.values(property.ai_training).some(v => !!v) && (
          <div>
            <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <i className="fa-solid fa-brain text-gold"></i> AI Precision Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { label: 'Waterfront', field: 'proximityWaterfront', icon: 'fa-water' },
                 { label: 'Commute', field: 'commuteTime', icon: 'fa-car' },
                 { label: 'Education', field: 'schools', icon: 'fa-school' },
                 { label: 'Medical', field: 'hospitals', icon: 'fa-hospital' },
                 { label: 'Essentials', field: 'supermarkets', icon: 'fa-cart-shopping' }
               ].map(item => {
                 const val = (property.ai_training as any)?.[item.field];
                 if (!val) return null;
                 return (
                   <div key={item.field} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                      <i className={`fa-solid ${item.icon} text-gold mt-1`}></i>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{item.label}</p>
                        <p className="text-[11px] font-medium text-slate-700 leading-tight">{val}</p>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-200 pt-8">
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
          className="flex-1 py-5 rounded-2xl font-bold text-sm shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-slate-950"
          style={{ backgroundColor: 'var(--brand-primary)', boxShadow: '0 20px 40px -10px rgba(var(--brand-primary-rgb), 0.3)' }}
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
