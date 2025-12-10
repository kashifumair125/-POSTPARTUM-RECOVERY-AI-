
import React, { useState, useEffect, useRef } from 'react';
import { AssessmentForm } from './components/AssessmentForm';
import RecoveryPlanView from './components/RecoveryPlanView';
import HealthChat from './components/HealthChat';
import { PrivacyModal } from './components/PrivacyModal';
import { AboutModal } from './components/AboutModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { generateRecoveryRoadmap } from './services/geminiService';
import { loadState, saveState, clearState, toggleExerciseCompletion } from './services/storageService';
import { supabase, saveCloudData, loadCloudData } from './services/supabaseClient';
import { RecoveryPlan, AppState, ChatMessage } from './types';
import { Loader2, Sparkles, AlertTriangle, RefreshCw, Moon, Sun, Heart, Shield, Bell, MessageSquare, User, LogOut, Cloud, ChevronDown, CheckCircle, Globe } from 'lucide-react';
import { LanguageProvider, useLanguage, Language } from './contexts/LanguageContext';

function AppContent() {
  const { t, language, setLanguage, dir } = useLanguage();
  const [appState, setAppState] = useState<AppState>(loadState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Modal States
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showTerms, setShowTerms] = useState(!loadState().hasAgreedToTerms);
  const [syncing, setSyncing] = useState(false);
  
  const isHydratingRef = useRef(false);

  // Initialize Theme
  useEffect(() => {
    if (appState.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appState.settings.theme]);

  // Initialize Auth & Cloud Sync
  useEffect(() => {
    if (!supabase) return;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleCloudSync(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const prevUser = user;
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // If user just logged in (and wasn't logged in before)
      if (newUser && !prevUser) {
        handleCloudSync(newUser.id);
        setShowAuth(false); // Close auth modal immediately on login
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-Save to Cloud on AppState Change (Debounced)
  useEffect(() => {
    if (!user || !supabase || isHydratingRef.current) return;

    const timeoutId = setTimeout(() => {
      setSyncing(true);
      saveCloudData(user.id, appState).then(() => setSyncing(false));
    }, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(timeoutId);
  }, [appState, user]);

  const handleCloudSync = async (userId: string) => {
    setSyncing(true);
    isHydratingRef.current = true;
    try {
      const cloudData = await loadCloudData(userId);
      if (cloudData) {
        const mergedState = { ...cloudData, settings: { ...appState.settings, ...cloudData.settings } };
        setAppState(mergedState);
        saveState(mergedState); 
      } else {
        await saveCloudData(userId, appState);
      }
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setSyncing(false);
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 1000);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = appState.settings.theme === 'light' ? 'dark' : 'light';
    const newState = { ...appState, settings: { ...appState.settings, theme: newTheme } };
    setAppState(newState);
    saveState({ settings: newState.settings });
  };

  const handleAssessmentSubmit = async (assessment: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const userProfile = {
        deliveryMethod: assessment.delivery === 'vaginal' ? 'Vaginal' : 'C-Section',
        weeksPostpartum: assessment.weeksPostpartum,
        activityLevel: assessment.previousFitness,
        symptoms: [
          ...assessment.symptoms, 
          ...assessment.symptoms_body,
          assessment.bodyConcerns
        ].filter(Boolean).join(', '),
        culturalContext: assessment.culturalContext,
        energyLevel: assessment.energyLevel,
        painLevel: assessment.painLevel,
        diastasisInfo: {
          gapFeel: assessment.gapFeel,
          bellyAppearance: assessment.bellyAppearance,
          bulging: assessment.symptoms_body.includes('Bulging when coughing/sneezing'),
        },
        capabilities: {
          canWalk: assessment.canWalk,
          canStand: assessment.canStand10min,
          leaking: assessment.leakingIssue
        }
      };

      // Pass language to generating service
      const recoveryPlan = await generateRecoveryRoadmap(userProfile, language);
      
      const newState = {
        ...appState,
        profile: userProfile,
        plan: recoveryPlan
      };
      
      setAppState(newState);
      saveState({ profile: userProfile, plan: recoveryPlan });

    } catch (err: any) {
      setError(err.message || 'Failed to generate recovery plan');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    const newState = { ...appState, hasAgreedToTerms: true };
    setAppState(newState);
    saveState({ hasAgreedToTerms: true });
    setShowTerms(false);
  };

  const handleToggleLog = (exerciseName: string) => {
    const newLogs = toggleExerciseCompletion(exerciseName);
    setAppState(prev => ({ ...prev, logs: newLogs }));
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("PostpartumAI Reminders Enabled", {
        body: "Great! We'll help you stay consistent with your recovery.",
        icon: "/icon-192.png" 
      });
      const newState = { ...appState, settings: { ...appState.settings, remindersEnabled: true } };
      setAppState(newState);
      saveState({ settings: newState.settings });
    }
  };

  const updateChatHistory = (history: ChatMessage[]) => {
    setAppState(prev => ({ ...prev, chatHistory: history }));
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${appState.settings.theme === 'dark' ? 'bg-stone-950 text-stone-100' : 'bg-rose-50/50 text-stone-800'}`} dir={dir}>
      
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${appState.settings.theme === 'dark' ? 'bg-stone-900/80 border-stone-800' : 'bg-white/80 border-rose-100'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
            <div className={`p-1.5 rounded-lg ${appState.settings.theme === 'dark' ? 'bg-rose-600' : 'bg-rose-500'}`}>
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className={`font-bold text-xl tracking-tight ${appState.settings.theme === 'dark' ? 'text-stone-100' : 'text-stone-800'}`}>
              Postpartum<span className="text-rose-500">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {syncing && (
               <div className="hidden md:flex items-center gap-1 text-xs text-stone-500 animate-pulse">
                 <Cloud size={14} /> Saving...
               </div>
             )}

             {/* Language Selector */}
             <div className="relative group">
                <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Globe size={18} className={appState.settings.theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
                  <span className="text-xs font-bold uppercase">{language}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden hidden group-hover:block animate-fade-in">
                  {[
                    {code: 'en', label: 'English'},
                    {code: 'es', label: 'Español'},
                    {code: 'fr', label: 'Français'},
                    {code: 'de', label: 'Deutsch'},
                    {code: 'ar', label: 'العربية'},
                    {code: 'hi', label: 'हिन्दी'},
                    {code: 'zh', label: '中文'},
                    {code: 'ja', label: '日本語'},
                  ].map(l => (
                    <button 
                      key={l.code} 
                      onClick={() => setLanguage(l.code as Language)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 ${language === l.code ? 'text-rose-600 font-bold' : 'text-stone-600 dark:text-stone-400'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
             </div>
             
             {appState.plan && (
               <button onClick={clearState} className={`hidden md:flex text-sm font-medium transition-colors items-center gap-1 ${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>
                 <RefreshCw size={14} /> {t('reset')}
               </button>
             )}
             
             <button 
               onClick={toggleTheme}
               className={`p-2 rounded-full transition-colors ${appState.settings.theme === 'dark' ? 'bg-stone-800 text-yellow-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
               aria-label="Toggle Dark Mode"
             >
               {appState.settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             {user ? (
               <div className="flex items-center gap-2">
                 <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Logged in as</span>
                    <span className="text-xs font-semibold max-w-[100px] truncate text-stone-700 dark:text-stone-200">{user.email?.split('@')[0]}</span>
                 </div>
                 <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  title="Sign Out"
                 >
                   <LogOut size={14} />
                 </button>
               </div>
             ) : (
               <button 
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
               >
                 <User size={14} /> <span className="hidden sm:inline">{t('signIn')}</span>
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        {error && (
          <div className="max-w-xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-3 animate-fade-in shadow-sm">
            <AlertTriangle className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" size={20} />
            <div className="flex-grow">
              <h3 className="font-semibold text-sm">Something went wrong</h3>
              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-sm font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] px-4 animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-rose-300 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <Loader2 className="animate-spin text-rose-500 relative z-10" size={64} />
            </div>
            <h2 className={`text-2xl font-bold text-center ${appState.settings.theme === 'dark' ? 'text-stone-100' : 'text-stone-800'}`}>Crafting Your Recovery Journey</h2>
            <p className={`mt-3 max-w-md text-center text-lg leading-relaxed ${appState.settings.theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
              {t('analyzing')}
            </p>
          </div>
        ) : !appState.plan ? (
          <div className="space-y-12 animate-fade-in">
            <AssessmentForm
              onSubmit={handleAssessmentSubmit}
              isLoading={isLoading}
            />
            
            {/* Value Props Section */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-8">
               <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 shadow-sm border border-stone-100 dark:border-stone-800">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                    <Heart size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Mom-First Design</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Gentle, aesthetically pleasing, and supportive language tailored for postpartum recovery.</p>
               </div>
               <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 shadow-sm border border-stone-100 dark:border-stone-800">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                    <Shield size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Safety Focused</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Exercises selected based on your delivery method (C-Section/Vaginal) and diastasis status.</p>
               </div>
               <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 shadow-sm border border-stone-100 dark:border-stone-800">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">AI Corrective Lab</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Unsure about your form? Upload a quick clip and let our AI check your alignment instantly.</p>
               </div>
            </div>
          </div>
        ) : (
          <RecoveryPlanView 
            plan={appState.plan} 
            logs={appState.logs} 
            onToggleExercise={handleToggleLog} 
          />
        )}
      </main>

      {/* AI Chatbot Overlay */}
      <HealthChat 
        profile={appState.profile} 
        history={appState.chatHistory || []}
        onUpdateHistory={updateChatHistory}
      />

      <footer className={`border-t py-12 mt-auto transition-colors duration-300 ${appState.settings.theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
             <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${appState.settings.theme === 'dark' ? 'bg-rose-600' : 'bg-rose-500'}`}>
                  <Sparkles className="text-white" size={16} />
                </div>
                <span className={`font-bold text-lg ${appState.settings.theme === 'dark' ? 'text-stone-100' : 'text-stone-800'}`}>PostpartumAI</span>
             </div>
             
             <div className="flex gap-6 text-sm font-medium">
                <button onClick={() => setShowAbout(true)} className={`${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>About Us</button>
                <button onClick={() => setShowPrivacy(true)} className={`${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>Privacy Policy</button>
                <button onClick={enableNotifications} className={`flex items-center gap-1 ${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>
                   <Bell size={14} /> {appState.settings.remindersEnabled ? 'Reminders On' : 'Enable Reminders'}
                </button>
                <button onClick={() => setShowFeedback(true)} className={`flex items-center gap-1 ${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>
                   <MessageSquare size={14} /> {t('feedback')}
                </button>
             </div>
          </div>
          
          <div className="pt-8 border-t border-stone-200 dark:border-stone-800 text-center">
            <p className="text-xs md:text-sm mb-2 max-w-2xl mx-auto opacity-70">
              <strong>{t('medicalDisclaimer')}</strong>
            </p>
            <p className="text-xs opacity-50 mt-4">© 2024 PostpartumAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* LIABILITY WAIVER MODAL */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
           <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${appState.settings.theme === 'dark' ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-800'}`}>
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
                 <AlertTriangle className="text-rose-500" size={24} />
                 <h2 className="text-xl font-bold">Medical Disclaimer & Liability</h2>
              </div>
              <div className="p-6 space-y-4 text-sm leading-relaxed overflow-y-auto max-h-[60vh]">
                 <p className="font-bold">Please read carefully before proceeding:</p>
                 <p>This application ("PostpartumAI") uses Artificial Intelligence to generate wellness and fitness suggestions. <strong>It is not a doctor.</strong></p>
                 <ul className="list-disc pl-5 space-y-2 opacity-90">
                   <li>Consult your healthcare provider before starting any exercise program, especially if you had a C-Section or complications.</li>
                   <li>Stop immediately if you experience pain, dizziness, or bleeding.</li>
                   <li>By clicking "I Agree", you acknowledge that you are voluntarily participating in these activities and assume all risk of injury.</li>
                   <li>You agree to release PostpartumAI and its developers from any and all liability.</li>
                 </ul>
              </div>
              <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col gap-3">
                 <button 
                   onClick={handleAcceptTerms}
                   className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2"
                 >
                   I Agree & Continue <CheckCircle size={18} />
                 </button>
                 <p className="text-xs text-center text-stone-500">By continuing, you also agree to our Privacy Policy.</p>
              </div>
           </div>
        </div>
      )}

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={() => setShowAuth(false)} />}

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
    