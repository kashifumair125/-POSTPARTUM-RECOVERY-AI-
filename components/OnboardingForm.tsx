import React, { useState } from 'react';
import { UserProfile, DeliveryMethod, ActivityLevel } from '../types';
import { Baby, Globe2, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingForm: React.FC<Props> = ({ onComplete }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    deliveryMethod: DeliveryMethod.VAGINAL,
    weeksPostpartum: 0,
    symptoms: '',
    culturalContext: true,
    activityLevel: ActivityLevel.LIGHT,
    energyLevel: 5,
    painLevel: 1,
    diastasisInfo: {
      bellyAppearance: 'Normal',
      gapFeel: 'Not sure',
      bulging: false,
    },
    capabilities: {
      canWalk: true,
      canStand: true,
      leaking: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(profile);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-teal-100 rounded-full text-teal-600 mb-4">
          <Baby size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Let's personalize your recovery</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Safe, judgment-free guidance tailored to your body.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Method</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(DeliveryMethod).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setProfile({...profile, deliveryMethod: method})}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  profile.deliveryMethod === method 
                    ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500' 
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Weeks Postpartum</label>
            <input 
              type="number" 
              min="0" 
              max="100"
              required
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"
              value={profile.weeksPostpartum || ''}
              onChange={(e) => setProfile({...profile, weeksPostpartum: parseInt(e.target.value) || 0})}
              placeholder="e.g. 6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pre-baby Activity</label>
            <select 
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
              value={profile.activityLevel}
              onChange={(e) => setProfile({...profile, activityLevel: e.target.value as ActivityLevel})}
            >
              {Object.values(ActivityLevel).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Current Symptoms & Concerns
          </label>
          <textarea 
            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none min-h-[100px] placeholder-slate-400"
            placeholder="e.g. Lower back pain, leaking when sneezing, feeling weak..."
            value={profile.symptoms}
            onChange={(e) => setProfile({...profile, symptoms: e.target.value})}
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setProfile({...profile, culturalContext: !profile.culturalContext})}>
          <div className="mt-0.5">
             <input 
                type="checkbox" 
                checked={profile.culturalContext}
                onChange={(e) => setProfile({...profile, culturalContext: e.target.checked})}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                onClick={(e) => e.stopPropagation()} 
              />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <Globe2 className="text-teal-600" size={18} />
               <label className="font-medium text-slate-800 text-sm cursor-pointer">Cultural Wellness Context</label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Include specific advice from South Asian & Middle Eastern traditions (e.g., confinement diet, wrapping) where medically safe.
            </p>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-[0.98] transform"
        >
          Create My Roadmap <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};

export default OnboardingForm;