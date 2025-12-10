import React from 'react';
import { Info, Mail, X, Heart, Activity, Globe, Zap, ShieldCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const AboutModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col bg-white text-stone-800 dark:bg-stone-900 dark:text-stone-100">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Info className="text-rose-500" /> About PostpartumAI
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors opacity-70 hover:opacity-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 text-sm leading-relaxed overflow-y-auto">
          {/* Mission Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
               <Heart className="text-rose-500" size={20} /> Our Mission
            </h3>
            <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-stone-700 dark:text-stone-300">
              <p className="mb-2 text-base font-medium">
                Reimagining the "4th Trimester"
              </p>
              <p className="opacity-90">
                We believe every mother deserves accessible, scientifically grounded, and judgment-free recovery guidance—regardless of delivery method or fitness background. PostpartumAI bridges the gap between hospital discharge and full recovery.
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
               <Zap className="text-amber-500" size={20} /> Key Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="text-indigo-500" size={18} />
                    <span className="font-bold">Adaptive Roadmaps</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  12-week recovery plans tailored to C-Sections, Diastasis Recti, and your daily energy levels.
                </p>
              </div>
              
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                 <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="text-teal-500" size={18} />
                    <span className="font-bold">Local-First Privacy</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Your health data stays on your device. No cloud databases. Secure by design and works offline.
                </p>
              </div>
              
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                 <div className="flex items-center gap-2 mb-2">
                    <Heart className="text-pink-500" size={18} />
                    <span className="font-bold">Mom-Centric UX</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Designed for sleep-deprived eyes with gentle colors, dark mode, and encouraging language.
                </p>
              </div>

               <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                 <div className="flex items-center gap-2 mb-2">
                    <Globe className="text-blue-500" size={18} />
                    <span className="font-bold">Cultural Wellness</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                   Optional integration of traditional care practices (e.g., confinement tips) alongside modern PT.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              Built with care by Kashif Umair
            </p>
            <a 
              href="mailto:kashifumair125@gmail.com" 
              className="inline-flex items-center gap-2 px-5 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-xs"
            >
              <Mail size={14} /> Contact Developer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};