export enum PropertyTier {
  STANDARD = 'Standard',
  ESTATE_GUARD = 'Estate Guard'
}

export type PropertyCategory = 'Residential' | 'Commercial' | 'Land' | 'Rental';
export type TransactionType = 'Sale' | 'Rent' | 'Lease';

export interface PropertySchema {
  property_id: string;
  user_id?: string;
  category: PropertyCategory;
  transaction_type: TransactionType;
  status: 'Active' | 'Pending' | 'Sold' | 'Rented';
  tier: PropertyTier;
  visibility_protocol: {
    public_fields: string[];
    gated_fields: string[];
  };
  listing_details: {
    address: string;
    price: number;
    image_url?: string;
    video_tour_url?: string;
    key_stats: {
      bedrooms?: number;
      bathrooms?: number;
      sq_ft: number;
      lot_size: string;
      zoning?: string;
      topography?: string;
      utilities_available?: string[];
      access_type?: string;
      cap_rate?: number;
      occupancy_pct?: number;
      annual_revenue?: number;
    };
    hero_narrative: string;
  };
  deep_data: {
    private_appraisal?: { value: number; date: string; notes: string; };
    hoa_details?: { fee_monthly: number; rent_policy: string; security: string; };
    lease_terms?: { duration: string; deposit: number; utilities: string; };
    mechanical_specs?: { hvac: string; smart_home: string; };
  };
  agent_notes: {
    motivation: string;
    showing_instructions: string;
  };
  ai_training?: {
    proximityWaterfront?: string;
    commuteTime?: string;
    schools?: string;
    hospitals?: string;
    supermarkets?: string;
    neighborhood_vibe?: string;
    investment_potential?: string;
    agent_insider_tips?: string;
  };
  amenities?: {
    pool?: boolean;
    garage?: boolean;
    wifi?: boolean;
    laundry?: boolean;
    pets_allowed?: boolean;
    gym?: boolean;
    security?: boolean;
  };
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

export type LeadStatus = string;

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  financing_status: 'Cash' | 'Lender' | 'Unverified';
  property_id: string;
  property_address?: string;
  status: string; // 'new', 'contacted', 'qualified', 'hot', 'closed'
  metadata?: {
    intent?: string;
    has_funds?: boolean;
    nda_signed?: boolean;
    qualification_log?: string[];
  };
  created_at?: string;
  due_date?: string;
  notes: string[];
  conversation_history?: { role: string; content: string; timestamp: string; }[];
  agent_notes?: string;
  notes_log?: { text: string; timestamp: string; agent_name?: string; }[];
  priority_score?: number;
}

export interface AgentSettings {
  businessName: string;
  logoUrl?: string;
  primaryColor: string;
  apiKey: string;
  highSecurityMode: boolean; 
  subscriptionTier: string;
  monthlyPrice: number;
  businessAddress: string;
  contactEmail: string;
  contactPhone: string;
  specialties: string[];
  agentCount: number;
  conciergeIntro: string;
  language: string;
  theme: 'light' | 'dark';
  // Business Knowledge Base
  termsAndConditions?: string;
  privacyPolicy?: string;
  nda?: string;
  locationHours?: string;
  serviceAreas?: string;
  commissionRates?: string;
  marketingStrategy?: string;
  teamMembers?: string;
  awards?: string;
  legalDisclaimer?: string;
  trainingEnhancements?: string;
  leadAlertSound?: boolean;
  leadAlertVibration?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}