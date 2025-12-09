import React, { useState } from 'react';
import { analyzeDiastasisImage } from '../services/geminiService';
import { DiastasisAnalysis } from '../types';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  weeksPostpartum: number;
  onAnalysisComplete: (result: DiastasisAnalysis) => void;
  onSkip: () => void;
}

const BellyAnalyzer: React.FC<Props> = ({ weeksPostpartum, onAnalysisComplete, onSkip }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      setError(null);
      setAnalyzing(true);
      
      try {
        const result = await analyzeDiastasisImage(file, weeksPostpartum);
        onAnalysisComplete(result);
      } catch (err: any) {
        setError(err.message || "Failed to analyze image");
        setAnalyzing(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-100 dark:bg-rose-900/20 rounded-full text-rose-600 dark:text-rose-400">
          <Camera size={24} />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Diastasis Recti Check</h2>
      </div>

      <p className="text-stone-600 dark:text-stone-300 mb-6 text-sm leading-relaxed">
        Upload a photo of your abdomen while lying down and performing a slight "crunch" (lifting head). 
        This helps our AI estimate the gap between your abdominal muscles.
      </p>

      <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-6 md:p-10 text-center bg-stone-50 dark:bg-stone-950 transition-colors hover:bg-stone-100 dark:hover:bg-stone-900 relative min-h-[200px] flex flex-col justify-center items-center group cursor-pointer">
        {analyzing ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="animate-spin text-rose-600 dark:text-rose-500 mb-3" size={32} />
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">Analyzing tissue integrity...</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Privacy First: Your image is processed securely and never stored.</p>
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