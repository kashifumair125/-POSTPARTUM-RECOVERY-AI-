
import React, { useState } from 'react';
import { analyzeExerciseVideo } from '../services/geminiService';
import { VideoAnalysis } from '../types';
import { Video, Upload, AlertTriangle, Loader2, Play, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Props {
  exerciseName?: string;
}

const MAX_VIDEO_SIZE_MB = 20;

const VideoLab: React.FC<Props> = ({ exerciseName = "Heel Slides" }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoAnalysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customExercise, setCustomExercise] = useState(exerciseName);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      
      // Validation
      if (selected.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        setError(`Video is too large. Please upload a file smaller than ${MAX_VIDEO_SIZE_MB}MB.`);
        return;
      }
      
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null); 
      setFeedback(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setFeedback(null);
    setError(null);
    try {
      const data = await analyzeExerciseVideo(file, customExercise);
      setResult(data);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Analysis failed. Please try a shorter video.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null); 
    setPreviewUrl(null); 
    setResult(null); 
    setFeedback(null);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-md border border-stone-200 dark:border-stone-800 overflow-hidden">
      <div className="bg-stone-900 dark:bg-stone-950 text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <Video className="text-rose-400" size={20} />
          <h3 className="font-bold text-lg">AI Form Correction Lab</h3>
        </div>
        <p className="text-stone-400 text-xs md:text-sm">Upload a short clip (5-10s) of you performing an exercise for real-time safety feedback.</p>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">Exercise Name</label>
          <input 
            type="text" 
            value={customExercise} 
            onChange={(e) => setCustomExercise(e.target.value)}
            className="w-full border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-rose-500 outline-none"
            placeholder="e.g. Deadbug, Squat"
          />
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
        )}

        {!previewUrl ? (
          <label className="block border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-8 text-center cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group">
            <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-full w-fit mx-auto mb-3 group-hover:bg-white dark:group-hover:bg-stone-700 transition-colors">
                 <Upload className="text-stone-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" size={24} />
            </div>
            <span className="text-rose-700 dark:text-rose-400 font-semibold block text-sm">Upload Video Clip</span>
            <span className="text-xs text-stone-400">Max {MAX_VIDEO_SIZE_MB}MB • MP4, MOV</span>
          </label>
        ) : (
          <div className="mb-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4 shadow-inner">
              <video src={previewUrl} controls className="w-full h-full object-contain" />
            </div>
            
            {!result && (
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 active:scale-[0.98]"
              >
                {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                {analyzing ? "Analyzing Form..." : "Analyze My Form"}
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-100 dark:border-stone-700">
              <span className="font-medium text-stone-700 dark:text-stone-300 text-sm">Safety Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${result.safetyScore >= 8 ? 'text-green-600 dark:text-green-400' : result.safetyScore >= 5 ? 'text-amber-500 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.safetyScore}/10
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-100 dark:border-stone-800 shadow-sm">
                 <h4 className="font-semibold text-stone-800 dark:text-stone-100 text-sm mb-1">Feedback</h4>
                 <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed">{result.feedback}</p>
              </div>
              
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg p-3">
                <h5 className="text-rose-700 dark:text-rose-300 font-medium text-xs mb-2 flex items-center gap-2 uppercase tracking-wide">
                  <AlertTriangle size={14} /> Corrections Needed
                </h5>
                <ul className="space-y-2">
                  {result.corrections.map((correction, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0"></span>
                      {correction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feedback Mechanism */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
               <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Was this helpful?</span>
               <div className="flex gap-2">
                  <button onClick={() => setFeedback('up')} className={`p-1.5 rounded-full transition-colors ${feedback === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400'}`}>
                    <ThumbsUp size={16} />
                  </button>
                  <button onClick={() => setFeedback('down')} className={`p-1.5 rounded-full transition-colors ${feedback === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400'}`}>
                    <ThumbsDown size={16} />
                  </button>
               </div>
            </div>

            <button 
              onClick={resetAnalysis}
              className="w-full border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-sm transition-colors"
            >
              Analyze Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLab;
