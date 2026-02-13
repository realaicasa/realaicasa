import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC = () => {
    const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else if (view === 'signup') {
                // 1. Cross-reference Stripe Subscriptions
                const { data: subData, error: subError } = await supabase
                    .from('stripe_subscriptions')
                    .select('*')
                    .eq('email', email.toLowerCase())
                    .eq('status', 'active')
                    .single();

                if (subError || !subData) {
                    throw new Error("SUBSCRIPTION REQUIRED: This email is not associated with an active EstateGuard subscription. Please complete your purchase at estateguard.ai first.");
                }

                // 2. Clear to signup
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
                setMessage('Verification email sent! Please check your inbox.');
            } else if (view === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                setMessage('Password reset link sent to your email.');
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
                        <p className="text-[10px] text-gold uppercase font-black tracking-[0.3em]">
                            {view === 'forgot' ? 'Identity Recovery' : 'Secure Agency Intelligence'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {view === 'signup' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
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
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Secure Email</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                <input 
                                    required
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="agent@estateguard.ai"
                                    className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-gold outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {view !== 'forgot' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Identity Password</label>
                                    {view === 'login' && (
                                        <button 
                                            type="button"
                                            onClick={() => setView('forgot')}
                                            className="text-[9px] font-bold text-gold hover:text-white transition-colors"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                    <input 
                                        required
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:border-gold outline-none transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm"></i>
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        {message && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <i className="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">{message}</p>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-yellow-400 text-slate-950 py-5 rounded-2xl font-black text-sm shadow-xl shadow-yellow-400/20 hover:bg-yellow-300 hover:shadow-yellow-400/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4 uppercase tracking-widest"
                        >
                            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (
                                <i className={`fa-solid ${view === 'login' ? 'fa-right-to-bracket' : view === 'signup' ? 'fa-user-plus' : 'fa-paper-plane'}`}></i>
                            )}
                            {view === 'login' ? 'Grant Access' : view === 'signup' ? 'Verify & Provision' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="text-center mt-10 space-y-4">
                        {view !== 'login' ? (
                            <button 
                                onClick={() => { setView('login'); setError(null); setMessage(null); }}
                                className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-gold transition-colors"
                            >
                                Return to Secure HQ
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setView('signup'); setError(null); setMessage(null); }}
                                className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-gold transition-colors"
                            >
                                New Agency? Provision Account
                            </button>
                        )}
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
