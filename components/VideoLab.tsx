import React, { useState } from 'react';
import { analyzeExerciseVideo } from '../services/geminiService';
import { VideoAnalysis } from '../types';
import { Video, Upload, AlertTriangle, Loader2, Play } from 'lucide-react';

interface Props {
  exerciseName?: string;
}

const VideoLab: React.FC<Props> = ({ exerciseName = "Heel Slides" }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoAnalysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customExercise, setCustomExercise] = useState(exerciseName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null); // Reset previous result
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const data = await analyzeExerciseVideo(file, customExercise);
      setResult(data);
    } catch (error) {
      alert("Analysis failed. Please try a shorter video.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <Video className="text-teal-400" size={20} />
          <h3 className="font-bold text-lg">AI Form Correction Lab</h3>
        </div>
        <p className="text-slate-400 text-xs md:text-sm">Upload a short clip (5-10s) of you performing an exercise for real-time safety feedback.</p>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Exercise Name</label>
          <input 
            type="text" 
            value={customExercise} 
            onChange={(e) => setCustomExercise(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="e.g. Deadbug, Squat"
          />
        </div>

        {!previewUrl ? (
          <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
            <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            <div className="bg-slate-100 p-3 rounded-full w-fit mx-auto mb-3 group-hover:bg-white transition-colors">
                 <Upload className="text-slate-400 group-hover:text-teal-600 transition-colors" size={24} />
            </div>
            <span className="text-teal-700 font-semibold block text-sm">Upload Video Clip</span>
            <span className="text-xs text-slate-400">Max 20MB • MP4, MOV</span>
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
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 active:scale-[0.98]"
              >
                {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                {analyzing ? "Analyzing Form..." : "Analyze My Form"}
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700 text-sm">Safety Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${result.safetyScore >= 8 ? 'text-green-600' : result.safetyScore >= 5 ? 'text-amber-500' : 'text-red-600'}`}>
                  {result.safetyScore}/10
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                 <h4 className="font-semibold text-slate-800 text-sm mb-1">Feedback</h4>
                 <p className="text-slate-600 text-xs leading-relaxed">{result.feedback}</p>
              </div>
              
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                <h5 className="text-rose-700 font-medium text-xs mb-2 flex items-center gap-2 uppercase tracking-wide">
                  <AlertTriangle size={14} /> Corrections Needed
                </h5>
                <ul className="space-y-2">
                  {result.corrections.map((correction, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0"></span>
                      {correction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button 
              onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }}
              className="w-full border border-slate-300 text-slate-600 font-medium py-2 rounded-lg hover:bg-slate-50 text-sm transition-colors"
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