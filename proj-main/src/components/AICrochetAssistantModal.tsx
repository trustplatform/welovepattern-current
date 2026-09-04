import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, RefreshCw, HelpCircle } from 'lucide-react';

interface AICrochetAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICrochetAssistantModal: React.FC<AICrochetAssistantModalProps> = ({
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; isFallback?: boolean }>>([
    {
      sender: 'ai',
      text: "Hello! I'm your Crochet AI Helper 🧶\n\nAsk me anything! For example:\n• \"How do I fix tight foundation chains?\"\n• \"What hook size is best for velvet yarn?\"\n• \"Recommend a beginner blanket pattern for baby gift.\""
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user' as const, text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.answer || "Happy crocheting!", isFallback: data.isFallback }]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I couldn't connect right now. Tip: Always make sure your tension stays relaxed and your hook glides smoothly!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "How to make magic ring easy?",
    "US vs UK double crochet difference?",
    "How much yarn for a throw blanket?",
    "Best yarn for amigurumi plushies?"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-[24px] max-w-xl w-full h-[600px] flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
              ✨
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Crochet AI Assistant</h2>
              <p className="text-xs text-pink-100">Powered by Gemini AI • Expert Artisan Advice</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] text-white flex items-center justify-center text-xs shrink-0 font-bold">
                  🧶
                </div>
              )}

              <div
                className={`max-w-[82%] p-4 rounded-2xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#E96BA8] text-white rounded-tr-none font-medium'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                {m.isFallback && (
                  <p className="text-[11px] opacity-70 mt-2 italic border-t border-slate-200 dark:border-slate-700 pt-1">
                    💡 Connect your GEMINI_API_KEY in secrets panel for live AI custom generation.
                  </p>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs shrink-0 font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-slate-800 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-[#E96BA8] animate-spin" />
              </div>
              <span>Crochet AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Sample Suggestions */}
        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-700 flex gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="bg-white dark:bg-slate-800 hover:bg-pink-50 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask any crochet question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#E96BA8] hover:bg-pink-600 disabled:opacity-50 text-white p-3 rounded-2xl transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
