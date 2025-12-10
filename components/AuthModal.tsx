import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Mail, Lock, Loader2, X, AlertCircle, LogIn, UserPlus, KeyRound } from 'lucide-react';

interface Props {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<Props> = ({ onClose, onLoginSuccess }) => {
  const [view, setView] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
               <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-stone-800 dark:text-stone-100">Setup Required</h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6 text-sm">
                Cloud Sync is not configured. Developers: Please add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to your environment.
            </p>
            <button onClick={onClose} className="px-6 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full font-bold text-sm">
                Close
            </button>
        </div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'reset') {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage("Password reset link sent! Check your email.");
      } else if (view === 'signup') {
        // Include emailRedirectTo so the confirmation link brings them back here
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;

        // Check if session was created immediately (email confirm disabled)
        // or if we need to ask for verification.
        if (data.session) {
           onLoginSuccess();
           onClose();
        } else if (data.user) {
           // User created, but email confirmation likely required
           setMessage("Account created! Please check your email inbox to confirm your account before logging in.");
           setView('signin'); // Switch to sign in screen so they can log in after confirming
        }
      } else {
        const { error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
           if (error.message.includes("Email not confirmed")) {
             throw new Error("Please verify your email address. Check your inbox (and spam folder) for the confirmation link.");
           }
           throw error;
        }
        onLoginSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'signup': return 'Create Account';
      case 'reset': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
          <h2 className="text-lg font-bold flex items-center gap-2 text-stone-800 dark:text-stone-100">
            {view === 'signup' ? <UserPlus size={20} className="text-rose-500"/> : view === 'reset' ? <KeyRound size={20} className="text-rose-500"/> : <LogIn size={20} className="text-rose-500"/>}
            {getTitle()}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors opacity-70 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
           {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
           )}

           {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {message}
            </div>
           )}

           <form onSubmit={handleAuth} className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Email</label>
               <div className="relative">
                 <Mail className="absolute left-3 top-2.5 text-stone-400" size={16} />
                 <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm text-stone-900 dark:text-stone-100"
                    placeholder="mom@example.com"
                 />
               </div>
             </div>

             {view !== 'reset' && (
               <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Password</label>
                    {view === 'signin' && (
                      <button type="button" onClick={() => setView('reset')} className="text-xs text-rose-500 hover:underline">Forgot?</button>
                    )}
                 </div>
                 <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-stone-400" size={16} />
                   <input 
                      type="password" 
                      required 
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm text-stone-900 dark:text-stone-100"
                      placeholder="••••••••"
                   />
                 </div>
               </div>
             )}

             <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70"
             >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (view === 'signup' ? 'Sign Up' : view === 'reset' ? 'Send Reset Link' : 'Sign In')}
             </button>
           </form>

           <div className="mt-6 text-center">
             <p className="text-xs text-stone-500 dark:text-stone-400">
               {view === 'signin' ? "Don't have an account?" : "Already have an account?"}
             </p>
             <button 
                onClick={() => { 
                  setView(view === 'signin' ? 'signup' : 'signin'); 
                  setError(null); 
                  setMessage(null); 
                }}
                className="mt-1 text-sm font-bold text-rose-600 dark:text-rose-400 hover:underline"
             >
               {view === 'signin' ? "Create Account" : "Sign In instead"}
             </button>
           </div>
           
           {view === 'signin' && !message && (
             <p className="mt-4 text-[10px] text-center text-stone-400 leading-tight">
               By signing in, your recovery plan and logs will be securely synced to the cloud, allowing you to access them from any device.
             </p>
           )}
        </div>
      </div>
    </div>
  );
};