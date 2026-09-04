import React, { useState, useEffect } from 'react';
import { RowCounterHistory } from '../../types';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  History as HistoryIcon, 
  Save, 
  CheckCircle2, 
  Target,
  Sparkles,
  Bookmark
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RowCounterTool: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [targetRows, setTargetRows] = useState<number>(40);
  const [projectName, setProjectName] = useState<string>('Granny Blanket');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [history, setHistory] = useState<RowCounterHistory[]>([
    { id: '1', timestamp: '10:00 AM', count: 12, note: 'Finished sleeve cuff', projectName: 'Granny Blanket' }
  ]);

  const isLoadedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCount = localStorage.getItem('crochethub_row_count');
      if (savedCount) setCount(parseInt(savedCount, 10));

      const savedTarget = localStorage.getItem('crochethub_row_target');
      if (savedTarget) setTargetRows(parseInt(savedTarget, 10));

      const savedProject = localStorage.getItem('crochethub_row_project');
      if (savedProject) setProjectName(savedProject);

      const savedHistory = localStorage.getItem('crochethub_row_history');
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
      }

      isLoadedRef.current = true;
    }
  }, []);

  // Save automatically to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoadedRef.current) {
      localStorage.setItem('crochethub_row_count', count.toString());
    }
  }, [count]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isLoadedRef.current) {
      localStorage.setItem('crochethub_row_target', targetRows.toString());
    }
  }, [targetRows]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isLoadedRef.current) {
      localStorage.setItem('crochethub_row_project', projectName);
    }
  }, [projectName]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isLoadedRef.current) {
      localStorage.setItem('crochethub_row_history', JSON.stringify(history));
    }
  }, [history]);

  // Web Audio Synth Chime Sound
  const playChimeSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.log('Audio synth error:', e);
    }
  };

  const triggerVibration = () => {
    if (!vibrationEnabled) return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {}
    }
  };

  const handleIncrement = (amount: number = 1) => {
    const newCount = count + amount;
    setCount(newCount);
    playChimeSound();
    triggerVibration();

    if (newCount === targetRows && targetRows > 0) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleDecrement = () => {
    if (count > 0) {
      setCount(prev => prev - 1);
      triggerVibration();
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the current row counter to 0?')) {
      setCount(0);
    }
  };

  const handleLogHistory = () => {
    const entry: RowCounterHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      count,
      note: note || 'Row milestone reached',
      projectName
    };
    setHistory([entry, ...history.slice(0, 19)]);
    setNote('');
  };

  const progressPercent = targetRows > 0 ? Math.min(100, Math.round((count / targetRows) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      
      {/* Tool Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
              Offline Capable
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Digital Row Counter
          </h2>
          <p className="text-pink-100 text-sm mt-1">
            Tap anywhere to count rows. Saves automatically offline in your browser.
          </p>
        </div>

        {/* Audio & Haptics Toggles */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              soundEnabled ? 'bg-white text-[#E96BA8] shadow-sm' : 'text-white/70 hover:text-white'
            }`}
            title="Toggle Audio Sound Chime"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              vibrationEnabled ? 'bg-white text-[#9B7CF8] shadow-sm' : 'text-white/70 hover:text-white'
            }`}
            title="Toggle Haptic Touch Vibration"
          >
            <Vibrate className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Counter Display */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-8 sm:p-10 rounded-[24px] shadow-md text-center space-y-6">
        
        {/* Project Title Input */}
        <div className="max-w-xs mx-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          />
        </div>

        {/* Big Number Circle Button */}
        <button
          onClick={() => handleIncrement(1)}
          className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl flex flex-col items-center justify-center text-white cursor-pointer border-4 border-white dark:border-slate-800"
        >
          <span className="text-6xl sm:text-7xl font-black tracking-tight drop-shadow-md">
            {count}
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-pink-100 mt-2">
            TAP TO COUNT +1
          </span>
        </button>

        {/* Progress Bar & Goal */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4 text-[#E96BA8]" />
              Goal: {targetRows} Rows
            </span>
            <span>{progressPercent}% Completed</span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600">
            <div 
              className="h-full bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-400">
            <span>Edit Target Goal:</span>
            <input
              type="number"
              min="1"
              value={targetRows}
              onChange={(e) => setTargetRows(parseInt(e.target.value, 10) || 1)}
              className="w-16 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-xs"
            />
            <span>rows</span>
          </div>
        </div>

        {/* Control Button Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto pt-2">
          <button
            onClick={() => handleIncrement(1)}
            className="bg-pink-50 hover:bg-pink-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-[#E96BA8] dark:text-pink-300 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1 transition-colors cursor-pointer text-base"
          >
            <Plus className="w-5 h-5" />
            <span>+1</span>
          </button>

          <button
            onClick={() => handleIncrement(5)}
            className="bg-purple-50 hover:bg-purple-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-[#9B7CF8] dark:text-purple-300 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1 transition-colors cursor-pointer text-base"
          >
            <Plus className="w-5 h-5" />
            <span>+5</span>
          </button>

          <button
            onClick={handleDecrement}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1 transition-colors cursor-pointer text-base"
          >
            <Minus className="w-5 h-5" />
            <span>-1</span>
          </button>

          <button
            onClick={handleReset}
            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1 transition-colors cursor-pointer text-base"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>
        </div>

      </div>

      {/* Log Milestone Entry */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 rounded-[24px] space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[#E96BA8]" />
          Save Row Milestone Note
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Row 20 finished - change yarn color to mint..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          />
          <button
            onClick={handleLogHistory}
            className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-5 py-3 rounded-2xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Log Note</span>
          </button>
        </div>

        {/* Saved Milestone History List */}
        {history.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <HistoryIcon className="w-3.5 h-3.5" />
              Recent Saved Milestones ({history.length})
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {history.map((item) => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-[#E96BA8] mr-2">Row {item.count}</span>
                    <span className="text-slate-700 dark:text-slate-200">{item.note}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0 ml-2">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
