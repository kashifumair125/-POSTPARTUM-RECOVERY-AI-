
import React, { useState } from 'react';
import { analyzeDiastasisImage } from '../services/geminiService';
import { DiastasisAnalysis } from '../types';
import { Camera, AlertCircle, Loader2, CheckCircle2, ThumbsUp, ThumbsDown, ArrowRight, Info } from 'lucide-react';

interface Props {
  weeksPostpartum: number;
  onAnalysisComplete: (result: DiastasisAnalysis) => void;
  onSkip: () => void;
}

const BellyAnalyzer: React.FC<Props> = ({ weeksPostpartum, onAnalysisComplete, onSkip }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DiastasisAnalysis | null>(null);
  
  // Feedback State
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // New State for Symptoms
  const [hasBulge, setHasBulge] = useState(false);
  const [hasPain, setHasPain] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      setError(null);
      setAnalyzing(true);
      
      try {
        // Pass symptoms to service
        const result = await analyzeDiastasisImage(file, weeksPostpartum, { bulging: hasBulge, pain: hasPain });
        setAnalysisResult(result);
      } catch (err: any) {
        setError(err.message || "Failed to analyze image");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleContinue = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
    }
  };

  if (analysisResult) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 md:p-8 max-w-lg mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Analysis Complete</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
             <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">Estimated Severity</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  analysisResult.safeToExercise 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  {analysisResult.severity}
                </span>
             </div>
             <p className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">{analysisResult.gapEstimation}</p>
             <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{analysisResult.recommendation}</p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm text-blue-800 dark:text-blue-200">
             <Info className="shrink-0 mt-0.5" size={16} />
             <p>This result has been used to tailor your recovery plan safety filters.</p>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mb-6 py-4 border-t border-b border-stone-100 dark:border-stone-800">
           <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3 text-center">Was this assessment helpful?</p>
           <div className="flex justify-center gap-4">
              <button 
                onClick={() => setFeedback('up')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${feedback === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
              >
                <ThumbsUp size={16} /> Yes
              </button>
              <button 
                onClick={() => setFeedback('down')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${feedback === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
              >
                <ThumbsDown size={16} /> No
              </button>
           </div>
           {feedback && (
             <p className="text-xs text-center text-stone-500 dark:text-stone-400 mt-2 animate-fade-in">Thanks for your feedback!</p>
           )}
        </div>

        <button 
          onClick={handleContinue}
          className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
        >
          Update My Plan <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-100 dark:bg-rose-900/20 rounded-full text-rose-600 dark:text-rose-400">
          <Camera size={24} />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Diastasis Recti Check</h2>
      </div>

      <p className="text-stone-600 dark:text-stone-300 mb-6 text-sm leading-relaxed">
        To get the most accurate safety recommendation, please answer these quick questions before uploading your photo.
      </p>

      {/* Symptom Questionnaire */}
      <div className="mb-6 space-y-3">
         <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${hasBulge ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
            <div className="mt-0.5">
               <input 
                 type="checkbox" 
                 checked={hasBulge} 
                 onChange={e => setHasBulge(e.target.checked)} 
                 className="w-5 h-5 accent-rose-600 rounded" 
               />
            </div>
            <div>
               <span className="block text-sm font-semibold text-stone-800 dark:text-stone-200">Visible Bulging or "Doming"</span>
               <span className="text-xs text-stone-500 dark:text-stone-400">Do you see a ridge running down your midline when you lift your head or cough?</span>
            </div>
         </label>

         <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${hasPain ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
            <div className="mt-0.5">
               <input 
                 type="checkbox" 
                 checked={hasPain} 
                 onChange={e => setHasPain(e.target.checked)} 
                 className="w-5 h-5 accent-rose-600 rounded" 
               />
            </div>
            <div>
               <span className="block text-sm font-semibold text-stone-800 dark:text-stone-200">Pain or Discomfort</span>
               <span className="text-xs text-stone-500 dark:text-stone-400">Do you experience lower back pain or pelvic floor heaviness?</span>
            </div>
         </label>
      </div>

      <div className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Upload Photo</div>

      <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-6 md:p-10 text-center bg-stone-50 dark:bg-stone-950 transition-colors hover:bg-stone-100 dark:hover:bg-stone-900 relative min-h-[200px] flex flex-col justify-center items-center group cursor-pointer">
        {analyzing ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="animate-spin text-rose-600 dark:text-rose-500 mb-3" size={32} />
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">Analyzing tissue integrity...</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Processing symptom context...</p>
          </div>
        ) : (
          <>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="h-48 mx-auto rounded object-contain shadow-sm" />
            ) : (
              <div className="flex flex-col items-center transition-transform group-hover:scale-105 duration-200">
                <div className="bg-white dark:bg-stone-900 p-3 rounded-full shadow-sm mb-3">
                    <Camera className="text-rose-600 dark:text-rose-400" size={32} />
                </div>
                <span className="text-rose-700 dark:text-rose-300 font-semibold">Tap to Upload Photo</span>
                <span className="text-xs text-stone-400 mt-2">JPG, PNG (Max 5MB)</span>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button 
          onClick={onSkip}
          className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 text-sm font-medium px-6 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors w-full sm:w-auto"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default BellyAnalyzer;
