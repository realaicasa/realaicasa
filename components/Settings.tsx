import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentSettings } from '../types';

import { supabase } from '../services/supabaseClient';

interface SettingsProps {
  settings: AgentSettings;
  onUpdate: (s: AgentSettings) => void;
  onInjectPortfolio?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onInjectPortfolio }) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert(t('settings.alerts.auth_required', { defaultValue: "AUTHENTICATION REQUIRED: Please sign in to your EstateGuard account to synchronize your agency identity." }));
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
          training_enhancements: settings.trainingEnhancements,
          theme: settings.theme,
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
        <div className="bg-[var(--glass-bg)] p-10 text-[var(--text-main)] flex justify-between items-center border-b border-[var(--glass-border)]">
          <div>
            <h2 className="text-2xl font-luxury font-bold">{t('settings.agency_hq')}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">{t('settings.agency_hq_desc')}</p>
          </div>
          <div className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950" style={{ backgroundColor: settings.primaryColor }}>
             {t('settings.pro_tier')}
          </div>
        </div>
        
        <div className="p-10 space-y-12">
          {/* Identity Section */}
          <section>
            <h3 className="font-bold text-[var(--text-main)] mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-palette" style={{ color: settings.primaryColor }}></i> 
              {t('settings.whitelabeling')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('settings.labels.agency_name')}</label>
                <input 
                  type="text" 
                  value={settings.businessName}
                  onChange={(e) => onUpdate({...settings, businessName: e.target.value})}
                  className="w-full px-5 py-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl focus:ring-2 outline-none transition-all font-medium text-[var(--text-main)]"
                  style={{ '--tw-ring-color': settings.primaryColor } as any}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('settings.labels.brand_color')}</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => onUpdate({...settings, primaryColor: e.target.value})}
                    className="w-16 h-16 rounded-2xl border-0 cursor-pointer p-0 overflow-hidden shadow-sm hover:scale-105 transition-transform"
                  />
                  <div>
                    <p className="text-xs font-mono text-[var(--text-muted)] font-bold uppercase">{settings.primaryColor}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{t('settings.hints.color')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[var(--glass-border)] pt-8">
              <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('settings.labels.language')}</label>
                  <select 
                    value={settings.language}
                    onChange={(e) => onUpdate({...settings, language: e.target.value})}
                    className="w-full px-5 py-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl focus:ring-2 outline-none transition-all font-medium text-sm text-[var(--text-main)] cursor-pointer"
                    style={{ '--tw-ring-color': settings.primaryColor } as any}
                  >
                    <option value="en" className="bg-[var(--bg-main)]">English</option>
                    <option value="es" className="bg-[var(--bg-main)]">Spanish</option>
                    <option value="fr" className="bg-[var(--bg-main)]">French</option>
                  </select>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('settings.labels.display_mode')}</label>
                  <div className="flex bg-[var(--glass-bg)] p-1 rounded-2xl border border-[var(--glass-border)]">
                      <button 
                        onClick={() => onUpdate({...settings, theme: 'dark'})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.theme === 'dark' ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                      >
                        {t('settings.themes.dark')}
                      </button>
                      <button 
                        onClick={() => onUpdate({...settings, theme: 'light'})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.theme === 'light' ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                      >
                        {t('settings.themes.light')}
                      </button>
                  </div>
               </div>
            </div>

            <div className="mt-8 space-y-3">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('settings.labels.concierge_intro')}</label>
              <textarea 
                rows={2}
                value={settings.conciergeIntro}
                onChange={(e) => onUpdate({...settings, conciergeIntro: e.target.value})}
                placeholder="Ask our happy assistant about any of our properties 24/7"
                className="w-full px-5 py-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl focus:ring-2 outline-none transition-all font-medium text-sm text-[var(--text-main)]"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
              />
              <p className="text-[10px] text-[var(--text-muted)]">{t('settings.hints.intro')}</p>
            </div>
          </section>

          {/* AI Provisioning Section */}
          <section className="bg-[var(--glass-bg)] p-10 rounded-[3rem] border border-[var(--glass-border)]">
            <h3 className="font-bold text-[var(--text-main)] mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-microchip" style={{ color: settings.primaryColor }}></i> 
              {t('settings.ai_provisioning')}
            </h3>
            <div className="bg-[var(--glass-bg)] p-8 rounded-2xl border border-[var(--glass-border)] shadow-sm">
                <p className="text-xs font-bold text-[var(--text-main)] mb-2 uppercase tracking-tight">{t('settings.labels.api_key')}</p>
                <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                   {t('settings.api_key_desc')}
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" className="font-bold ml-1 hover:underline" style={{ color: settings.primaryColor }}>{t('settings.get_key')} →</a>
                </p>
                <div className="relative">
                    <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
                    <input 
                        type="password" 
                        placeholder="Paste Gemini API Key..."
                        value={settings.apiKey}
                        onChange={(e) => onUpdate({...settings, apiKey: e.target.value})}
                        className="w-full pl-12 pr-5 py-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl focus:ring-2 outline-none text-sm font-mono text-[var(--text-main)]"
                        style={{ '--tw-ring-color': settings.primaryColor } as any}
                    />
                </div>
            </div>

            {onInjectPortfolio && (
              <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-between gap-6 p-6 bg-gold/5 rounded-2xl border border-gold/20">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-main)] mb-1">{t('settings.portfolio_sync')}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t('settings.portfolio_sync_desc')}</p>
                  </div>
                  <button 
                    onClick={onInjectPortfolio}
                    className="px-6 py-3 rounded-xl bg-gold text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    {t('settings.inject_button')}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Business Knowledge Base Training (The 10 Boxes) */}
          <section>
            <h3 className="font-bold text-[var(--text-main)] mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-brain text-gold"></i> 
              {t('settings.knowledge_base')}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-8 max-w-2xl leading-relaxed">
              {t('settings.knowledge_base_desc')}
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
                { label: 'Legal Disclaimer', field: 'legalDisclaimer', icon: 'fa-gavel' },
                { label: 'Continuous Training Enhancements', field: 'trainingEnhancements', icon: 'fa-wand-magic-sparkles' }
              ].map((item) => (
                <div key={item.field} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${item.icon} text-[var(--gold)]/60 text-xs`}></i>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.label}</label>
                  </div>
                  <textarea 
                    rows={3}
                    value={(settings as any)[item.field] || ''}
                    onChange={(e) => onUpdate({...settings, [item.field]: e.target.value})}
                    placeholder={`Define your ${item.label.toLowerCase()}...`}
                    className="w-full px-5 py-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl focus:ring-2 outline-none transition-all font-medium text-xs leading-relaxed text-[var(--text-main)]"
                    style={{ '--tw-ring-color': settings.primaryColor } as any}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="pt-10 border-t border-slate-100 flex justify-end items-center gap-6">
             {saveSuccess && (
                 <span className="text-emerald-600 text-sm font-bold animate-fade-in flex items-center gap-2">
                    <i className="fa-solid fa-circle-check"></i> {t('settings.status.synced')}
                 </span>
             )}
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-12 py-4 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-50 text-slate-950"
                style={{ backgroundColor: settings.primaryColor }}
             >
                {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                {isSaving ? t('settings.status.syncing') : t('settings.save_button')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;