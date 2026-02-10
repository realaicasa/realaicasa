import React, { useState, useEffect } from 'react';
import i18n from './i18n'; // Import i18n configuration
import Navigation from './components/Navigation';
import DashboardStats from './components/DashboardStats';
import PropertyCard from './components/PropertyCard';
import IngestionPortal from './components/IngestionPortal';
import AgentChat from './components/AgentChat';
import Modal from './components/Modal';
import Kanban from './components/Kanban';
import Settings from './components/Settings';
import PropertyDetails from './components/PropertyDetails';
import PropertyExhibit from './components/PropertyExhibit';
import Auth from './components/Auth';
import { supabase } from './services/supabaseClient';
import { PropertySchema, Lead, PropertyTier, AgentSettings, LeadStatus } from './types';

const INITIAL_SETTINGS: AgentSettings = {
  businessName: 'EstateGuard AI',
  primaryColor: '#d4af37',
  apiKey: '',
  highSecurityMode: true,
  subscriptionTier: 'Enterprise',
  monthlyPrice: 0,
  businessAddress: '77 Ocean Drive, Miami FL',
  contactEmail: 'hq@estateguard.ai',
  contactPhone: '+1 (800) ESTATE-AI',
  specialties: ['Luxury Waterfront', 'Commercial High-Rise', 'Exclusive Land'],
  agentCount: 12,
  conciergeIntro: 'Ask our happy assistant about any of our properties 24/7',
  language: 'en',
  termsAndConditions: '',
  privacyPolicy: '',
  nda: '',
  locationHours: '',
  serviceAreas: '',
  commissionRates: '',
  marketingStrategy: '',
  teamMembers: '',
  awards: '',
  legalDisclaimer: '',
  theme: 'dark'
};



const App: React.FC = () => {
  useEffect(() => {
    console.log("[EstateGuard-v1.1.8] App Component Mounted");
  }, []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState<AgentSettings>(INITIAL_SETTINGS);
  const [properties, setProperties] = useState<PropertySchema[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync language with settings
  useEffect(() => {
    i18n.changeLanguage(settings.language === 'en' ? 'en' : settings.language === 'es' ? 'es' : 'fr');
  }, [settings.language]);

  // Listen for Auth Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync theme and brand color to CSS Variables
  useEffect(() => {
    // 1. Theme sync
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    
    // 2. Brand color sync
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
      
      // Convert hex to RGB for alpha utilities
      const hex = settings.primaryColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`);
    }
  }, [settings.primaryColor, settings.theme]);

  // Fetch all data from Supabase whenever user changes
  useEffect(() => {
    if (!user) {
      // Clear data if logged out
      setProperties([]);
      setLeads([]);
      setSettings(INITIAL_SETTINGS);
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch Settings
        const { data: configData } = await supabase
          .from('app_config')
          .select('*')
          .eq('id', user.id)
          .single();

        if (configData) {
          setSettings({
            ...INITIAL_SETTINGS,
            businessName: configData.business_name || INITIAL_SETTINGS.businessName,
            primaryColor: configData.primary_color || INITIAL_SETTINGS.primaryColor,
            apiKey: configData.api_key || INITIAL_SETTINGS.apiKey,
            highSecurityMode: configData.high_security_mode ?? INITIAL_SETTINGS.highSecurityMode,
            contactEmail: configData.contact_email || INITIAL_SETTINGS.contactEmail,
            contactPhone: configData.contact_phone || INITIAL_SETTINGS.contactPhone,
            specialties: configData.specialties || INITIAL_SETTINGS.specialties,
            language: configData.language || INITIAL_SETTINGS.language,
            termsAndConditions: configData.terms_and_conditions,
            privacyPolicy: configData.privacy_policy,
            nda: configData.nda,
            locationHours: configData.location_hours,
            serviceAreas: configData.service_areas,
            commissionRates: configData.commission_rates,
            marketingStrategy: configData.marketing_strategy,
            teamMembers: configData.team_members,
            awards: configData.awards,
            legalDisclaimer: configData.legal_disclaimer,
            theme: configData.theme || 'dark'
          });
        }

        // 2. Fetch Properties
        const { data: propData } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', user.id);
        
        if (propData) {
          setProperties(propData.map((p: any) => ({
              ...(p.data || {}),
              property_id: p.property_id,
              user_id: p.user_id
          })));
        }

        // 3. Fetch Leads
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (leadData) {
          setLeads(leadData.map((l: any) => ({
              id: l.id,
              name: l.name,
              phone: l.phone,
              email: l.email,
              financing_status: l.financing_status || 'Unverified',
              property_id: l.property_id,
              property_address: l.property_address,
              status: l.status,
              timestamp: l.created_at,
              notes: l.notes || [],
              agent_notes: l.agent_notes || "",
              due_date: l.due_date || null,
              priority_score: l.priority_score || 0,
              conversation_history: l.conversation_history || [],
              notes_log: l.notes_log || []
          })));
        }
      } catch (error) {
        console.error('Core Sync Error:', error);
      }
    };
    fetchData();
  }, [user]);

  // Derive selected property from state to ensure updates reflect immediately in the modal
  const selectedProperty = properties.find(p => p.property_id === selectedPropertyId) || null;

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    
    try {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error("Failed to update lead status:", e);
    }
  };

  const handleUpdateLead = async (updated: Lead) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    
    try {
        const { error } = await supabase
            .from('leads')
            .update({ 
                due_date: updated.due_date || null,
                notes: updated.notes,
                agent_notes: updated.agent_notes,
                priority_score: updated.priority_score,
                notes_log: updated.notes_log,
                status: updated.status,
                conversation_history: updated.conversation_history
            })
            .eq('id', updated.id);
        if (error) throw error;
    } catch (e) {
        console.error("Failed to update lead:", e);
    }
  };

  const handleUpdateProperty = async (p: PropertySchema) => {
    // Optimistic Update
    setProperties(prev => prev.map(item => item.property_id === p.property_id ? p : item));
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('properties')
            .upsert({
                property_id: p.property_id,
                user_id: user.id,
                address: p.listing_details?.address || '',
                price: p.listing_details?.price || 0,
                status: p.status || 'Active',
                data: p,
                amenities: p.amenities || {},
                ai_training: p.ai_training || {},
                deep_data: p.deep_data || {},
                seo: p.seo || {},
                updated_at: new Date().toISOString()
            });
        if (error) throw error;
    } catch (e) {
        console.error("Failed to update property:", e);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    setProperties(prev => prev.filter(p => p.property_id !== propertyId));
    setIsDetailsOpen(false);

    try {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('property_id', propertyId);
        if (error) throw error;
    } catch (e) {
        console.error("Failed to delete property:", e);
    }
  };

  const handleInjectPortfolio = async () => {
    const { STARTER_PORTFOLIO } = await import('./src/starterPortfolio');
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Authentication required to inject portfolio.");
      return;
    }

    try {
      setLoading(true);
      
      const propertiesWithUserId = STARTER_PORTFOLIO.map(p => ({
        ...p,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }));

      for (const p of propertiesWithUserId) {
        const { error } = await supabase
          .from('properties')
          .upsert({
            property_id: p.property_id,
            user_id: p.user_id,
            address: p.listing_details?.address || '',
            price: p.listing_details?.price || 0,
            status: p.status || 'Active',
            data: p,
            updated_at: p.updated_at
          });
        if (error) throw error;
      }

      // Refresh properties list
      const { data: propData } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id);
      
      if (propData) {
        setProperties(propData.map((p: any) => ({
            ...(p.data || {}),
            property_id: p.property_id,
            user_id: p.user_id
        })));
      }

      alert("SUCCESS: Starter Portfolio injected successfully! Your secure asset cloud is now populated with elite sample data.");
    } catch (e: any) {
      console.error("Failed to inject portfolio:", e);
      const errorMsg = e.message || "Unknown error";
      alert(`CRITICAL ERROR: Portfolio injection failed. [Reason: ${errorMsg}]. Please ensure your database connection is active.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureLead = async (leadPart: Partial<Lead>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newLead: Lead = {
        id: crypto.randomUUID(),
        name: leadPart.name || "New Prospect",
        phone: leadPart.phone || "N/A",
        email: leadPart.email || "",
        financing_status: leadPart.financing_status || 'Unverified',
        property_id: leadPart.property_id || "General",
        property_address: leadPart.property_address || "N/A",
        status: 'New',
        timestamp: new Date().toISOString(),
        notes: leadPart.notes || [],
        conversation_history: leadPart.conversation_history || [],
        agent_notes: leadPart.agent_notes || "",
        due_date: leadPart.due_date || null,
        priority_score: leadPart.priority_score || 0,
        notes_log: leadPart.notes_log || []
      };

      // Optimistic Update
      setLeads(prev => [newLead, ...prev]);
      setNotifications(prev => prev + 1);

      // Persist to Supabase
      const { error } = await supabase
        .from('leads')
        .insert({
          id: newLead.id,
          user_id: user.id,
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email,
          financing_status: newLead.financing_status, 
          property_id: newLead.property_id,
          property_address: newLead.property_address,
          status: newLead.status,
          created_at: newLead.timestamp,
          notes: newLead.notes || [],
          agent_notes: newLead.agent_notes || "",
          due_date: newLead.due_date,
          priority_score: newLead.priority_score || 0, 
          notes_log: newLead.notes_log || [] 
        });

      if (error) {
        console.error("[EstateGuard-v1.1.8] Raw Supabase Error:", error);
        throw new Error(`${error.message} (Code: ${error.code})${error.hint ? ' - Hint: ' + error.hint : ''}`);
      }
      
      console.log("Lead captured and synced to cloud hub.");
    } catch (e: any) {
      console.error("[EstateGuard-v1.1.8] Lead Sync Error:", e);
      const errorMsg = e.message || "Unknown connectivity issue";
      alert(`SECURITY ALERT: Lead capture synchronization failed.\n\n[Reason: ${errorMsg}]\n\nAction: Verify your Supabase service status and RLS policies.`);
    }
  };

  const handleIngestedProperty = async (p: PropertySchema) => {
    // 1. Add to local state
    setProperties(prev => [p, ...prev]);
    setActiveTab('properties');

    // 2. Persist to Supabase immediately
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('properties')
        .upsert({
          property_id: p.property_id,
          user_id: user.id,
          address: p.listing_details?.address || '',
          price: p.listing_details?.price || 0,
          status: p.status || 'Active',
          data: p
        });

      if (error) throw error;
      console.log("[EstateGuard-v1.1.8] Ingested asset successfully vaulted in cloud.");
    } catch (e: any) {
      console.error("[EstateGuard-v1.1.8] Auto-Vault Failure:", e);
      alert(`VAULTING FAILURE: Asset created in memory but failed to sync with the cloud. [Reason: ${e.message}]. Please save manually or check connection.`);
    }
  };

  const updateProperty = (updated: PropertySchema) => {
    setProperties(prev => prev.map(p => p.property_id === updated.property_id ? updated : p));
  };

  const showFooterModal = (type: string) => {
    switch(type) {
      case 'manual':
        setModalContent({
          title: 'Agent Operating Manual',
          content: (
            <div className="space-y-6 text-sm">
              <section>
                <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">1. Property Ingestion</h4>
                <p>Use the <b>Ingest</b> tab to onboard new assets. Structure residential, commercial, or land listings instantly via Gemini AI.</p>
              </section>
              <section>
                <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">2. Concierge Deployment</h4>
                <p>Navigate to the <b>Concierge</b> tab to find your unique website embed code. This places the AI chatbot on your agency site.</p>
              </section>
              <section>
                <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">3. The Two-Strike Rule</h4>
                <p>The bot is programmed to answer two specific questions about any property. Upon the third, it will pivot to secure lead capture.</p>
              </section>
            </div>
          )
        });
        break;
      case 'privacy':
        setModalContent({
          title: 'Privacy & Sovereignty',
          content: (
            <div className="space-y-4 text-sm">
              <p>EstateGuard utilizes <b>Zero-Trust</b> architecture. Your property data and lead transcripts are your agency's private assets.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><b>Encryption:</b> AES-256 standard at rest.</li>
                <li><b>Model Sovereignty:</b> Your data is NOT used to train global models.</li>
              </ul>
            </div>
          )
        });
        break;
      case 'terms':
        setModalContent({
          title: 'Terms of Engagement',
          content: (
            <div className="space-y-4 text-sm">
              <p>Usage of the EstateGuard AI platform requires compliance with local property disclosure regulations and maintenance of a valid personal Gemini API Key.</p>
            </div>
          )
        });
        break;
      case 'legal':
        setModalContent({
          title: 'Legal Disclaimer',
          content: (
            <div className="space-y-4 text-sm border-l-4 border-gold pl-4 italic">
              <p>RealAi EstateGuard is an AI-driven facilitation tool. All outputs must be verified by a licensed professional.</p>
              <p>© 2026 EstateGuard AI.</p>
            </div>
          )
        });
        break;
    }
  };

  const agencySlug = settings.businessName.toLowerCase().replace(/\s+/g, '-');
  const embedCode = `<script \n  src="https://app.estateguard.ai/widget.js" \n  data-agent-id="${agencySlug}" \n  data-theme="gold" \n  async>\n</script>`;

  const isWidgetView = new URLSearchParams(window.location.search).get('view') === 'widget';

  if (isWidgetView) {
    return (
      <div className="bg-transparent p-6 min-h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => (
            <PropertyExhibit 
              key={p.property_id} 
              property={p} 
              onSelect={() => window.open(`${window.location.origin}/?property=${p.property_id}`, '_blank')}
            />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080f] flex items-center justify-center relative overflow-hidden">
        {/* Luxury background ambient light */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: settings.primaryColor }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10" style={{ backgroundColor: settings.primaryColor }}></div>
        
        <div className="flex flex-col items-center gap-6 relative z-10 glass-panel p-12 rounded-[3rem]">
          <i className="fa-solid fa-shield-halved text-5xl animate-float" style={{ color: settings.primaryColor }}></i>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50">Protecting Asset Sovereignty...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden flex-col md:flex-row text-[var(--text-main)]">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} brandColor={settings.primaryColor} />

      <main className="flex-1 overflow-y-auto main-content no-scrollbar flex flex-col">
        {/* PWA Install Notification - Focused on Mobile Instructions */}
        <div className="fixed top-6 right-8 z-[60] hidden md:block">
           <div className="pwa-install-pill" onClick={() => setModalContent({title: 'Elite Agent Dashboard Installation', content: <div className="text-center p-4">
               <div className="bg-slate-950 p-10 rounded-[2.5rem] mb-8 border border-gold/20 shadow-2xl">
                  <i className="fa-solid fa-mobile-screen text-6xl text-gold mb-4"></i>
                  <p className="font-luxury text-2xl font-bold text-white tracking-wide">Mobile Access Setup</p>
                  <p className="text-sm text-slate-400 mt-2 tracking-tight font-medium uppercase">Native Agent Performance</p>
               </div>
               
               <div className="space-y-6 text-left">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1 bg-gold"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <i className="fa-brands fa-apple text-slate-900"></i> iOS (iPhone / iPad)
                    </p>
                    <ol className="text-xs text-slate-700 leading-relaxed font-semibold space-y-2">
                      <li>1. Open this page in <b>Safari</b>.</li>
                      <li>2. Tap the <b>'Share'</b> button <i className="fa-solid fa-arrow-up-from-bracket text-gold mx-1"></i> (square with arrow).</li>
                      <li>3. Scroll down and tap <b>'Add to Home Screen'</b>.</li>
                      <li>4. Open the <b>EstateGuard</b> app icon from your home screen.</li>
                    </ol>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-slate-900"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <i className="fa-brands fa-android text-emerald-500"></i> Android (Chrome)
                    </p>
                    <ol className="text-xs text-slate-700 leading-relaxed font-semibold space-y-2">
                      <li>1. Tap the <b>'Menu'</b> <i className="fa-solid fa-ellipsis-vertical mx-1"></i> icon (3 dots) top right.</li>
                      <li>2. Select <b>'Install App'</b> or <b>'Add to Home Screen'</b>.</li>
                      <li>3. Confirm the installation and find it in your drawer.</li>
                    </ol>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-sm text-white">
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <i className="fa-solid fa-laptop text-gold"></i> Desktop (Chrome / Edge)
                    </p>
                    <p className="text-xs leading-relaxed font-medium">Click the <b>Install</b> icon <i className="fa-solid fa-download mx-1 text-gold"></i> located at the far right of your address bar.</p>
                  </div>
               </div>
           </div>})}>
              <div className="text-left pr-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">COMMAND CENTER</p>
                <p className="text-sm text-white font-bold leading-none">Install Studio</p>
              </div>
              <div className="pwa-icon-box shadow-xl shadow-gold/20">
                 <i className="fa-solid fa-mobile-screen"></i>
              </div>
           </div>
        </div>

        <div className="p-4 md:p-10 flex-1">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{settings.businessName}</span>
                {notifications > 0 && (
                    <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-red-500/30 animate-in zoom-in">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        {notifications} PRIORITY LEADS
                    </div>
                )}
              </div>
              <h2 className="text-4xl font-luxury font-bold text-slate-950">
                {activeTab === 'dashboard' && 'Market Command'}
                {activeTab === 'properties' && 'Portfolio Control'}
                {activeTab === 'leads' && 'Pipeline Management'}
                {activeTab === 'settings' && 'Identity & Branding'}
                {activeTab === 'chat' && 'Concierge Deployment'}
                {activeTab === 'ingestion' && 'Asset Onboarding'}
              </h2>
            </div>
          </header>

          <div className="pb-20">
            {activeTab === 'dashboard' && <DashboardStats properties={properties} leads={leads} />}
            {activeTab === 'properties' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {properties.map((p, idx) => (
                        <div key={p.property_id} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                          <PropertyCard 
                            property={p} 
                            onSelect={(p) => { 
                              setSelectedPropertyId(p.property_id); 
                              setIsDetailsOpen(true); 
                            }} 
                          />
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'leads' && <Kanban leads={leads} onStatusChange={handleStatusChange} onUpdateLead={handleUpdateLead} onAddLead={handleCaptureLead} />}
            {activeTab === 'ingestion' && <IngestionPortal settings={settings} onPropertyAdded={handleIngestedProperty} />}
            {activeTab === 'settings' && <Settings settings={settings} onUpdate={setSettings} onInjectPortfolio={handleInjectPortfolio} />}
            {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-12">
                        <div className="bg-slate-950 p-12 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                               <i className="fa-solid fa-code text-[10rem]"></i>
                            </div>
                            <h3 className="text-2xl font-luxury font-bold mb-6 flex items-center gap-3">
                                <i className="fa-solid fa-rocket text-gold"></i>
                                Deployment Sync
                            </h3>
                            <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-lg font-medium">
                                Embed your proprietary concierge instance. This snippet synchronizes visitor enquiries directly with your lead pipeline.
                            </p>
                            <div className="bg-slate-900/80 p-8 rounded-[1.5rem] font-mono text-xs text-gold border border-gold/10 break-all select-all mb-8 shadow-inner relative">
                                <div className="absolute top-4 right-4 text-[10px] font-black text-slate-800 uppercase tracking-widest bg-gold/10 px-2 py-1 rounded">Active Endpoint</div>
                                {embedCode}
                            </div>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(embedCode); alert("Snippet copied to secure clipboard."); }}
                                className="gold-button px-12 py-5 rounded-2xl font-bold text-sm shadow-2xl transition-transform active:scale-95"
                            >
                                <i className="fa-solid fa-copy mr-2"></i> Copy Snippet
                            </button>
                        </div>
                        
                        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                               <i className="fa-solid fa-rectangle-list text-[10rem]"></i>
                             </div>
                             <h3 className="text-2xl font-luxury font-bold mb-6 flex items-center gap-3">
                                <i className="fa-solid fa-layer-group text-gold"></i>
                                Portfolio Exhibit
                            </h3>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-lg font-medium">
                                Embed your live property portfolio. This widget automatically synchronizes with your PWA data and includes built-in SEO optimization.
                            </p>
                            <div className="bg-slate-50 p-8 rounded-[1.5rem] font-mono text-xs text-slate-600 border border-slate-200 break-all select-all mb-8 shadow-inner">
                                {`<iframe src="${window.location.origin}/?view=widget" width="100%" height="800px" frameborder="0"></iframe>`}
                            </div>
                            <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(`<iframe src="${window.location.origin}/?view=widget" width="100%" height="800px" frameborder="0"></iframe>`); 
                                  alert("Widget snippet copied to secure clipboard."); 
                                }}
                                className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-bold text-sm shadow-2xl transition-transform active:scale-95"
                            >
                                <i className="fa-solid fa-code mr-2"></i> Copy Widget Code
                            </button>
                        </div>

                        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                             <h3 className="text-2xl font-luxury font-bold mb-10 flex items-center gap-4">
                                <i className="fa-solid fa-shield-halved text-gold"></i>
                                Intelligence Guard
                            </h3>
                            <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-200">
                                <div className="flex items-center justify-between gap-10">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-950 text-xl flex items-center gap-3">
                                           Estate Guard Protocol
                                           <span className={`text-[10px] px-3 py-1 rounded-full font-black ${settings.highSecurityMode ? 'bg-gold/20 text-gold shadow-lg shadow-gold/10' : 'bg-slate-200 text-slate-500'}`}>
                                              {settings.highSecurityMode ? 'SECURE' : 'OPEN'}
                                           </span>
                                        </p>
                                        <p className="text-sm text-slate-600 mt-4 leading-relaxed font-medium">
                                           When active, the AI concierge will gate sensitive specifics (appraisals, notes) until lead qualification is verified.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({...settings, highSecurityMode: !settings.highSecurityMode})}
                                        className={`flex-shrink-0 w-24 h-12 rounded-full transition-all duration-500 relative border-2 ${settings.highSecurityMode ? 'bg-gold border-gold shadow-2xl shadow-gold/30' : 'bg-slate-300 border-slate-300 shadow-inner'}`}
                                    >
                                        <div className={`absolute top-1 w-10 h-10 bg-white rounded-full shadow-xl transition-transform duration-500 ease-in-out ${settings.highSecurityMode ? 'translate-x-12' : 'translate-x-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-5">
                        <div className="sticky top-10">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
                              Concierge Sandbox
                           </p>
                           <AgentChat 
                               property={selectedProperty || properties[0]} 
                               onLeadCaptured={handleCaptureLead} 
                               settings={settings}
                           />
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        <footer className="mt-auto px-10 py-16 bg-slate-950 text-slate-600 text-[11px] font-bold border-t border-white/5 uppercase tracking-[0.2em]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-wrap justify-center gap-12">
              <button onClick={() => showFooterModal('manual')} className="hover:text-gold transition-colors">Operating Manual</button>
              <button onClick={() => showFooterModal('privacy')} className="hover:text-gold transition-colors">Privacy Cloud</button>
              <button onClick={() => showFooterModal('terms')} className="hover:text-gold transition-colors">Terms</button>
              <button onClick={() => showFooterModal('legal')} className="hover:text-gold transition-colors">Legal Sovereignty</button>
            </div>
            <p className="text-gold font-luxury text-base lowercase normal-case italic tracking-tight opacity-60">EstateGuard AI — Synchronized Intelligence</p>
          </div>
        </footer>
      </main>

      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={modalContent?.title || ''}>
        {modalContent?.content}
      </Modal>

      <Modal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        title="Asset Intelligence Hub"
      >
        {selectedProperty && (
          <PropertyDetails 
            property={selectedProperty} 
            onUpdate={handleUpdateProperty}
            onDelete={() => handleDeleteProperty(selectedProperty.property_id)}
            onTest={() => {
              setIsDetailsOpen(false);
              setActiveTab('chat');
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default App;