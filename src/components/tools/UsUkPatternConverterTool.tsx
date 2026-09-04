import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Info, 
  BookOpen, 
  FileText,
  CheckCircle2,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { 
  convertPattern, 
  detectPatternTerminology, 
  ConversionDirection,
  TerminologyDetectionResult 
} from '../../utils/crochetPatternConverter';

const EXAMPLE_US_PATTERN = `Row 1: Ch 21, sc in 2nd ch from hook and in each ch across. Turn. (20 sc)
Row 2: Ch 2 (does not count as st), hdc in first st, dc in next 5 sts, sc2tog over next 2 sts, FPdc in next st, dc in each st across. Turn. (19 sts)
Row 3: Ch 3 (counts as dc), skip next st, 2 dc in next st, tr in turning ch.
Gauge: 16 sc and 18 rows = 4 inches (10 cm). Fasten off and weave in ends.`;

const EXAMPLE_UK_PATTERN = `Row 1: Ch 21, dc in 2nd ch from hook and in each ch across. Turn. (20 dc)
Row 2: Ch 2 (does not count as st), htr in first st, tr in next 5 sts, dc2tog over next 2 sts, FPtr in next st, tr in each st across. Turn. (19 sts)
Row 3: Ch 3 (counts as tr), miss next st, 2 tr in next st, dtr in turning ch.
Tension: 16 dc and 18 rows = 10 cm (4 inches). Fasten off and weave in ends.`;

export const UsUkPatternConverterTool: React.FC = () => {
  const [direction, setDirection] = useState<ConversionDirection>('us-to-uk');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [conversionCounts, setConversionCounts] = useState<Record<string, number>>({});
  const [totalConverted, setTotalConverted] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [detection, setDetection] = useState<TerminologyDetectionResult | null>(null);
  const [hasConverted, setHasConverted] = useState<boolean>(false);

  // Re-detect terminology when input text changes
  useEffect(() => {
    if (inputText.trim().length > 0) {
      const result = detectPatternTerminology(inputText);
      setDetection(result);
    } else {
      setDetection(null);
    }
  }, [inputText]);

  const handleConvert = () => {
    if (!inputText.trim()) {
      setOutputText('');
      setConversionCounts({});
      setTotalConverted(0);
      setHasConverted(false);
      return;
    }

    const res = convertPattern(inputText, direction);
    setOutputText(res.convertedText);
    setConversionCounts(res.conversionCounts);
    setTotalConverted(res.totalConverted);
    setHasConverted(true);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = outputText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setConversionCounts({});
    setTotalConverted(0);
    setHasConverted(false);
    setDetection(null);
  };

  const loadExample = (dir: ConversionDirection) => {
    setDirection(dir);
    const example = dir === 'us-to-uk' ? EXAMPLE_US_PATTERN : EXAMPLE_UK_PATTERN;
    setInputText(example);
    const res = convertPattern(example, dir);
    setOutputText(res.convertedText);
    setConversionCounts(res.conversionCounts);
    setTotalConverted(res.totalConverted);
    setHasConverted(true);
  };

  const handleAutoDirectionSwitch = () => {
    if (detection?.terminology === 'us' && direction !== 'us-to-uk') {
      setDirection('us-to-uk');
    } else if (detection?.terminology === 'uk' && direction !== 'uk-to-us') {
      setDirection('uk-to-us');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#E96BA8] via-purple-600 to-indigo-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Deterministic Terminology Engine
              </span>
              <span className="bg-emerald-400/20 text-emerald-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                100% Free & Client-Side
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              US ↔ UK Crochet Pattern Converter
            </h2>
            <p className="text-pink-100 text-sm sm:text-base mt-1 max-w-2xl">
              Instantly convert crochet patterns between American (US) and British (UK) terminology while preserving line breaks, stitch counts, parentheses, and repeats.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
            <ArrowRightLeft className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Direction Selector Bar */}
        <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setDirection('us-to-uk')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
                direction === 'us-to-uk'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>US → UK</span>
              <span className="text-xs opacity-75 font-normal hidden sm:inline">(American to British)</span>
            </button>
            <button
              onClick={() => setDirection('uk-to-us')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
                direction === 'uk-to-us'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>UK → US</span>
              <span className="text-xs opacity-75 font-normal hidden sm:inline">(British to American)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-pink-100">Load sample:</span>
            <button
              onClick={() => loadExample('us-to-uk')}
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Sample US
            </button>
            <button
              onClick={() => loadExample('uk-to-us')}
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Sample UK
            </button>
          </div>
        </div>
      </div>

      {/* Terminology Detection Banner (if pattern is pasted) */}
      {detection && detection.clues.length > 0 && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          detection.terminology === 'us'
            ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            : detection.terminology === 'uk'
            ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>{detection.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 border border-current font-medium">
                  {detection.confidence} confidence
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90">
                {detection.explanation}
              </p>
            </div>
          </div>

          {((detection.terminology === 'us' && direction !== 'us-to-uk') ||
            (detection.terminology === 'uk' && direction !== 'uk-to-us')) && (
            <button
              onClick={handleAutoDirectionSwitch}
              className="shrink-0 text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Switch to {detection.terminology === 'us' ? 'US → UK' : 'UK → US'}
            </button>
          )}
        </div>
      )}

      {/* Main Conversion Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700 p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E96BA8]" />
              <label htmlFor="pattern-input" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Original Pattern Text ({direction === 'us-to-uk' ? 'US Terms' : 'UK Terms'})
              </label>
            </div>
            {inputText && (
              <button
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 font-semibold transition-colors"
                title="Clear input text"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <textarea
            id="pattern-input"
            rows={12}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              direction === 'us-to-uk'
                ? "Paste your US crochet pattern here...\ne.g. Row 1: ch 20, sc across. Row 2: hdc, dc2tog, FPdc in next st. (18 sts)"
                : "Paste your UK crochet pattern here...\ne.g. Row 1: ch 20, dc across. Row 2: htr, tr2tog, FPtr in next st. (18 sts)"
            }
            className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] transition-all resize-y"
          />

          <div className="mt-4 flex items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {inputText.length} characters &bull; {inputText.split(/\n/).length} lines
            </span>

            <button
              onClick={handleConvert}
              disabled={!inputText.trim()}
              className="px-6 py-2.5 bg-[#E96BA8] hover:bg-[#d85897] disabled:opacity-40 disabled:hover:bg-[#E96BA8] text-white font-bold text-sm rounded-xl shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Convert Pattern
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700 p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <label htmlFor="pattern-output" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Converted Pattern ({direction === 'us-to-uk' ? 'UK Terms' : 'US Terms'})
              </label>
            </div>
            {outputText && (
              <button
                onClick={handleCopy}
                className="text-xs font-bold text-[#E96BA8] hover:text-[#d85897] flex items-center gap-1.5 transition-colors bg-pink-50 dark:bg-pink-950/40 px-3 py-1.5 rounded-lg border border-pink-200 dark:border-pink-900"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Result</span>
                  </>
                )}
              </button>
            )}
          </div>

          <textarea
            id="pattern-output"
            rows={12}
            readOnly
            value={outputText}
            placeholder="Converted pattern will appear here with all numbers, line breaks, and formatting preserved..."
            className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none transition-all resize-y"
          />

          <div className="mt-4 flex items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {hasConverted ? `${totalConverted} terms converted` : 'Ready to convert'}
            </span>

            {outputText && (
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Converted Text'}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Conversion Report Breakdown (if converted) */}
      {hasConverted && totalConverted > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Conversion Report ({totalConverted} terms updated)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Direction: {direction === 'us-to-uk' ? 'US → UK' : 'UK → US'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(conversionCounts).map(([termKey, count]) => (
              <div
                key={termKey}
                className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"
              >
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {termKey}
                </span>
                <span className="bg-[#E96BA8]/10 dark:bg-[#E96BA8]/20 text-[#E96BA8] font-bold px-2 py-0.5 rounded-full">
                  × {count}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              This tool converts common US and UK crochet terminology. Always check the original pattern and stitch counts before starting your project.
            </span>
          </p>
        </div>
      )}

      {/* Quick Conversion Cheat Sheet Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#E96BA8]" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Quick US vs UK Stitch Translation Cheat Sheet
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">US Term (American)</th>
                <th className="py-3 px-4 text-[#E96BA8]">UK Term (British)</th>
                <th className="py-3 px-4">Stitch Height / Description</th>
                <th className="py-3 px-4">Slip St / Joins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Single Crochet (sc)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Double Crochet (dc)</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Shortest basic stitch (1 loop pull through)</td>
                <td className="py-2.5 px-4 text-slate-500">sl st / ss</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Half Double Crochet (hdc)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Half Treble Crochet (htr)</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Yarn over, pull through all 3 loops</td>
                <td className="py-2.5 px-4 text-slate-500">sl st / ss</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Double Crochet (dc)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Treble Crochet (tr)</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Standard granny stitch (pull through 2 loops twice)</td>
                <td className="py-2.5 px-4 text-slate-500">sl st / ss</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Treble / Triple Crochet (tr)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Double Treble Crochet (dtr)</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Yarn over twice before inserting hook</td>
                <td className="py-2.5 px-4 text-slate-500">sl st / ss</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Double Treble Crochet (dtr)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Triple Treble Crochet (trtr)</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Yarn over 3 times for extra tall open lace</td>
                <td className="py-2.5 px-4 text-slate-500">sl st / ss</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Gauge (e.g. 16 sc = 4")</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Tension (e.g. 16 dc = 10 cm)</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Swatch density and stitch sizing measurement</td>
                <td className="py-2.5 px-4 text-slate-500">-</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">Skip (sk)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#E96BA8]">Miss</td>
                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">Bypass the specified number of stitches or chains</td>
                <td className="py-2.5 px-4 text-slate-500">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
