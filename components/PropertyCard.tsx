import React from 'react';
import { PropertySchema, PropertyTier } from '../types';

interface PropertyCardProps {
  property: PropertySchema;
  onSelect: (p: PropertySchema) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect }) => {
  const isEstateGuard = property.tier === PropertyTier.ESTATE_GUARD;
  const hasVideo = !!property.listing_details.video_tour_url;

  return (
    <div 
      onClick={() => onSelect(property)}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-gold/10 transition-all duration-500 cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={`https://picsum.photos/seed/${property.property_id}/600/400`} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          alt="Property" 
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
              property.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-gold text-slate-900'
            }`}>
              {property.status}
            </span>
            {isEstateGuard && (
              <span className="bg-slate-950/90 backdrop-blur-md text-gold px-4 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 border border-gold/30">
                <i className="fa-solid fa-shield-halved"></i> ESTATE GUARD
              </span>
            )}
          </div>
          {hasVideo && (
            <span className="bg-white/95 text-slate-900 px-3 py-1 rounded-lg text-[9px] font-bold self-start shadow-sm border border-slate-200">
              <i className="fa-solid fa-circle-play mr-1 text-gold"></i> VIDEO TOUR
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
            <span className="text-[9px] font-bold text-gold uppercase tracking-[0.2em]">{property.category}</span>
            <h4 className="font-luxury font-bold text-slate-900 text-lg line-clamp-1 mt-1">{property.listing_details.address}</h4>
        </div>
        
        <div className="flex items-center gap-4 text-slate-500 text-xs font-bold mb-4">
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-bed text-gold"></i> {property.listing_details.key_stats.bedrooms || '-'}</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-bath text-gold"></i> {property.listing_details.key_stats.bathrooms || '-'}</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-maximize text-gold"></i> {property.listing_details.key_stats.sq_ft.toLocaleString()}</span>
        </div>
        
        <p className="text-slate-600 text-xs line-clamp-2 italic mb-6 leading-relaxed">
          "{property.listing_details.hero_narrative}"
        </p>
        
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {property.visibility_protocol.gated_fields.slice(0, 3).map((field, idx) => (
            <span key={idx} className="bg-slate-50 text-slate-400 border border-slate-100 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-tighter">
              <i className="fa-solid fa-lock mr-1 scale-75 opacity-50"></i> {field.replace(/_/g, ' ')}
            </span>
          ))}
          {property.visibility_protocol.gated_fields.length > 3 && (
              <span className="text-[8px] text-slate-300 font-bold ml-1">+{property.visibility_protocol.gated_fields.length - 3} MORE</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;