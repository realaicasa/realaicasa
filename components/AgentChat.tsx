import React, { useState, useRef, useEffect } from 'react';
import { chatWithGuard } from '../services/geminiService';
import { PropertySchema, ChatMessage, Lead, AgentSettings, PropertyTier } from '../types';

interface AgentChatProps {
  property: PropertySchema;
  onLeadCaptured: (lead: Partial<Lead>) => void;
  settings: AgentSettings;
}

const AgentChat: React.FC<AgentChatProps> = ({ property, onLeadCaptured, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [specificQuestionCount, setSpecificQuestionCount] = useState(0);
  const [isGated, setIsGated] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ name: '', phone: '', comm: 'WhatsApp', time: 'ASAP' });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isGated]);

  const handleSend = async () => {
    if (!input.trim() || isGated) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Precise detection of "Specific" property interest
    const specKeywords = ['price', 'address', 'bedrooms', 'bathrooms', 'sqft', 'square feet', 'private', 'motivation', 'showing', 'inside', 'hoa', 'specs', 'pool', 'garage', 'details', 'info', 'appraisal'];
    const isSpecific = specKeywords.some(kw => input.toLowerCase().includes(kw));
    
    // Logic: Only gate if 3rd question OR if property is High-Value/EstateGuard and question is specific
    const shouldGateNow = 
      (specificQuestionCount >= 2 && isSpecific) || 
      (settings.highSecurityMode && property.tier === PropertyTier.ESTATE_GUARD && isSpecific);

    const newCount = isSpecific ? specificQuestionCount + 1 : specificQuestionCount;
    setSpecificQuestionCount(newCount);

    try {
      let promptPrefix = "";
      if (shouldGateNow) {
        promptPrefix = " [SYSTEM ALERT: USER HAS REACHED DATA LIMIT. PIVOT TO SECURE LEAD CAPTURE IMMEDIATELY. DO NOT REVEAL ANY MORE SPECIFIC DATA. ASK FOR MOBILE AND PREFERRED CONTACT TIME.] ";
      }

      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      history.push({ role: 'user', parts: [{ text: promptPrefix + input }] });
      
      const responseText = await chatWithGuard(history, property, settings);
      setMessages(prev => [...prev, { role: 'model', text: responseText || '' }]);

      if (shouldGateNow) {
        setIsGated(true);
      }

      // Quick-capture if they just type a number in sandbox
      const phoneMatch = input.match(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      if (phoneMatch) {
        onLeadCaptured({
          name: "Direct Sandbox Lead",
          phone: phoneMatch[0],
          property_id: property.property_id,
          property_address: property.listing_details.address,
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Guard connection unstable. Please try again or contact " + settings.businessName + " directly." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitLeadForm = () => {
    onLeadCaptured({
      name: leadFormData.name,
      phone: leadFormData.phone,
      property_id: property.property_id,
      property_address: property.listing_details.address,
      notes: [`Prefers ${leadFormData.comm} at ${leadFormData.time}`]
    });
    setIsGated(false);
    setMessages(prev => [...prev, { role: 'model', text: `Thank you, ${leadFormData.name}. I've synchronized your request with our Elite Desk. An agent will reach out via ${leadFormData.comm} shortly.` }]);
  };

  return (
    <div className="flex flex-col h-[650px] relative">
      <div className="mb-4 bg-gold/10 border-l-4 border-gold p-4 rounded-r-2xl">
         <p className="text-xs font-bold text-slate-800 italic">
           "{settings.conciergeIntro || 'Ask our happy assistant about any of our properties 24/7'}"
         </p>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="bg-slate-950 text-white p-6 flex items-center justify-between border-b-2 border-gold/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gold text-slate-950 shadow-lg shadow-gold/20">
              <i className="fa-solid fa-robot text-xl"></i>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold opacity-80">Guard Intelligence</p>
              <p className="text-md font-luxury font-bold tracking-tight">{settings.businessName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border border-slate-800 uppercase ${specificQuestionCount >= 2 ? 'bg-red-900/40 text-red-400 animate-pulse' : 'bg-slate-900 text-slate-500'}`}>
                 STRIKES: {specificQuestionCount}/2
              </span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 no-scrollbar relative">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-slate-100">
                 <i className="fa-solid fa-shield-halved text-3xl text-gold/30"></i>
              </div>
              <div>
                  <p className="text-xl font-luxury text-slate-800 font-bold tracking-tight">Sandbox Preview</p>
                  <p className="text-sm max-w-xs mx-auto text-slate-500 leading-relaxed mt-2">
                     Testing {settings.businessName}'s deployment behavior for <b>{property.listing_details.address}</b> ({property.tier}).
                  </p>
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-sm transition-all ${
                m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none border border-white/5' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white px-5 py-4 rounded-3xl rounded-tl-none border border-slate-200 shadow-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}

          {isGated && (
            <div className="bg-white border-2 border-gold p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 border-t-8">
               <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-user-shield text-gold text-2xl"></i>
                  <div>
                    <h4 className="font-bold text-slate-900">Priority Viewing Access</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Secure verification required</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <input 
                    type="text" placeholder="Your Name" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold"
                    value={leadFormData.name}
                    onChange={e => setLeadFormData({...leadFormData, name: e.target.value})}
                  />
                  <input 
                    type="tel" placeholder="Mobile Number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold"
                    value={leadFormData.phone}
                    onChange={e => setLeadFormData({...leadFormData, phone: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none"
                      value={leadFormData.comm}
                      onChange={e => setLeadFormData({...leadFormData, comm: e.target.value})}
                    >
                      <option>WhatsApp</option>
                      <option>Voice Call</option>
                      <option>SMS Text</option>
                    </select>
                    <select 
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none"
                      value={leadFormData.time}
                      onChange={e => setLeadFormData({...leadFormData, time: e.target.value})}
                    >
                      <option>ASAP</option>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                    </select>
                  </div>
                  <button 
                    onClick={submitLeadForm}
                    disabled={!leadFormData.name || !leadFormData.phone}
                    className="w-full py-4 gold-button rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                  >
                    Request specialist access
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder={isGated ? "Security gating active..." : "Ask about specs, price, or private notes..."} 
              className="flex-1 bg-slate-100 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-gold transition-all text-sm placeholder:text-slate-400 font-medium"
              value={input}
              disabled={isGated}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isGated}
              className="w-14 h-14 bg-slate-950 text-gold rounded-2xl flex items-center justify-center hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-gold/5 disabled:opacity-30"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;