import React, { useState } from 'react';
import { Ruler, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const GaugeCalculatorTool: React.FC = () => {
  // Pattern required gauge
  const [targetStitches, setTargetStitches] = useState<number>(14);
  const [targetRows, setTargetRows] = useState<number>(10);
  const [targetWidth, setTargetWidth] = useState<number>(4); // inches or cm

  // Swatch actual measured gauge
  const [swatchStitches, setSwatchStitches] = useState<number>(16);
  const [swatchRows, setSwatchRows] = useState<number>(11);

  // Desired total project width
  const [projectWidth, setProjectWidth] = useState<number>(40);

  // Calculations
  const targetStitchDensity = targetStitches / targetWidth;
  const swatchStitchDensity = swatchStitches / targetWidth;

  const originalPatternChain = projectWidth * targetStitchDensity;
  const adjustedChainNeeded = Math.round(projectWidth * swatchStitchDensity);

  const percentageDiff = Math.round(((swatchStitchDensity - targetStitchDensity) / targetStitchDensity) * 100);

  let recommendation = '';
  if (Math.abs(percentageDiff) <= 3) {
    recommendation = 'Your gauge matches perfectly! You can proceed with the pattern hook size as written.';
  } else if (percentageDiff > 3) {
    recommendation = `Your stitches are tighter/smaller than pattern gauge (+${percentageDiff}%). Switch to a LARGER crochet hook size (e.g. +0.5mm) or follow our adjusted starting chain recommendation of ${adjustedChainNeeded} stitches.`;
  } else {
    recommendation = `Your stitches are looser/larger than pattern gauge (${percentageDiff}%). Switch to a SMALLER crochet hook size (e.g. -0.5mm) or follow our adjusted starting chain recommendation of ${adjustedChainNeeded} stitches.`;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Tool Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Ruler className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Gauge Swatch Calculator</h2>
            <p className="text-sky-100 text-sm">Calculate stitch adjustments so your blankets & cardigans fit perfectly!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pattern Target Gauge Box */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 rounded-[24px] space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 font-bold text-xs flex items-center justify-center">1</span>
            Pattern Target Gauge
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-slate-500 font-medium">Measurement Square Size (Inches/cm):</label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => setTargetWidth(parseFloat(e.target.value) || 4)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Required Stitches:</label>
                <input
                  type="number"
                  value={targetStitches}
                  onChange={(e) => setTargetStitches(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1 text-sky-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Required Rows:</label>
                <input
                  type="number"
                  value={targetRows}
                  onChange={(e) => setTargetRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Your Measured Swatch Box */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 rounded-[24px] space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex items-center justify-center">2</span>
            Your Swatch Measurement
          </h3>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Actual Swatch Stitches:</label>
                <input
                  type="number"
                  value={swatchStitches}
                  onChange={(e) => setSwatchStitches(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1 text-purple-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Actual Swatch Rows:</label>
                <input
                  type="number"
                  value={swatchRows}
                  onChange={(e) => setSwatchRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Target Project Width (Inches/cm):</label>
              <input
                type="number"
                value={projectWidth}
                onChange={(e) => setProjectWidth(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Results Box */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[24px] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="font-bold text-lg text-sky-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Gauge Adjustments & Recommendation
          </h3>
          <span className="bg-slate-800 text-xs px-3 py-1 rounded-full text-slate-300 font-mono">
            Variance: {percentageDiff > 0 ? `+${percentageDiff}%` : `${percentageDiff}%`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <p className="text-xs text-slate-400">Original Pattern Starting Chain</p>
            <p className="text-3xl font-black text-slate-200 mt-1">{Math.round(originalPatternChain)} sts</p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-pink-500/40">
            <p className="text-xs text-pink-300 font-bold">Recommended Adjusted Starting Chain</p>
            <p className="text-3xl font-black text-[#E96BA8] mt-1">{adjustedChainNeeded} sts</p>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-sm text-slate-300 leading-relaxed flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p>{recommendation}</p>
        </div>
      </div>

    </div>
  );
};
