
import React, { useState, useEffect, useMemo } from 'react';
import { RecoveryPlan, RecoveryPhase, Exercise } from '../types';
import { ChevronDown, ChevronUp, Calendar, Info, Globe, AlertOctagon, MessageSquare, X, Clock, Repeat, CheckCircle, Video, List, Volume2, Square, Settings, RefreshCcw, Sparkles, Trophy, Flame, Check } from 'lucide-react';
import VideoLab from './VideoLab';
import ExerciseAnimation from './ExerciseAnimation';
import { analyzeExerciseFeedback } from '../services/geminiService';
import { loadState, toggleExerciseCompletion, calculateStreak, getTodayDate } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  plan: RecoveryPlan;
  logs: Record<string, string[]>;
  onToggleExercise: (name: string) => void;
}

// --- SUB-COMPONENT: WEEKLY TRACKER ---
const WeeklyTracker: React.FC<{ logs: Record<string, string[]> }> = ({ logs }) => {
  const { t } = useLanguage();
  // Generate last 7 days based on Local Time
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localToday = new Date(d.getTime() - (offset * 60 * 1000));
    
    // Calculate date backwards from today (i=6 is today, i=0 is 6 days ago)
    localToday.setDate(localToday.getDate() - (6 - i));
    const dateStr = localToday.toISOString().split('T')[0];
    
    return {
      date: dateStr,
      dayLabel: localToday.toLocaleDateString('en-US', { weekday: 'narrow' }), // M, T, W...
      hasLog: logs[dateStr] && logs[dateStr].length > 0,
      isToday: i === 6
    };
  });

  return (
    <div className="flex items-center justify-between gap-2 mt-6 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
      {days.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-2 group cursor-default" title={day.date}>
           <span className={`text-[10px] font-bold uppercase transition-colors ${day.isToday ? 'text-white' : 'text-white/60'}`}>{day.dayLabel}</span>
           <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
             day.hasLog 
               ? 'bg-green-400 border-green-400 text-stone-900 shadow-[0_0_10px_rgba(74,222,128,0.3)] scale-100' 
               : day.isToday 
                 ? 'border-white/40 bg-white/10 text-transparent scale-105'
                 : 'border-white/10 text-transparent'
           }`}>
              {day.hasLog && <Check size={16} strokeWidth={4} />}
           </div>
        </div>
      ))}
      <div className="hidden sm:block h-8 w-px bg-white/10 mx-2"></div>
      <div className="hidden sm:flex flex-col justify-center">
          <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">{t('consistency')}</span>
          <span className="text-xs text-white font-medium">Keep it up!</span>
      </div>
    </div>
  );
};

const ExerciseCard: React.FC<{ 
  exercise: Exercise; 
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ exercise, isCompleted, onToggle }) => {
  const { t, language } = useLanguage();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isAvoidExpanded, setIsAvoidExpanded] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Try to find a voice matching the current language
      const langPrefix = language === 'en' ? 'en' : language;
      const matchingVoices = allVoices.filter(v => v.lang.startsWith(langPrefix));
      
      if (matchingVoices.length > 0) {
        setVoices(matchingVoices);
        setSelectedVoice(matchingVoices[0]);
      } else {
        // Fallback to all voices if no specific match
        setVoices(allVoices);
        setSelectedVoice(allVoices[0]);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [language]);

  const handleGetFeedback = async () => {
    if (!feedbackText.trim()) return;
    setLoadingAdvice(true);
    try {
      const advice = await analyzeExerciseFeedback(exercise.name, feedbackText, language);
      setAiAdvice(advice);
    } catch (e) {
      setAiAdvice("Could not analyze feedback. Try again.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  const speakInstructions = () => {
    if (!('speechSynthesis' in window)) return;
    const script = `${exercise.name}. ${exercise.description}. ${exercise.howTo.join('. ')}.`;
    const utterance = new SpeechSynthesisUtterance(script);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.95; 
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const avoidText = exercise.whenToAvoid || "";
  const TRUNCATE_LENGTH = 50;
  const shouldTruncate = avoidText.length > TRUNCATE_LENGTH;

  return (
    <>
      <div className={`bg-white dark:bg-stone-900 rounded-xl border transition-all duration-300 overflow-hidden flex flex-col h-full group ${isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 shadow-md ring-1 ring-green-200 dark:ring-green-900' : 'border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md'}`}>
        <div className="p-5 flex-grow relative">
          {/* Complete Button Overlay */}
          <button 
            onClick={onToggle}
            className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all ${isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 scale-110 shadow-sm' : 'bg-stone-100 text-stone-300 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-600 dark:hover:text-stone-400'}`}
            title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
          >
            <CheckCircle size={24} fill={isCompleted ? "currentColor" : "none"} />
          </button>

          <div className="flex flex-col gap-3 mb-4 pr-10">
             <div className="flex justify-between items-start">
                 <h3 className={`font-bold text-lg leading-tight transition-all ${isCompleted ? 'text-green-800 dark:text-green-300 decoration-green-500/30' : 'text-stone-800 dark:text-stone-100'}`}>
                   {exercise.name} {isCompleted && <span className="text-xs font-normal text-green-600 ml-1">(Done)</span>}
                 </h3>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md border border-stone-200 dark:border-stone-700 w-fit">
                {exercise.visualTag.replace('_', ' ')}
             </span>
            
            <div className="flex flex-wrap gap-2 mt-1">
              <button 
                onClick={() => setShowDemoModal(true)}
                className="text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-900/50"
              >
                <Video size={14} /> 3D Guide
              </button>

              <div className="relative flex items-center">
                 <button 
                  onClick={() => isSpeaking ? window.speechSynthesis.cancel() : speakInstructions()}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors border ${isSpeaking ? 'bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse' : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'}`}
                >
                  {isSpeaking ? <Square size={12} fill="currentColor" /> : <Volume2 size={14} />}
                  {isSpeaking ? 'Stop' : 'Voice'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-300 mb-4 font-medium leading-relaxed">{exercise.description}</p>
          
          <div className="mb-5 bg-gradient-to-br from-rose-50/50 to-transparent dark:from-rose-900/10 dark:to-transparent p-4 rounded-xl border border-rose-100 dark:border-rose-900/20">
             <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sparkles size={14} /> How it helps
             </h4>
             <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
               {exercise.benefits}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
               <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase">
                 <Repeat size={12} /> Reps
               </div>
               <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{exercise.reps}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
               <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 mb-1 uppercase">
                 <AlertOctagon size={12} /> Avoid If
               </div>
               <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-tight">
                 {shouldTruncate && !isAvoidExpanded 
                   ? `${avoidText.substring(0, TRUNCATE_LENGTH)}...` 
                   : avoidText}
                 
                 {shouldTruncate && (
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setIsAvoidExpanded(!isAvoidExpanded);
                     }}
                     className="ml-1 font-bold underline decoration-amber-500/50 hover:decoration-amber-500 cursor-pointer focus:outline-none"
                   >
                     {isAvoidExpanded ? "less" : "more"}
                   </button>
                 )}
               </p>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 mt-auto">
          <button 
             onClick={() => setShowFeedback(!showFeedback)}
             className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${showFeedback ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'}`}
           >
             <MessageSquare size={16} /> {t('coach')}
           </button>

          {showFeedback && (
            <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-950 rounded-xl animate-fade-in border border-stone-200 dark:border-stone-800">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-2">Live AI Coach</h4>
              {!aiAdvice ? (
                <>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe how it feels..."
                    className="w-full p-3 text-sm border border-stone-300 dark:border-stone-700 rounded-lg mb-3 focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-stone-900 dark:text-stone-100"
                    rows={2}
                  />
                  <button 
                    onClick={handleGetFeedback}
                    disabled={loadingAdvice || !feedbackText}
                    className="w-full py-2 bg-stone-900 dark:bg-white dark:text-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800 disabled:opacity-50"
                  >
                    {loadingAdvice ? 'Thinking...' : 'Get Advice'}
                  </button>
                </>
              ) : (
                <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30 text-sm">
                   <p>{aiAdvice}</p>
                   <button onClick={() => setAiAdvice(null)} className="text-xs text-rose-500 mt-2 underline">Ask Again</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border border-stone-200 dark:border-stone-800">
              <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950 shrink-0">
                 <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">{exercise.name}</h3>
                 <button onClick={() => setShowDemoModal(false)} className="p-2 text-stone-500"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto bg-stone-50 dark:bg-stone-950">
                 <div className="relative aspect-video w-full block bg-stone-900 overflow-hidden">
                    <ExerciseAnimation visualTag={exercise.visualTag} exerciseName={exercise.name} />
                 </div>
                 <div className="p-6">
                    <ul className="space-y-4">
                      {exercise.howTo.map((step, i) => (
                        <li key={i} className="flex gap-4">
                           <span className="shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i+1}</span>
                           <span className="text-stone-700 dark:text-stone-300 text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

const PhaseCard: React.FC<{ 
  phase: RecoveryPhase; 
  isOpen: boolean; 
  toggle: () => void;
  logs: string[];
  onToggleExercise: (name: string) => void;
}> = ({ phase, isOpen, toggle, logs, onToggleExercise }) => {
  const [isTipExpanded, setIsTipExpanded] = useState(false);
  const total = phase.exercises.length;
  const completed = phase.exercises.filter(ex => logs.includes(ex.name)).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Dynamic color based on progress
  const progressColor = progress === 100 
    ? 'bg-green-500' 
    : progress >= 50 
      ? 'bg-rose-500' 
      : 'bg-rose-400';

  return (
    <div className={`border rounded-xl mb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'border-rose-200 bg-rose-50/30 dark:bg-rose-900/10 shadow-md ring-1 ring-rose-100 dark:ring-rose-900/50' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'}`}>
      <button onClick={toggle} className="w-full flex items-center justify-between p-5 text-left focus:outline-none">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
            <Calendar size={14} /> {phase.weekRange}
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-3">{phase.phaseName}</h3>
          
          <div className="space-y-1.5">
             <div className="flex justify-between items-end text-xs font-bold">
                <span className={`${progress === 100 ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'}`}>
                   {progress === 100 ? 'Complete!' : `${progress}% Complete`}
                </span>
                <span className="text-stone-400">{completed}/{total}</span>
             </div>
             <div className="h-2.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
               <div className={`h-full ${progressColor} transition-all duration-700 ease-out`} style={{ width: `${progress}%` }}></div>
             </div>
          </div>
        </div>
        <div className={`ml-4 p-2 rounded-full transition-colors ${isOpen ? 'bg-white/50 dark:bg-black/20 text-rose-600' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>
             {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-8 border-t border-rose-100 dark:border-rose-900/30 animate-fade-in bg-stone-50/50 dark:bg-stone-950/50">
          <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed py-4 max-w-2xl">{phase.description}</p>
          {phase.culturalTip && (
            <div 
              onClick={() => setIsTipExpanded(!isTipExpanded)}
              className="mb-6 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 flex items-start gap-3 shadow-sm cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors group"
            >
              <Globe className="text-purple-600 dark:text-purple-400 mt-1 shrink-0 group-hover:scale-110 transition-transform" size={18} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                   <span className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Holistic Wellness</span>
                   <div className="text-purple-400">
                     {isTipExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </div>
                </div>
                <p className={`text-sm text-purple-900 dark:text-purple-100 leading-relaxed ${isTipExpanded ? '' : 'line-clamp-1 opacity-80'}`}>
                  {phase.culturalTip}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phase.exercises.map((ex, idx) => (
              <ExerciseCard 
                key={idx} 
                exercise={ex} 
                isCompleted={logs.includes(ex.name)}
                onToggle={() => onToggleExercise(ex.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Circular Progress Component for Summary
const DailyProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
  const radius = 30;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
       <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
         <circle
           stroke="rgba(255, 255, 255, 0.1)"
           strokeWidth={stroke}
           fill="transparent"
           r={normalizedRadius}
           cx={radius}
           cy={radius}
         />
         <circle
           stroke="currentColor"
           fill="transparent"
           strokeWidth={stroke}
           strokeDasharray={circumference + ' ' + circumference}
           style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
           strokeLinecap="round"
           r={normalizedRadius}
           cx={radius}
           cy={radius}
           className="text-rose-400"
         />
       </svg>
       <div className="absolute flex flex-col items-center">
         <span className="text-xl font-bold text-white">{progress}%</span>
       </div>
    </div>
  );
};

const RecoveryPlanView: React.FC<Props> = ({ plan, logs, onToggleExercise }) => {
  const { t } = useLanguage();
  
  // Logic to augment plan if fewer than 3 breathing exercises exist
  const displayPlan = useMemo(() => {
    // Clone plan to avoid mutating props
    const augmented = JSON.parse(JSON.stringify(plan)) as RecoveryPlan;
    
    // Count breathing exercises (specifically checks lying_back + breath keywords)
    let breathingCount = 0;
    augmented.phases.forEach(phase => {
      phase.exercises.forEach(ex => {
        if (ex.visualTag === 'lying_back' && 
           (ex.name.toLowerCase().includes('breath') || ex.description.toLowerCase().includes('breath') || ex.benefits.toLowerCase().includes('breath'))) {
          breathingCount++;
        }
      });
    });

    // Inject 'Diaphragmatic Breath Hold' if needed
    if (breathingCount < 3 && augmented.phases.length > 0) {
      const breathingExercise: Exercise = {
        name: 'Diaphragmatic Breath Hold',
        reps: '3-5 breaths',
        frequency: '1-2x per day',
        description: 'Deep belly breathing to activate the transverse abdominis and promote relaxation.',
        benefits: 'Helps calm the nervous system, aids in re-engaging deep core muscles postpartum, and can reduce stress.',
        howTo: [
          'Lie comfortably on your back with knees bent and feet flat on the floor.',
          'Place one hand on your chest and the other on your belly.',
          'Inhale slowly through your nose, allowing your belly to rise more than your chest.',
          'Hold your breath for 2-3 seconds at the peak of the inhale.',
          'Exhale slowly through your mouth, feeling your belly fall.',
          'Repeat for 5-8 cycles.'
        ],
        whenToAvoid: 'Stop if you feel any dizziness or discomfort.',
        visualTag: 'lying_back'
      };

      // Add to first phase (Reconnection & Restore) if not already present
      const phase1 = augmented.phases[0];
      if (!phase1.exercises.some(e => e.name === breathingExercise.name)) {
        phase1.exercises.unshift(breathingExercise);
      }
    }
    
    return augmented;
  }, [plan]);

  const [openPhase, setOpenPhase] = useState<number>(0);
  const today = getTodayDate();
  const todaysLogs = logs[today] || [];
  const streak = calculateStreak(logs);

  // Calculate daily progress based on OPEN/ACTIVE phase
  const activePhase = displayPlan.phases[openPhase !== -1 ? openPhase : 0];
  const activeTotal = activePhase?.exercises.length || 0;
  const activeCompleted = activePhase?.exercises.filter(ex => todaysLogs.includes(ex.name)).length || 0;
  const activeProgress = activeTotal > 0 ? Math.round((activeCompleted / activeTotal) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
      {/* Dashboard Summary */}
      <div className="bg-stone-900 dark:bg-stone-800 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-xl border-b-4 border-rose-500 relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2">
             <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('welcome')}</h1>
             <p className="text-stone-300 leading-relaxed text-sm md:text-base opacity-90">{displayPlan.summary}</p>
             
             {/* Integrated Weekly Progress */}
             <WeeklyTracker logs={logs} />
           </div>
           
           <div className="flex gap-4 md:justify-end items-center">
              <div className="hidden md:block">
                  <DailyProgressRing progress={activeProgress} />
                  <div className="text-center text-[10px] uppercase font-bold text-white/60 mt-1 tracking-wider">Phase Progress</div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="bg-white/10 backdrop-blur-md p-3 px-4 rounded-xl border border-white/10 text-center min-w-[90px]">
                   <div className="flex justify-center text-amber-400 mb-1"><Flame size={18} fill="currentColor" /></div>
                   <div className="text-xl font-bold leading-none">{streak}</div>
                   <div className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Streak</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 px-4 rounded-xl border border-white/10 text-center min-w-[90px]">
                   <div className="flex justify-center text-green-400 mb-1"><CheckCircle size={18} /></div>
                   <div className="text-xl font-bold leading-none">{todaysLogs.length}</div>
                   <div className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Done</div>
                </div>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('dailyPlan')}</h2>
             <span className="text-xs font-bold text-stone-500 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 px-3 py-1 rounded-full">{getTodayDate()}</span>
          </div>
          {displayPlan.phases.map((phase, idx) => (
            <PhaseCard 
              key={idx} 
              phase={phase} 
              isOpen={openPhase === idx} 
              toggle={() => setOpenPhase(openPhase === idx ? -1 : idx)}
              logs={todaysLogs}
              onToggleExercise={onToggleExercise}
            />
          ))}
        </div>

        <div className="lg:col-span-1 order-1 lg:order-2">
           <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 shadow-sm">
                 <h3 className="text-indigo-900 dark:text-indigo-200 font-bold mb-3 text-lg flex items-center gap-2">
                   <AlertOctagon size={20} /> {t('aiLab')}
                 </h3>
                 <p className="text-indigo-800 dark:text-indigo-300 text-sm mb-5 leading-relaxed">
                   Check your form for <strong>{activePhase?.exercises[0]?.name || "Core Engagement"}</strong>.
                 </p>
                 <VideoLab exerciseName={activePhase?.exercises[0]?.name || "Core Engagement"} />
              </div>
              {displayPlan.diastasisNote && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200 mb-2 text-sm uppercase tracking-wide">
                      <Info size={16} /> Diastasis Care
                    </div>
                    <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">{displayPlan.diastasisNote}</p>
                  </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPlanView;
