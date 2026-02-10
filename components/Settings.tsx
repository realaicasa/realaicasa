import React, { useState } from 'react';
import { AgentSettings } from '../types';

import { supabase } from '../services/supabaseClient';

interface SettingsProps {
  settings: AgentSettings;
  onUpdate: (s: AgentSettings) => void;
  onInjectPortfolio?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onInjectPortfolio }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("AUTHENTICATION REQUIRED: Please sign in to your EstateGuard account to synchronize your agency identity.");
        return;
      }

      const { error } = await supabase
        .from('app_config')
        .upsert({
          id: user.id,
          business_name: settings.businessName,
          primary_color: settings.primaryColor,
          api_key: settings.apiKey,
          high_security_mode: settings.highSecurityMode,
          monthly_price: settings.monthlyPrice,
          contact_email: settings.contactEmail,
          contact_phone: settings.contactPhone,
          specialties: settings.specialties,
          language: settings.language,
          terms_and_conditions: settings.termsAndConditions,
          privacy_policy: settings.privacyPolicy,
          nda: settings.nda,
          location_hours: settings.locationHours,
          service_areas: settings.serviceAreas,
          commission_rates: settings.commissionRates,
          marketing_strategy: settings.marketingStrategy,
          team_members: settings.teamMembers,
          awards: settings.awards,
          legal_disclaimer: settings.legalDisclaimer,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Sychronization failed. Verify your connection or re-authenticate.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="glass-panel rounded-[3rem] overflow-hidden">
        <div className="bg-[#05080f]/50 p-10 text-white flex justify-between items-center border-b border-white/10">
          <div>
            <h2 className="text-2xl font-luxury font-bold">Agency HQ</h2>
            <p className="text-white/40 text-sm mt-1">Whitelabel the concierge and PWA experience.</p>
          </div>
          <div className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950" style={{ backgroundColor: settings.primaryColor }}>
             Professional Tier
          </div>
        </div>
        
        <div className="p-10 space-y-12">
          {/* Identity Section */}
          <section>
            <h3 className="font-bold text-white mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-palette" style={{ color: settings.primaryColor }}></i> 
              Whitelabeling
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Agency Display Name</label>
                <input 
                  type="text" 
                  value={settings.businessName}
                  onChange={(e) => onUpdate({...settings, businessName: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 outline-none transition-all font-medium text-white"
                  style={{ '--tw-ring-color': settings.primaryColor } as any}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brand Primary Color</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => onUpdate({...settings, primaryColor: e.target.value})}
                    className="w-16 h-16 rounded-2xl border-0 cursor-pointer p-0 overflow-hidden shadow-sm hover:scale-105 transition-transform"
                  />
                  <div>
                    <p className="text-xs font-mono text-slate-400 font-bold uppercase">{settings.primaryColor}</p>
                    <p className="text-[10px] text-slate-400">Picks highlight colors</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interface Language</label>
                <select 
                  value={settings.language}
                  onChange={(e) => onUpdate({...settings, language: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm text-slate-700 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
                <p className="text-[10px] text-slate-400">Select the primary language for your agent interface.</p>
             </div>

            <div className="mt-8 space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Concierge Welcome Intro</label>
              <textarea 
                rows={2}
                value={settings.conciergeIntro}
                onChange={(e) => onUpdate({...settings, conciergeIntro: e.target.value})}
                placeholder="Ask our happy assistant about any of our properties 24/7"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm"
              />
              <p className="text-[10px] text-slate-400">This text appears above the chatbot bubble on your website.</p>
            </div>
          </section>

          {/* AI Provisioning Section */}
          <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
            <h3 className="font-bold text-white mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-microchip" style={{ color: settings.primaryColor }}></i> 
              AI Core Provisioning
            </h3>
            <div className="bg-black/20 p-8 rounded-2xl border border-white/5 shadow-sm">
                <p className="text-xs font-bold text-white/70 mb-2 uppercase tracking-tight">Gemini API Key</p>
                <p className="text-xs text-white/40 mb-6 leading-relaxed">
                   Your dedicated API key powers your specific agent's intelligence. No data is shared across agencies.
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" className="font-bold ml-1 hover:underline" style={{ color: settings.primaryColor }}>Get key here →</a>
                </p>
                <div className="relative">
                    <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-white/20"></i>
                    <input 
                        type="password" 
                        placeholder="Paste Gemini API Key..."
                        value={settings.apiKey}
                        onChange={(e) => onUpdate({...settings, apiKey: e.target.value})}
                        className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 outline-none text-sm font-mono text-white"
                        style={{ '--tw-ring-color': settings.primaryColor } as any}
                    />
                </div>
            </div>
          </section>

          {/* Business Knowledge Base Training (The 10 Boxes) */}
          <section>
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-brain text-gold"></i> 
              Knowledge Base Training
            </h3>
            <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
              Define your agency's proprietary intelligence. The AI concierge uses this data to answer complex visitor questions about your business operations and legal standards.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'Terms & Conditions', field: 'termsAndConditions', icon: 'fa-file-signature' },
                { label: 'Privacy Policy', field: 'privacyPolicy', icon: 'fa-user-lock' },
                { label: 'NDA Requirements', field: 'nda', icon: 'fa-handshake-slash' },
                { label: 'Location & Hours', field: 'locationHours', icon: 'fa-clock' },
                { label: 'Service Areas', field: 'serviceAreas', icon: 'fa-map-location-dot' },
                { label: 'Commission Rates', field: 'commissionRates', icon: 'fa-percent' },
                { label: 'Marketing Strategy', field: 'marketingStrategy', icon: 'fa-bullhorn' },
                { label: 'Team Members', field: 'teamMembers', icon: 'fa-users' },
                { label: 'Awards & Accolades', field: 'awards', icon: 'fa-trophy' },
                { label: 'Legal Disclaimer', field: 'legalDisclaimer', icon: 'fa-gavel' }
              ].map((item) => (
                <div key={item.field} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${item.icon} text-gold/60 text-xs`}></i>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</label>
                  </div>
                  <textarea 
                    rows={3}
                    value={(settings as any)[item.field] || ''}
                    onChange={(e) => onUpdate({...settings, [item.field]: e.target.value})}
                    placeholder={`Define your ${item.label.toLowerCase()}...`}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-xs leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="pt-10 border-t border-slate-100 flex justify-end items-center gap-6">
             {saveSuccess && (
                 <span className="text-emerald-600 text-sm font-bold animate-fade-in flex items-center gap-2">
                    <i className="fa-solid fa-circle-check"></i> Changes synchronized
                 </span>
             )}
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-12 py-4 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-50 text-slate-950"
                style={{ backgroundColor: settings.primaryColor }}
             >
                {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                {isSaving ? 'Synchronizing...' : 'Save All Changes'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;