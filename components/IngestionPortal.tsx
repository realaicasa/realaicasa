
import React, { useState, useRef } from 'react';
import { parsePropertyData, transcribeAudio } from '../services/geminiService';
import { PropertySchema, AgentSettings } from '../types';

interface IngestionPortalProps {
  onPropertyAdded: (p: PropertySchema) => void;
  settings: AgentSettings;
}

const IngestionPortal: React.FC<IngestionPortalProps> = ({ onPropertyAdded, settings }) => {
  const [activeMode, setActiveMode] = useState<'url' | 'text' | 'voice'>('url');
  const [inputValue, setInputValue] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // New State for Image
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleProcess = async () => {
    if (!inputValue && activeMode !== 'voice') return;
    setLoading(true);
    try {
      // Pass imageUrl to the parser
      const parsed = await parsePropertyData(inputValue, settings.apiKey, imageUrl);
      onPropertyAdded(parsed);
      setInputValue('');
      setImageUrl(''); // Reset image input
      alert("SUCCESS: Property successfully synchronized and vaulted in the Asset Cloud.");
    } catch (error: any) {
      console.error("Ingestion Hub Error:", error);
      const msg = error.message || "Unknown error";
      const isAuthError = msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('403');
      
      if (isAuthError) {
        alert(`AUTHENTICATION FAILURE: Your Gemini API Key is missing or invalid. Please update your Identity Settings to enable intelligence protocols.`);
      } else {
        alert(`INTELLIGENCE SYNC FAILED: ${msg}. Please verify the source data or URL and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const transcription = await transcribeAudio(base64Audio, settings.apiKey);
            setInputValue(transcription);
            setActiveMode('text');
          } catch (e) {
            alert("Transcription engine timeout.");
          } finally {
            setLoading(false);
          }
        };
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone hardware access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="glass-panel rounded-[3rem] p-12 max-w-5xl mx-auto overflow-hidden relative text-[var(--text-main)]">
      {loading && (
        <div className="absolute inset-0 z-50 bg-[var(--bg-main)]/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-[3rem]">
           <div className="w-24 h-24 mb-6 relative">
              <div className="absolute inset-0 border-4 border-[var(--glass-border)] rounded-full"></div>
              <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: `${settings.primaryColor} transparent transparent transparent` }}></div>
              <i className="fa-solid fa-wand-magic-sparkles absolute inset-0 flex items-center justify-center text-2xl" style={{ color: settings.primaryColor }}></i>
           </div>
           <h3 className="text-xl font-luxury font-bold text-[var(--text-main)]">Synchronizing Asset Intelligence</h3>
           <p className="text-[var(--text-muted)] text-sm mt-2 animate-pulse font-medium uppercase tracking-widest text-[10px]">Elite Precision Protocol Active...</p>
        </div>
      )}

      <div className="mb-12 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 block" style={{ color: settings.primaryColor }}>Asset Orchestration</span>
        <h2 className="text-3xl font-luxury font-bold text-[var(--text-main)] mb-3">Onboard Your Elite Portfolio</h2>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto text-sm leading-relaxed">
           Transform scattered data into high-fidelity, secure property schemas with zero manual entry.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {[
          { id: 'url', icon: 'fa-globe', label: 'Web Scraper' },
          { id: 'text', icon: 'fa-file-lines', label: 'Direct Entry' },
          { id: 'voice', icon: 'fa-microphone-lines', label: 'Agent Voice Note' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-300 ${
              activeMode === mode.id 
                ? 'bg-[var(--glass-bg)] text-[var(--text-main)] shadow-xl scale-105 border-[var(--brand-primary)]' 
                : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]/30'
            }`}
          >
            <i className={`fa-solid ${mode.icon}`} style={activeMode === mode.id ? { color: settings.primaryColor } : {}}></i>
            <span className="font-bold text-xs uppercase tracking-widest">{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {activeMode === 'url' && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Listing URL Source</label>
            <div className="relative">
               <i className="fa-solid fa-link absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
               <input 
                  type="text" 
                  placeholder="https://exclusive-estates.com/listing/3409" 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border border-[var(--glass-border)] focus:ring-2 outline-none transition-all text-sm font-medium bg-[var(--glass-bg)] text-[var(--text-main)]"
                  style={{ '--tw-ring-color': settings.primaryColor } as any}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
            </div>
          </div>
        )}

        {activeMode === 'text' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Property Manifest</label>
                <textarea 
                  rows={8}
                  placeholder="Paste MLS data, internal briefs, or market reports here..." 
                  className="w-full px-6 py-5 rounded-3xl border border-[var(--glass-border)] focus:ring-2 outline-none transition-all resize-none text-sm font-medium bg-[var(--glass-bg)] text-[var(--text-main)]"
                  style={{ '--tw-ring-color': settings.primaryColor } as any}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
            </div>
            
            <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Featured Image (Optional)</label>
                <div className="relative">
                   <i className="fa-regular fa-image absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
                   <input 
                      type="text" 
                      placeholder="https://example.com/condo-front.jpg" 
                      className="w-full pl-14 pr-6 py-5 rounded-2xl border border-[var(--glass-border)] focus:ring-2 outline-none transition-all text-sm font-medium bg-[var(--glass-bg)] text-[var(--text-main)]"
                      style={{ '--tw-ring-color': settings.primaryColor } as any}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] italic pl-1">Provide a direct link to a high-res cover photo.</p>
            </div>
          </div>
        )}

        {activeMode === 'voice' && (
          <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-[var(--glass-border)] rounded-[3rem] bg-[var(--glass-bg)] animate-in zoom-in-95">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'gold-button'
              }`}
              style={!isRecording ? { backgroundColor: settings.primaryColor } : {}}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl`}></i>
            </button>
            <p className="mt-8 font-luxury font-bold text-[var(--text-main)] text-lg">
              {isRecording ? 'Listening for listing details...' : 'Describe your new asset'}
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-2 uppercase tracking-widest">Voice-to-Schema Sync</p>
            
            {inputValue && (
              <div className="mt-10 w-full p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl shadow-sm italic text-[var(--text-main)] text-sm leading-relaxed border-l-4" style={{ borderColor: settings.primaryColor }}>
                "{inputValue}"
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleProcess}
          disabled={loading || (!inputValue && activeMode !== 'voice')}
          className="w-full py-5 rounded-2xl font-bold text-sm shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 text-slate-950 disabled:opacity-30"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <i className="fa-solid fa-shield-halved"></i>
          SECURE SYNC TO PORTFOLIO
        </button>
      </div>
    </div>
  );
};

export default IngestionPortal;
