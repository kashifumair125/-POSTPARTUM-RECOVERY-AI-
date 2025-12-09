import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, Volume2, Square, Sparkles, User, Bot, BrainCircuit } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { chatWithHealthCoach } from '../services/geminiService';
import { saveChatMessage } from '../services/storageService';

interface Props {
  profile: UserProfile | null;
  history: ChatMessage[];
  onUpdateHistory: (history: ChatMessage[]) => void;
}

const HealthChat: React.FC<Props> = ({ profile, history, onUpdateHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen, isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript); // Auto-send on voice end
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      window.speechSynthesis.cancel(); // Stop talking if we want to listen
      if (!recognitionRef.current) {
        alert("Voice input not supported in this browser.");
        return;
      }
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textOverride?: string) => {
    window.speechSynthesis.cancel(); // Stop any previous speech
    
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    const updatedHistory = saveChatMessage(userMsg);
    onUpdateHistory(updatedHistory);
    setInput("");
    setIsLoading(true);

    try {
      const responseText = await chatWithHealthCoach(text, history, profile);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText,
        timestamp: Date.now()
      };
      
      const finalHistory = saveChatMessage(aiMsg);
      onUpdateHistory(finalHistory);

      // Auto-speak response if using voice or if it was a voice command
      if (textOverride || isListening) {
        speakResponse(responseText);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer a female voice for "Rose"
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all hover:scale-105 flex items-center justify-center ${isOpen ? 'hidden' : 'bg-rose-600 text-white animate-fade-in-up'}`}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={28} />
        {history.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse border-2 border-white"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] z-50 bg-white dark:bg-stone-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-stone-200 dark:border-stone-800">
          
          {/* Header */}
          <div className="bg-rose-600 p-4 flex justify-between items-center text-white shrink-0">
             <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Rose AI</h3>
                  <p className="text-xs text-rose-100 opacity-90">Recovery Assistant</p>
                </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-stone-50 dark:bg-stone-950">
             {history.length === 0 && (
               <div className="text-center p-6 opacity-60">
                  <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                    <Bot size={32} />
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Hi! I'm Rose. I know your recovery plan. Ask me about your exercises, symptoms, or just vent!
                  </p>
               </div>
             )}
             
             {history.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-stone-800 text-white dark:bg-stone-700' : 'bg-white text-stone-800 border border-stone-100 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700'}`}>
                     {msg.text}
                  </div>
               </div>
             ))}
             
             {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-3 flex gap-2 items-center">
                    <BrainCircuit size={16} className="text-rose-500 animate-pulse" />
                    <span className="text-xs text-stone-500 dark:text-stone-400">Rose is thinking...</span>
                 </div>
               </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 shrink-0">
             <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-950 p-2 rounded-full border border-stone-200 dark:border-stone-800">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? "Listening..." : "Ask Rose..."}
                  className="flex-grow bg-transparent border-none focus:ring-0 text-sm px-3 text-stone-800 dark:text-stone-100 placeholder-stone-400"
                  disabled={isListening}
                />
                
                <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-stone-400 hover:text-rose-500 hover:bg-white dark:hover:bg-stone-800'}`}
                >
                   {isListening ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
                </button>
                
                <button 
                   onClick={() => handleSend()}
                   disabled={!input.trim()}
                   className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                   <Send size={16} />
                </button>
             </div>
          </div>

        </div>
      )}
    </>
  );
};

export default HealthChat;