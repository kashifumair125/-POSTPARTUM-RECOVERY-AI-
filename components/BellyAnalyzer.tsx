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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-100 rounded-full text-rose-600">
          <Camera size={24} />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Diastasis Recti Check</h2>
      </div>

      <p className="text-slate-600 mb-6 text-sm leading-relaxed">
        Upload a photo of your abdomen while lying down and performing a slight "crunch" (lifting head). 
        This helps our AI estimate the gap between your abdominal muscles.
      </p>

      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 md:p-10 text-center bg-slate-50 transition-colors hover:bg-slate-100 relative min-h-[200px] flex flex-col justify-center items-center group cursor-pointer">
        {analyzing ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="animate-spin text-teal-600 mb-3" size={32} />
            <p className="text-sm font-medium text-slate-600">Analyzing tissue integrity...</p>
            <p className="text-xs text-slate-500 mt-1">Privacy First: Your image is processed securely and never stored.</p>
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
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <Camera className="text-teal-600" size={32} />
                </div>
                <span className="text-teal-700 font-semibold">Tap to Upload Photo</span>
                <span className="text-xs text-slate-400 mt-2">JPG, PNG (Max 5MB)</span>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button 
          onClick={onSkip}
          className="text-slate-500 hover:text-slate-800 text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default BellyAnalyzer;