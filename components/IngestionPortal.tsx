
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
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleProcess = async () => {
    if (!inputValue && activeMode !== 'voice') return;
    setLoading(true);
    try {
      const parsed = await parsePropertyData(inputValue, settings.apiKey);
      onPropertyAdded(parsed);
      setInputValue('');
      // Beautiful success alert replacement logic could go here, for now alert is fine
    } catch (error) {
      console.error(error);
      alert("Intelligence sync failed. Please verify the source data and try again.");
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
    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-12 max-w-5xl mx-auto overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-24 h-24 mb-6 relative">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
              <i className="fa-solid fa-wand-magic-sparkles absolute inset-0 flex items-center justify-center text-gold text-2xl"></i>
           </div>
           <h3 className="text-xl font-luxury font-bold text-slate-900">Synchronizing Asset Intelligence</h3>
           <p className="text-slate-500 text-sm mt-2 animate-pulse">Gemini 3 Flash Pro is structuring your listing data...</p>
        </div>
      )}

      <div className="mb-12 text-center">
        <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-4 block">Asset Orchestration</span>
        <h2 className="text-3xl font-luxury font-bold text-slate-900 mb-3">Onboard Your Elite Portfolio</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
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
                ? 'border-gold bg-gold/5 text-slate-900 shadow-lg shadow-gold/10 scale-105' 
                : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
            }`}
          >
            <i className={`fa-solid ${mode.icon} ${activeMode === mode.id ? 'text-gold' : ''}`}></i>
            <span className="font-bold text-xs uppercase tracking-widest">{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {activeMode === 'url' && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Listing URL Source</label>
            <div className="relative">
               <i className="fa-solid fa-link absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
               <input 
                  type="text" 
                  placeholder="https://exclusive-estates.com/listing/3409" 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all text-sm font-medium bg-slate-50/50"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
            </div>
          </div>
        )}

        {activeMode === 'text' && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Property Manifest</label>
            <textarea 
              rows={8}
              placeholder="Paste MLS data, internal briefs, or market reports here..." 
              className="w-full px-6 py-5 rounded-3xl border border-slate-200 focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all resize-none text-sm font-medium bg-slate-50/50"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        )}

        {activeMode === 'voice' && (
          <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/30 animate-in zoom-in-95">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'gold-button'
              }`}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl`}></i>
            </button>
            <p className="mt-8 font-luxury font-bold text-slate-800 text-lg">
              {isRecording ? 'Listening for listing details...' : 'Describe your new asset'}
            </p>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Voice-to-Schema Sync</p>
            
            {inputValue && (
              <div className="mt-10 w-full p-6 bg-white border border-slate-100 rounded-3xl shadow-sm italic text-slate-600 text-sm leading-relaxed border-l-4 border-gold">
                "{inputValue}"
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleProcess}
          disabled={loading || (!inputValue && activeMode !== 'voice')}
          className="w-full py-5 gold-button rounded-2xl font-bold text-sm shadow-2xl shadow-gold/20 hover:scale-[1.01] disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <i className="fa-solid fa-shield-halved"></i>
          SECURE SYNC TO PORTFOLIO
        </button>
      </div>
    </div>
  );
};

export default IngestionPortal;
