import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            business_name: businessName
                        }
                    }
                });
                if (error) throw error;
                alert('Verification email sent! Please check your inbox.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gold rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-gold/20">
                            <i className="fa-solid fa-shield-halved text-slate-950 text-3xl"></i>
                        </div>
                        <h1 className="text-3xl font-luxury font-bold text-white tracking-tight mb-2">EstateGuard</h1>
                        <p className="text-[10px] text-gold uppercase font-black tracking-[0.3em]">Secure Agency Intelligence</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Agency Name</label>
                                <div className="relative">
                                    <i className="fa-solid fa-briefcase absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                                    <input 
                                        required
                                        type="text"
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        placeholder="Luxury Realty Group"
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-gold outline-none transition-all placeholder:text-slate-700"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Email</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                                <input 
                                    required
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="agent@estateguard.ai"
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-gold outline-none transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity Password</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                                <input 
                                    required
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-gold outline-none transition-all placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm"></i>
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold text-slate-950 py-5 rounded-2xl font-bold text-sm shadow-xl shadow-gold/10 hover:shadow-gold/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className={`fa-solid ${isLogin ? 'fa-right-to-bracket' : 'fa-user-plus'}`}></i>}
                            {isLogin ? 'Grant Access' : 'Create Agency Account'}
                        </button>
                    </form>

                    <div className="text-center mt-10">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-gold transition-colors"
                        >
                            {isLogin ? "New Agency? Provision Account" : "Existing Member? Return to HQ"}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center text-[8px] text-slate-600 uppercase tracking-[0.4em] font-medium italic">
                    AES-256 Military Grade Encryption at Rest
                </div>
            </div>
        </div>
    );
};

export default Auth;
