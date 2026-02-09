import { PropertySchema, PropertyTier } from '../types';

export const STARTER_PORTFOLIO: PropertySchema[] = [
  {
    property_id: 'sample-res-1',
    category: 'Residential',
    transaction_type: 'Sale',
    status: 'Active',
    tier: PropertyTier.ESTATE_GUARD,
    visibility_protocol: {
      public_fields: ['address', 'price', 'bedrooms', 'bathrooms'],
      gated_fields: ['private_appraisal', 'seller_motivation', 'showing_instructions']
    },
    listing_details: {
      address: '742 Evergreen Terrace, Luxury Heights',
      price: 4250000,
      image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      key_stats: {
        bedrooms: 5,
        bathrooms: 4.5,
        sq_ft: 5200,
        lot_size: '0.75 Acres'
      },
      hero_narrative: 'An architectural masterpiece perched atop Luxury Heights, offering panoramic ocean views and bespoke finishes throughout.'
    },
    deep_data: {
      private_appraisal: { value: 4100000, date: '2026-01-15', notes: 'Stable appreciation expected.' },
      mechanical_specs: { hvac: 'Dual Zone High-Efficiency', smart_home: 'Fully Integrated Control4' }
    },
    agent_notes: {
      motivation: 'Relocating overseas, looking for a swift closing.',
      showing_instructions: '24-hour notice required. Listing agent must be present.'
    },
    amenities: {
      pool: true,
      garage: true,
      security: true,
      gym: true
    }
  },
  {
    property_id: 'sample-rent-1',
    category: 'Rental',
    transaction_type: 'Rent',
    status: 'Active',
    tier: PropertyTier.STANDARD,
    visibility_protocol: {
      public_fields: ['address', 'price', 'sq_ft'],
      gated_fields: ['lease_terms', 'deposit_requirements']
    },
    listing_details: {
      address: 'Emerald City Penthouse, Unit 4201',
      price: 12500, // Monthly
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      key_stats: {
        bedrooms: 2,
        bathrooms: 2,
        sq_ft: 1850,
        lot_size: 'N/A'
      },
      hero_narrative: 'Live in the clouds. This Emerald City penthouse features floor-to-ceiling windows and a private sky terrace.'
    },
    deep_data: {
      lease_terms: { duration: '12-24 Months', deposit: 25000, utilities: 'All Inclusive except Electric' }
    },
    agent_notes: {
      motivation: 'Owner looking for executive tenant.',
      showing_instructions: 'Concierge access with lockbox code 1234.'
    },
    amenities: {
      pool: true,
      wifi: true,
      laundry: true,
      security: true
    }
  },
  {
    property_id: 'sample-comm-1',
    category: 'Commercial',
    transaction_type: 'Lease',
    status: 'Active',
    tier: PropertyTier.ESTATE_GUARD,
    visibility_protocol: {
      public_fields: ['address', 'sq_ft', 'zoning'],
      gated_fields: ['commission_structure', 'current_tenants']
    },
    listing_details: {
      address: 'Tech Hub Plaza, Floor 12',
      price: 45, // Per sq ft
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      key_stats: {
        sq_ft: 12000,
        lot_size: 'N/A',
        zoning: 'Commercial - Mixed Use'
      },
      hero_narrative: 'Prime office space in the heart of the innovation district. Modern design with open collaboration zones.'
    },
    deep_data: {},
    agent_notes: {
      motivation: 'New development seeking anchor tenants.',
      showing_instructions: 'Available M-F 9am-5pm for walk-throughs.'
    },
    amenities: {
      wifi: true,
      gym: true,
      security: true
    }
  }
];
