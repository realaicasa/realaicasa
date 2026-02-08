import React from 'react';
import { PropertySchema } from '../types';

interface PropertyExhibitProps {
  property: PropertySchema;
  onSelect?: () => void;
}

const PropertyExhibit: React.FC<PropertyExhibitProps> = ({ property, onSelect }) => {
  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 group cursor-pointer hover:shadow-2xl transition-all duration-500"
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img 
          src={property.listing_details.image_url || `https://picsum.photos/seed/${property.property_id}/800/600`} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          alt={property.listing_details.address}
        />
        <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-gold px-3 py-1 rounded-full text-[10px] font-bold shadow-lg border border-gold/20 uppercase tracking-tighter">
          {property.transaction_type}
        </div>
        {property.tier === 'Estate Guard' && (
          <div className="absolute bottom-4 left-4 bg-gold text-slate-950 px-3 py-1 rounded-full text-[10px] font-black shadow-lg uppercase tracking-tighter">
            Estate Guard Protected
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-luxury font-bold text-slate-900 group-hover:text-gold transition-colors truncate">
            {property.listing_details.address}
          </h3>
          <p className="text-2xl font-bold text-slate-950 mt-1">
            {property.listing_details.price > 0 
              ? `$${property.listing_details.price.toLocaleString()}` 
              : 'Contact for Pricing'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {property.amenities?.pool && <i className="fa-solid fa-water text-gold text-xs" title="Pool"></i>}
          {property.amenities?.garage && <i className="fa-solid fa-car text-gold text-xs" title="Garage"></i>}
          {property.amenities?.wifi && <i className="fa-solid fa-wifi text-gold text-xs" title="WiFi"></i>}
          {property.amenities?.pets_allowed && <i className="fa-solid fa-dog text-gold text-xs" title="Pets"></i>}
          {property.amenities?.gym && <i className="fa-solid fa-dumbbell text-gold text-xs" title="Gym"></i>}
          {property.amenities?.security && <i className="fa-solid fa-shield-halved text-gold text-xs" title="Security"></i>}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
             <i className="fa-solid fa-bed"></i> {property.listing_details.key_stats.bedrooms || '-'}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
             <i className="fa-solid fa-bath"></i> {property.listing_details.key_stats.bathrooms || '-'}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
             <i className="fa-solid fa-maximize"></i> {property.listing_details.key_stats.sq_ft.toLocaleString()} FT²
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyExhibit;
