import React, { useState, useEffect, useRef } from 'react';
import { RecoveryPlan, RecoveryPhase, Exercise } from '../types';
import { ChevronDown, ChevronUp, Calendar, Info, Globe, AlertOctagon, MessageSquare, PlayCircle, X, Clock, Repeat, CheckCircle, Video, Loader2, List, Volume2, Square, RefreshCcw, Settings } from 'lucide-react';
import VideoLab from './VideoLab';
import { analyzeExerciseFeedback } from '../services/geminiService';

interface Props {
  plan: RecoveryPlan;
}

// Maps the 'visualTag' from the Exercise type to a specific video URL
// These videos loop to simulate animated GIFs for form demonstration
// Updated to more reliable Pexels direct video links
const EXERCISE_VIDEOS: Record<string, string> = {
  // Yoga/Mat work (gentle re-engagement)
  'lying_back': 'https://videos.pexels.com/video-files/6706968/6706968-sd_640_360_25fps.mp4', 
  // Cat-Cow / Quadruped (stability)
  'all_fours': 'https://videos.pexels.com/video-files/5385966/5385966-sd_640_360_25fps.mp4',
  // Standing stretches (posture)
  'standing': 'https://videos.pexels.com/video-files/4057314/4057314-sd_640_360_25fps.mp4',
  // Seated breathing/meditation (connection)
  'seated': 'https://videos.pexels.com/video-files/8953931/8953931-sd_640_360_25fps.mp4', 
  // Plank/Strength (advanced core)
  'plank': 'https://videos.pexels.com/video-files/4944983/4944983-sd_640_360_25fps.mp4',
};

const ExerciseCard: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  // Modal & Video States
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  
  // Voice State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      
      // Try to load from local storage
      const savedVoiceName = localStorage.getItem('postpartum_ai_voice');
      if (savedVoiceName) {
        const saved = available.find(v => v.name === savedVoiceName);
        if (saved) {
           setSelectedVoice(saved);
           return;
        }
      }

      // Default heuristic for female voices
      const preferred = available.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') ||
        v.name.toLowerCase().includes('female')
      ) || available[0];
      
      setSelectedVoice(preferred);
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Video Loading Safety Timeout
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showDemoModal && videoLoading) {
      timeout = setTimeout(() => {
        // If still loading after 8 seconds, force error state
        if (videoLoading) {
          setVideoLoading(false);
          setVideoError(true);
        }
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [showDemoModal, videoLoading]);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceName = e.target.value;
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      localStorage.setItem('postpartum_ai_voice', voiceName);
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const handleGetFeedback = async () => {
    if (!feedbackText.trim()) return;
    setLoadingAdvice(true);
    try {
      const advice = await analyzeExerciseFeedback(exercise.name, feedbackText);
      setAiAdvice(advice);
    } catch (e) {
      setAiAdvice("Could not analyze feedback. Try again.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Map the visualTag to the correct video URL
  const videoUrl = EXERCISE_VIDEOS[exercise.visualTag] || EXERCISE_VIDEOS['standing'];

  const openDemo = () => {
    setVideoLoading(true);
    setVideoError(false);
    setShowDemoModal(true);
  };

  const closeDemo = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setShowDemoModal(false);
  };

  const toggleVoiceGuide = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const script = `
        Let's do the ${exercise.name}.
        Target Reps: ${exercise.reps}.
        
        Here are the steps:
        ${exercise.howTo.join('. ')}.
        
        ${exercise.safetyNote ? `Please be careful: ${exercise.safetyNote}` : ''}
      `;

      const utterance = new SpeechSynthesisUtterance(script);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md overflow-hidden flex flex-col h-full group">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{exercise.name}</h3>
            {/* Animation Button Mapped to visualTag */}
            <button 
               onClick={openDemo}
               className="shrink-0 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100"
               title="View correct form animation"
            >
              <Video size={14} /> Watch Animation
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">{exercise.description}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
               <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1 uppercase">
                 <Repeat size={12} /> Frequency
               </div>
               <p className="text-sm font-semibold text-slate-800">{exercise.reps}</p>
               <p className="text-xs text-slate-500">{exercise.frequency}</p>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
               <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mb-1 uppercase">
                 <AlertOctagon size={12} /> Avoid If
               </div>
               <p className="text-xs font-medium text-rose-800 leading-tight">{exercise.whenToAvoid}</p>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 mt-auto">
          <div className="pt-4 border-t border-slate-100">
             <button 
               onClick={() => setShowFeedback(!showFeedback)}
               className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${showFeedback ? 'bg-slate-100 text-slate-600' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'}`}
             >
               <MessageSquare size={16} /> {showFeedback ? 'Cancel Feedback' : 'Step 4: Test & Feedback'}
             </button>
          </div>

          {showFeedback && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl animate-fade-in border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <CheckCircle size={14} className="text-teal-600" /> Live AI Coach
              </h4>
              {!aiAdvice ? (
                <>
                  <p className="text-xs text-slate-500 mb-2">Perform 2-3 reps. Tell me exactly what you feel (e.g., pulling, pain, shaking).</p>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g. I felt my lower back arching..."
                    className="w-full p-3 text-sm border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-teal-500 outline-none bg-white shadow-sm"
                    rows={2}
                  />
                  <button 
                    onClick={handleGetFeedback}
                    disabled={loadingAdvice || !feedbackText}
                    className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {loadingAdvice ? 'Analyzing your form...' : 'Get Instant Feedback'}
                  </button>
                </>
              ) : (
                <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm relative">
                   <button onClick={() => { setAiAdvice(null); setFeedbackText(""); }} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                   <div className="flex items-center gap-2 text-sm font-bold text-teal-700 mb-2">
                       <Info size={16} /> Correction
                   </div>
                   <p className="text-sm text-slate-700 leading-relaxed">{aiAdvice}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL for Video & Instructions */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                 <div className="flex flex-col">
                   <h3 className="font-bold text-lg text-slate-800">{exercise.name}</h3>
                   <span className="text-xs text-slate-500 font-medium">Form Animation: <span className="uppercase">{exercise.visualTag.replace('_', ' ')}</span></span>
                 </div>
                 <button onClick={closeDemo} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={20}/></button>
              </div>
              
              <div className="overflow-y-auto overflow-x-hidden custom-scrollbar">
                 {/* Video Player simulating GIF */}
                 <div className="relative aspect-video bg-black w-full flex items-center justify-center bg-slate-900">
                    {videoLoading && !videoError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white">
                        <Loader2 className="animate-spin mb-2" size={32}/>
                        <span className="text-xs opacity-80">Loading animation...</span>
                      </div>
                    )}
                    
                    {videoError ? (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center w-full">
                        <AlertOctagon size={32} className="mb-2 text-slate-500"/>
                        <p className="text-sm font-medium">Animation Unavailable</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">The video could not be loaded. Please check your connection.</p>
                        <button 
                          onClick={() => { setVideoError(false); setVideoLoading(true); }}
                          className="mt-3 flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <RefreshCcw size={12} /> Retry
                        </button>
                      </div>
                    ) : (
                      <video 
                         src={videoUrl} 
                         className={`w-full h-full object-contain transition-opacity duration-500 ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                         autoPlay 
                         loop 
                         muted 
                         playsInline
                         preload="auto"
                         onCanPlay={() => setVideoLoading(false)}
                         onLoadedData={() => setVideoLoading(false)}
                         onError={(e) => { 
                            console.error("Video Error:", e);
                            setVideoLoading(false); 
                            setVideoError(true); 
                         }}
                      />
                    )}
                 </div>

                 <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-3">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                         <List size={20} className="text-teal-600"/> Step-by-Step Guide
                      </h4>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0 min-w-[140px]">
                           <select 
                              value={selectedVoice?.name || ''}
                              onChange={handleVoiceChange}
                              className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg py-1.5 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
                           >
                             {voices.map(v => (
                               <option key={v.name} value={v.name}>
                                 {v.name.replace(/Microsoft|Google|English|United States/g, '').trim().substring(0, 15)} {v.name.toLowerCase().includes('female') ? '(F)' : ''}
                               </option>
                             ))}
                           </select>
                           <Settings size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        <button 
                          onClick={toggleVoiceGuide}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${isSpeaking ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                        >
                           {isSpeaking ? <Square size={12} fill="currentColor" /> : <Volume2 size={14} />}
                           {isSpeaking ? 'Stop' : 'Voice Guide'}
                        </button>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {(exercise.howTo || []).map((step, i) => (
                        <li key={i} className="flex gap-4 group">
                           <span className="shrink-0 w-7 h-7 bg-slate-100 text-slate-600 group-hover:bg-teal-600 group-hover:text-white transition-colors rounded-full flex items-center justify-center text-sm font-bold mt-0.5 border border-slate-200">{i+1}</span>
                           <span className="text-slate-700 leading-relaxed text-sm md:text-base">{step}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {exercise.safetyNote && (
                       <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 flex gap-3">
                          <AlertOctagon className="shrink-0 text-amber-600" size={20} />
                          <div>
                            <strong className="block text-amber-900 mb-1">Safety First</strong>
                            {exercise.safetyNote}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-right shrink-0">
                 <button onClick={closeDemo} className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">Close</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

const PhaseCard: React.FC<{ phase: RecoveryPhase; isOpen: boolean; toggle: () => void }> = ({ phase, isOpen, toggle }) => {
  return (
    <div className={`border rounded-xl mb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'border-teal-200 bg-teal-50/20 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <button 
        onClick={toggle}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <Calendar size={14} />
            {phase.weekRange}
          </div>
          <h3 className="text-lg font-bold text-slate-800">{phase.phaseName}</h3>
          <p className="text-sm text-slate-500 mt-1">{phase.focus}</p>
        </div>
        {isOpen ? <ChevronUp className="text-teal-500 shrink-0" /> : <ChevronDown className="text-slate-400 shrink-0" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-8 border-t border-teal-100/50 animate-fade-in bg-slate-50/30">
          <p className="text-slate-600 text-sm leading-relaxed py-4 max-w-2xl">{phase.description}</p>
          
          {phase.culturalTip && (
            <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3 shadow-sm">
              <Globe className="text-purple-600 mt-1 shrink-0" size={18} />
              <div>
                <span className="block text-xs font-bold text-purple-700 uppercase mb-1">Holistic Wellness</span>
                <p className="text-sm text-purple-900 leading-relaxed">{phase.culturalTip}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-2">
              <Clock size={18} /> Daily Routine
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {phase.exercises.map((ex, idx) => (
                <div key={idx} className="h-full">
                  <ExerciseCard exercise={ex} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecoveryPlanView: React.FC<Props> = ({ plan }) => {
  const [openPhase, setOpenPhase] = useState<number>(0);

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
      {/* Header Summary */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-xl border-b-4 border-teal-500 relative overflow-hidden">
        <div className="relative z-10">
           <h1 className="text-2xl md:text-3xl font-bold mb-4">Your Recovery Roadmap</h1>
           <p className="text-slate-200 leading-relaxed text-base md:text-lg opacity-90 max-w-3xl">{plan.summary}</p>
           
           {plan.diastasisNote && (
              <div className="mt-6 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 inline-block">
                <div className="flex items-center gap-2 font-bold text-teal-300 mb-1 text-sm uppercase tracking-wide">
                  <Info size={16} /> Diastasis Care Note
                </div>
                <p className="text-sm text-white">{plan.diastasisNote}</p>
              </div>
           )}
        </div>
        {/* Decorative bg element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Phases */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-slate-800">Weekly Progression</h2>
             <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">12 Weeks Total</span>
          </div>
          {plan.phases.map((phase, idx) => (
            <PhaseCard 
              key={idx} 
              phase={phase} 
              isOpen={openPhase === idx} 
              toggle={() => setOpenPhase(openPhase === idx ? -1 : idx)} 
            />
          ))}
        </div>

        {/* Sidebar: Tools */}
        <div className="lg:col-span-1 order-1 lg:order-2">
           <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                 <h3 className="text-indigo-900 font-bold mb-3 text-lg flex items-center gap-2">
                   <AlertOctagon size={20} /> AI Video Lab
                 </h3>
                 <p className="text-indigo-800 text-sm mb-5 leading-relaxed">
                   Not sure if you're doing it right? Upload a 5-second video of you doing the <strong>{plan.phases[0]?.exercises[0]?.name}</strong> and let Gemini check your form.
                 </p>
                 <VideoLab exerciseName={plan.phases[openPhase !== -1 ? openPhase : 0]?.exercises[0]?.name || "Core Engagement"} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPlanView;