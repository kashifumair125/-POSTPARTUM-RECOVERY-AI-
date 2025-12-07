import React, { useState } from 'react';
import { AssessmentForm } from './components/AssessmentForm';
import RecoveryPlanView from './components/RecoveryPlanView';
import { generateRecoveryRoadmap } from './services/geminiService';
import { RecoveryPlan } from './types';
import { Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssessmentSubmit = async (assessment: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Map assessment form data to UserProfile format expected by Gemini service
      const userProfile = {
        deliveryMethod: assessment.delivery === 'vaginal' ? 'Vaginal' : 'C-Section',
        weeksPostpartum: assessment.weeksPostpartum,
        activityLevel: assessment.previousFitness,
        symptoms: [
          ...assessment.symptoms, // From older type def, keep for safety
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
      setPlan(recoveryPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recovery plan');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-teal-600 p-1.5 rounded-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">Postpartum<span className="text-teal-600">AI</span></h1>
          </div>
          {plan && (
             <button onClick={handleReset} className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors flex items-center gap-1">
               <RefreshCw size={14} /> New Plan
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        {error && (
          <div className="max-w-xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-fade-in shadow-sm">
            <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={20} />
            <div className="flex-grow">
              <h3 className="font-semibold text-sm text-red-800">Something went wrong</h3>
              <p className="text-sm mt-1">{error}</p>
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
          <div className="flex flex-col items-center justify-center h-[50vh] px-4 animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-teal-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <Loader2 className="animate-spin text-teal-600 relative z-10" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center">Designing Your Recovery Roadmap</h2>
            <p className="text-slate-500 mt-3 max-w-md text-center text-lg leading-relaxed">
              Our AI is analyzing your delivery type, symptoms, and physiology to build a safe, 12-week progression...
            </p>
          </div>
        ) : !plan ? (
          <AssessmentForm
            onSubmit={handleAssessmentSubmit}
            isLoading={isLoading}
          />
        ) : (
          <RecoveryPlanView plan={plan} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-xs md:text-sm mb-2 max-w-2xl mx-auto">
            <strong>Medical Disclaimer:</strong> This AI assistant is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or qualified health provider.
          </p>
          <p className="text-slate-400 text-xs">Powered by Gemini 3 Pro • Privacy First Architecture</p>
        </div>
      </footer>
    </div>
  );
}
