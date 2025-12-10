import React, { useState } from 'react';
import { MessageSquare, X, Send, Mail } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const FeedbackModal: React.FC<Props> = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('General Feedback');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = 'kashifumair125@gmail.com';
    const body = encodeURIComponent(message);
    const sub = encodeURIComponent(`PostpartumAI: ${subject}`);
    window.location.href = `mailto:${email}?subject=${sub}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-white text-stone-800 dark:bg-stone-900 dark:text-stone-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="text-rose-500" /> Feedback & Queries
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors opacity-70 hover:opacity-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <p className="text-sm text-stone-600 dark:text-stone-300">
             Have a question, feature request, or just want to say hi? We'd love to hear from you.
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">Topic</label>
            <div className="relative">
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-rose-500 outline-none text-sm appearance-none cursor-pointer"
              >
                <option>General Feedback</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
                <option>Medical Query</option>
                <option>Other</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-stone-500">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">Your Message</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-rose-500 outline-none text-sm resize-none placeholder-stone-400"
              placeholder="Type your message here..."
            />
          </div>

          <div className="pt-2">
            <button 
                type="submit"
                className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none"
            >
                <Mail size={18} /> Send via Email
            </button>
            <p className="text-xs text-center text-stone-400 mt-3">
                This will open your default email client addressed to kashifumair125@gmail.com
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};