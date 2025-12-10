import React from 'react';
import { Shield, X, Lock, Database, EyeOff } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PrivacyModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col bg-white text-stone-800 dark:bg-stone-900 dark:text-stone-100">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-rose-500" /> Privacy Policy
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors opacity-70 hover:opacity-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 text-sm leading-relaxed overflow-y-auto">
          <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <p className="font-medium text-rose-800 dark:text-rose-200 mb-1">Local-First Architecture</p>
            <p className="text-rose-700 dark:text-rose-300 opacity-90">
              Your health data is yours. This application operates on a "Local-First" basis, meaning your personal information is stored securely on your own device, not in a central cloud database.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg h-fit">
                <Database size={20} className="text-stone-500" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Data Storage</h3>
                <p className="text-stone-600 dark:text-stone-300">
                  Your recovery plan, daily logs, streaks, and profile settings are stored exclusively in your browser's <strong>Local Storage</strong>. If you clear your browser cache, this data will be reset. We do not have access to your medical history.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg h-fit">
                <EyeOff size={20} className="text-stone-500" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Image & Video Privacy</h3>
                <p className="text-stone-600 dark:text-stone-300">
                  When you upload photos for Diastasis analysis or videos for form correction:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-stone-600 dark:text-stone-300">
                  <li>Files are processed in-memory.</li>
                  <li>They are sent to the AI model for analysis and <strong>immediately discarded</strong>.</li>
                  <li>They are <strong>never saved</strong> to a server or database.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg h-fit">
                <Lock size={20} className="text-stone-500" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">AI Interactions</h3>
                <p className="text-stone-600 dark:text-stone-300">
                  Conversations with the "Rose" health coach are sent to Google's Gemini API for processing. These interactions are stateless and are not used to train the model with your personal identity attached.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500">
            <p>Effective Date: October 2024</p>
            <p className="mt-2">
              For privacy-related questions or to request a complete data wipe instruction guide, please contact <a href="mailto:kashifumair125@gmail.com" className="text-rose-500 hover:underline">kashifumair125@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};