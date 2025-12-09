import React, { useState, useEffect } from 'react';
import { AssessmentForm } from './components/AssessmentForm';
import RecoveryPlanView from './components/RecoveryPlanView';
import HealthChat from './components/HealthChat';
import { generateRecoveryRoadmap } from './services/geminiService';
import { loadState, saveState, clearState } from './services/storageService';
import { RecoveryPlan, AppState, ChatMessage } from './types';
import { Loader2, Sparkles, AlertTriangle, RefreshCw, Moon, Sun, Heart, Shield, Mail, Info, CheckCircle, Bell } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal States
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(!loadState().hasAgreedToTerms);

  useEffect(() => {
    if (appState.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appState.settings.theme]);

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

      const recoveryPlan = await generateRecoveryRoadmap(userProfile);
      
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

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("PostpartumAI Reminders Enabled", {
        body: "Great! We'll help you stay consistent with your recovery.",
        icon: "/icon-192.png" // Assumes PWA icon
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${appState.settings.theme === 'dark' ? 'bg-stone-950 text-stone-100' : 'bg-rose-50/50 text-stone-800'}`}>
      
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
          
          <div className="flex items-center gap-4">
             {appState.plan && (
               <button onClick={clearState} className={`hidden md:flex text-sm font-medium transition-colors items-center gap-1 ${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>
                 <RefreshCw size={14} /> Reset
               </button>
             )}
             <button 
               onClick={toggleTheme}
               className={`p-2 rounded-full transition-colors ${appState.settings.theme === 'dark' ? 'bg-stone-800 text-yellow-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
               aria-label="Toggle Dark Mode"
             >
               {appState.settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
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
              Analyzing your physiology and symptoms to build a safe, personalized roadmap just for you...
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
          <RecoveryPlanView plan={appState.plan} />
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
                <a href="mailto:kashifumair125@gmail.com" className={`flex items-center gap-1 ${appState.settings.theme === 'dark' ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'}`}>
                   <Mail size={14} /> Contact
                </a>
             </div>
          </div>
          
          <div className="pt-8 border-t border-stone-200 dark:border-stone-800 text-center">
            <p className="text-xs md:text-sm mb-2 max-w-2xl mx-auto opacity-70">
              <strong>Medical Disclaimer:</strong> This AI assistant is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or qualified health provider.
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

      {/* PRIVACY MODAL */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto ${appState.settings.theme === 'dark' ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-800'}`}>
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                 <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-rose-500" /> Privacy Policy</h2>
                 <button onClick={() => setShowPrivacy(false)} className="opacity-50 hover:opacity-100">Close</button>
              </div>
              <div className="p-6 space-y-4 text-sm leading-relaxed opacity-90">
                 <p><strong>Effective Date:</strong> October 2024</p>
                 <p>Your privacy is paramount. We follow a <strong>Local-First</strong> data policy:</p>
                 <ul className="list-disc pl-5 space-y-2">
                   <li><strong>Data Storage:</strong> Your recovery plan, progress logs, and profile are stored <strong>only on this device</strong> using your browser's Local Storage. We do not have a central database of your health info.</li>
                   <li><strong>Image Processing:</strong> Photos uploaded for Diastasis checks are sent to the AI for analysis and <strong>immediately discarded</strong>. They are not stored.</li>
                   <li><strong>Cookies:</strong> We use local storage for functionality (saving your plan) only.</li>
                 </ul>
                 <p className="mt-4">For questions, contact <a href="mailto:kashifumair125@gmail.com" className="text-rose-500 hover:underline">kashifumair125@gmail.com</a>.</p>
              </div>
           </div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto ${appState.settings.theme === 'dark' ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-800'}`}>
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                 <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-rose-500" /> About PostpartumAI</h2>
                 <button onClick={() => setShowAbout(false)} className="opacity-50 hover:opacity-100">Close</button>
              </div>
              <div className="p-6 space-y-4 text-sm leading-relaxed opacity-90">
                 <p>PostpartumAI was built to bridge the gap in women's healthcare. Too often, new mothers are sent home with a baby and told to "wait 6 weeks" before exercising, with little guidance on <em>how</em> to recover safely.</p>
                 <p><strong>Our Mission:</strong> To provide accessible, judgment-free, and scientifically grounded recovery roadmaps for every mother.</p>
                 <h3 className="font-bold text-lg mt-4">Key Features</h3>
                 <ul className="list-disc pl-5 space-y-1">
                   <li><strong>Local Persistence:</strong> Your plan saves automatically to your device.</li>
                   <li><strong>Progress Tracking:</strong> Track your streaks and completed exercises.</li>
                   <li><strong>Offline Capable:</strong> Install this app to your home screen.</li>
                 </ul>
                 <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl mt-6">
                    <p className="font-medium text-center">Built with love and code.</p>
                    <div className="text-center mt-2">
                       <a href="mailto:kashifumair125@gmail.com" className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
                          <Mail size={16} /> Send Feedback to Developer
                       </a>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}