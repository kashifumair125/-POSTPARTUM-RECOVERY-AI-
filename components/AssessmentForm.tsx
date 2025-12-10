
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Battery, AlertCircle, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AssessmentData {
  delivery: 'vaginal' | 'csection';
  weeksPostpartum: number;
  symptoms: string[];
  painLevel: number; // 1-10
  bodyConcerns: string;
  activityHistory: string;

  // Body Assessment
  bellyAppearance: string;
  gapFeel: string;
  symptoms_body: string[];
  energyLevel: number;

  // Capability
  canWalk: boolean;
  canStand10min: boolean;
  leakingIssue: boolean;
  previousFitness: string;
  culturalContext: boolean;
}

interface Props {
  onSubmit: (data: AssessmentData) => void;
  isLoading: boolean;
}

export const AssessmentForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<AssessmentData>({
    delivery: 'vaginal',
    weeksPostpartum: 6,
    symptoms: [],
    painLevel: 5,
    bodyConcerns: '',
    activityHistory: 'light',
    bellyAppearance: '',
    gapFeel: '',
    symptoms_body: [],
    energyLevel: 5,
    canWalk: true,
    canStand10min: true,
    leakingIssue: false,
    previousFitness: 'light',
    culturalContext: true
  });

  const updateField = (field: keyof AssessmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'symptoms' | 'symptoms_body', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
      <div className="bg-stone-900 dark:bg-stone-950 p-6 text-white text-center">
        <h2 className="text-xl font-bold tracking-wide">
          {step === 1 && `Step 1: ${t('step1')}`}
          {step === 2 && `Step 2: ${t('step2')}`}
          {step === 3 && `Step 3: ${t('step3')}`}
        </h2>
        <p className="text-stone-400 text-sm mt-1">{t('subtitle')}</p>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          
          {/* STEP 1: ASSESSMENT QUESTIONS */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">{t('deliveryType')}</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['vaginal', 'csection'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('delivery', type)}
                      className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        formData.delivery === type
                          ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                          : 'border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-200 dark:hover:border-stone-600'
                      }`}
                    >
                      {type === 'vaginal' ? t('vaginal') : t('csection')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">
                  {t('weeksPP')}: <span className="text-rose-600 dark:text-rose-400 text-lg">{formData.weeksPostpartum}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="52"
                  value={formData.weeksPostpartum}
                  onChange={(e) => updateField('weeksPostpartum', parseInt(e.target.value))}
                  className="w-full accent-rose-600 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-2">Pain Level (1-10)</label>
                <div className="flex items-center gap-4">
                   <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.painLevel}
                    onChange={(e) => updateField('painLevel', parseInt(e.target.value))}
                    className="w-full accent-rose-500 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none"
                  />
                  <span className="font-bold text-stone-700 dark:text-stone-300">{formData.painLevel}</span>
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-2">Specific Body Concerns?</label>
                <textarea
                  value={formData.bodyConcerns}
                  onChange={(e) => updateField('bodyConcerns', e.target.value)}
                  className="w-full p-3 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm bg-white dark:bg-stone-800 dark:text-white"
                  rows={2}
                  placeholder="e.g. My abs feel separated, back hurts when lifting baby..."
                />
              </div>
            </>
          )}

          {/* STEP 2: BODY ASSESSMENT */}
          {step === 2 && (
            <>
               <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex gap-2">
                 <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                 <p className="text-xs text-blue-800 dark:text-blue-200">Touch your belly while lying down and lifting your head slightly ("mini crunch") to answer these.</p>
               </div>

               <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">1. How does your belly look?</label>
                <div className="space-y-2">
                  {[
                    'Flabby / loose skin', 
                    'Slightly protruding', 
                    'Back to normal size', 
                    'Dented / separated in middle'
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField('bellyAppearance', opt)}
                      className={`w-full p-3 text-left rounded-lg border transition-all text-sm font-medium ${
                        formData.bellyAppearance === opt ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">2. When you touch, can you feel:</label>
                <div className="space-y-2">
                  {[
                    'Large gap (2+ fingers wide)', 
                    'Small gap (1 finger wide)', 
                    'Muscles seem together', 
                    'Not sure / Can\'t feel'
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField('gapFeel', opt)}
                      className={`w-full p-3 text-left rounded-lg border transition-all text-sm font-medium ${
                        formData.gapFeel === opt ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">3. {t('symptoms')}?</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Bulging when coughing/sneezing',
                    'Heaviness in lower belly',
                    'Lower back pain',
                    'Pelvic pressure',
                  ].map(symptom => (
                    <label key={symptom} className="flex items-center gap-3 p-3 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800">
                      <input
                        type="checkbox"
                        checked={formData.symptoms_body.includes(symptom)}
                        onChange={() => toggleArrayItem('symptoms_body', symptom)}
                        className="w-5 h-5 accent-rose-600 rounded"
                      />
                      <span className="text-sm text-stone-700 dark:text-stone-300">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-2">4. Energy Level?</label>
                <div className="flex items-center gap-4">
                  <Battery className="text-amber-500" size={24} />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energyLevel}
                    onChange={(e) => updateField('energyLevel', parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none"
                  />
                  <span className="font-bold text-stone-700 dark:text-stone-300">{formData.energyLevel}</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: CAPABILITY */}
          {step === 3 && (
            <>
              <div>
                 <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">Can you walk comfortably?</label>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => updateField('canWalk', true)} className={`flex-1 p-3 rounded-lg border ${formData.canWalk ? 'bg-rose-600 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>Yes</button>
                    <button type="button" onClick={() => updateField('canWalk', false)} className={`flex-1 p-3 rounded-lg border ${!formData.canWalk ? 'bg-rose-600 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>No</button>
                 </div>
              </div>

               <div>
                 <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">Can you stand for 10 mins?</label>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => updateField('canStand10min', true)} className={`flex-1 p-3 rounded-lg border ${formData.canStand10min ? 'bg-rose-600 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>Yes</button>
                    <button type="button" onClick={() => updateField('canStand10min', false)} className={`flex-1 p-3 rounded-lg border ${!formData.canStand10min ? 'bg-rose-600 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>No</button>
                 </div>
              </div>

               <div>
                 <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">Any leaks when coughing?</label>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => updateField('leakingIssue', true)} className={`flex-1 p-3 rounded-lg border ${formData.leakingIssue ? 'bg-amber-500 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>Yes</button>
                    <button type="button" onClick={() => updateField('leakingIssue', false)} className={`flex-1 p-3 rounded-lg border ${!formData.leakingIssue ? 'bg-rose-600 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>No</button>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">Previous Fitness Level</label>
                <select
                  value={formData.previousFitness}
                  onChange={(e) => updateField('previousFitness', e.target.value)}
                  className="w-full p-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="sedentary">Sedentary (Office Job)</option>
                  <option value="light">Lightly Active</option>
                  <option value="active">Active (Regular Exercise)</option>
                  <option value="veryactive">Very Active (Intense)</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.culturalContext} onChange={(e) => updateField('culturalContext', e.target.checked)} className="w-5 h-5 accent-rose-600"/>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Include cultural wellness advice (South Asian/Middle Eastern)</span>
                </label>
              </div>
            </>
          )}

          {/* NAVIGATION */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-4 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> {t('back')}
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-3 px-4 bg-stone-900 dark:bg-stone-700 text-white font-semibold rounded-xl hover:bg-stone-800 dark:hover:bg-stone-600 flex items-center justify-center gap-2"
              >
                {t('next')} <ArrowRight size={18} />
              </button>
            ) : (
               <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-200 dark:shadow-none"
              >
                {isLoading ? t('analyzing') : t('generate')} <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
    