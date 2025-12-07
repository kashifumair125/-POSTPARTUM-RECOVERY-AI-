import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Battery, AlertCircle, Activity } from 'lucide-react';

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
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 p-6 text-white text-center">
        <h2 className="text-xl font-bold tracking-wide">
          {step === 1 && "Step 1: The Basics"}
          {step === 2 && "Step 2: Body Check"}
          {step === 3 && "Step 3: Capabilities"}
        </h2>
        <p className="text-slate-400 text-sm mt-1">Personalizing your 12-week roadmap</p>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          
          {/* STEP 1: ASSESSMENT QUESTIONS */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Delivery Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['vaginal', 'csection'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('delivery', type)}
                      className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        formData.delivery === type
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {type === 'vaginal' ? 'Vaginal Delivery' : 'C-Section'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">
                  Weeks Postpartum: <span className="text-teal-600 text-lg">{formData.weeksPostpartum}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="52"
                  value={formData.weeksPostpartum}
                  onChange={(e) => updateField('weeksPostpartum', parseInt(e.target.value))}
                  className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Pain Level (1-10)</label>
                <div className="flex items-center gap-4">
                   <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.painLevel}
                    onChange={(e) => updateField('painLevel', parseInt(e.target.value))}
                    className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="font-bold text-slate-700">{formData.painLevel}</span>
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Any Specific Body Concerns?</label>
                <textarea
                  value={formData.bodyConcerns}
                  onChange={(e) => updateField('bodyConcerns', e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  rows={2}
                  placeholder="e.g. My abs feel separated, back hurts when lifting baby..."
                />
              </div>
            </>
          )}

          {/* STEP 2: BODY ASSESSMENT */}
          {step === 2 && (
            <>
               <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2">
                 <AlertCircle className="text-blue-600 shrink-0" size={20} />
                 <p className="text-xs text-blue-800">Touch your belly while lying down and lifting your head slightly ("mini crunch") to answer these.</p>
               </div>

               <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">1. How does your belly look?</label>
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
                        formData.bellyAppearance === opt ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">2. When you touch, can you feel:</label>
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
                        formData.gapFeel === opt ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">3. Do you experience any of these?</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Bulging when coughing/sneezing',
                    'Heaviness in lower belly',
                    'Lower back pain',
                    'Pelvic pressure',
                  ].map(symptom => (
                    <label key={symptom} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.symptoms_body.includes(symptom)}
                        onChange={() => toggleArrayItem('symptoms_body', symptom)}
                        className="w-5 h-5 accent-teal-600 rounded"
                      />
                      <span className="text-sm text-slate-700">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">4. Energy Level?</label>
                <div className="flex items-center gap-4">
                  <Battery className="text-amber-500" size={24} />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energyLevel}
                    onChange={(e) => updateField('energyLevel', parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="font-bold text-slate-700">{formData.energyLevel}</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: CAPABILITY */}
          {step === 3 && (
            <>
              <div>
                 <label className="block text-sm font-bold text-slate-800 mb-3">Can you walk comfortably?</label>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => updateField('canWalk', true)} className={`flex-1 p-3 rounded-lg border ${formData.canWalk ? 'bg-teal-600 text-white' : 'bg-slate-50'}`}>Yes</button>
                    <button type="button" onClick={() => updateField('canWalk', false)} className={`flex-1 p-3 rounded-lg border ${!formData.canWalk ? 'bg-rose-600 text-white' : 'bg-slate-50'}`}>No</button>
                 </div>
              </div>

               <div>
                 <label className="block text-sm font-bold text-slate-800 mb-3">Can you stand for 10 mins?</label>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => updateField('canStand10min', true)} className={`flex-1 p-3 rounded-lg border ${formData.canStand10min ? 'bg-teal-600 text-white' : 'bg-slate-50'}`}>Yes</button>
                    <button type="button" onClick={() => updateField('canStand10min', false)} className={`flex-1 p-3 rounded-lg border ${!formData.canStand10min ? 'bg-rose-600 text-white' : 'bg-slate-50'}`}>No</button>
                 </div>
              </div>

               <div>
                 <label className="block text-sm font-bold text-slate-800 mb-3">Any leaks when coughing?</label>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => updateField('leakingIssue', true)} className={`flex-1 p-3 rounded-lg border ${formData.leakingIssue ? 'bg-amber-500 text-white' : 'bg-slate-50'}`}>Yes</button>
                    <button type="button" onClick={() => updateField('leakingIssue', false)} className={`flex-1 p-3 rounded-lg border ${!formData.leakingIssue ? 'bg-teal-600 text-white' : 'bg-slate-50'}`}>No</button>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Previous Fitness Level</label>
                <select
                  value={formData.previousFitness}
                  onChange={(e) => updateField('previousFitness', e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="sedentary">Sedentary (Office Job)</option>
                  <option value="light">Lightly Active</option>
                  <option value="active">Active (Regular Exercise)</option>
                  <option value="veryactive">Very Active (Intense)</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.culturalContext} onChange={(e) => updateField('culturalContext', e.target.checked)} className="w-5 h-5 accent-teal-600"/>
                  <span className="text-sm font-medium text-slate-700">Include cultural wellness advice (South Asian/Middle Eastern)</span>
                </label>
              </div>
            </>
          )}

          {/* NAVIGATION */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={18} />
              </button>
            ) : (
               <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
              >
                {isLoading ? 'Analyzing...' : 'Generate Plan'} <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
