import React, { useState } from 'react';
import { Calculator, CheckCircle2, Info } from 'lucide-react';

export const YarnCalculatorTool: React.FC = () => {
  const [projectType, setProjectType] = useState<string>('blanket-throw');
  const [yarnWeight, setYarnWeight] = useState<string>('worsted');
  const [skeinYardage, setSkeinYardage] = useState<number>(200);

  const YARN_ESTIMATES: Record<string, Record<string, number>> = {
    'blanket-baby': { lace: 1100, sport: 1200, worsted: 1000, bulky: 800 },
    'blanket-throw': { lace: 2400, sport: 2500, worsted: 2200, bulky: 1700 },
    'blanket-queen': { lace: 4500, sport: 4600, worsted: 4000, bulky: 3200 },
    'sweater-adult': { lace: 1600, sport: 1700, worsted: 1500, bulky: 1200 },
    'cardigan-baby': { lace: 500, sport: 550, worsted: 480, bulky: 380 },
    'beanie-hat': { lace: 220, sport: 240, worsted: 200, bulky: 150 },
    'scarf-standard': { lace: 600, sport: 650, worsted: 500, bulky: 400 },
    'amigurumi-medium': { lace: 350, sport: 380, worsted: 300, bulky: 220 }
  };

  const estimatedYards = YARN_ESTIMATES[projectType]?.[yarnWeight] || 1500;
  const estimatedMeters = Math.round(estimatedYards * 0.9144);
  const totalSkeinsNeeded = Math.ceil(estimatedYards / (skeinYardage || 200));

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Yarn Estimator & Skein Calculator</h2>
            <p className="text-emerald-100 text-sm">Find out exactly how much yarn to buy before starting your project!</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 sm:p-8 rounded-[24px] space-y-6 shadow-sm">
        <div className="space-y-4">
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              1. Select Project Type
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl font-bold text-slate-800 dark:text-slate-100 text-base"
            >
              <option value="blanket-baby">Baby Blanket (30" x 36")</option>
              <option value="blanket-throw">Standard Throw Blanket (50" x 60")</option>
              <option value="blanket-queen">Queen Bed Blanket (90" x 90")</option>
              <option value="sweater-adult">Adult Sweater / Pullover (M/L)</option>
              <option value="cardigan-baby">Baby Cardigan (0-12M)</option>
              <option value="beanie-hat">Adult Beanie / Winter Hat</option>
              <option value="scarf-standard">Winter Scarf (70" long)</option>
              <option value="amigurumi-medium">Amigurumi Plush Toy (8" tall)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              2. Select Yarn Weight Class
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'lace', label: 'Fine / Sport (#2)' },
                { id: 'worsted', label: 'Worsted (#4)' },
                { id: 'bulky', label: 'Bulky (#5)' }
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => setYarnWeight(w.id)}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    yarnWeight === w.id
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              3. Yardage Per Skein (From Yarn Label)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                value={skeinYardage}
                onChange={(e) => setSkeinYardage(parseInt(e.target.value, 10) || 100)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl font-bold text-slate-800 dark:text-slate-100"
              />
              <span className="text-sm font-bold text-slate-500">yards per skein</span>
            </div>
          </div>

        </div>

        {/* Results Banner */}
        <div className="bg-emerald-950 text-white p-6 rounded-[20px] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Estimated Yarn Requirements
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-700/50">
              <p className="text-xs text-emerald-200">Total Estimated Yardage</p>
              <p className="text-3xl font-black text-white mt-1">{estimatedYards} yds</p>
              <p className="text-xs text-emerald-300">({estimatedMeters} meters)</p>
            </div>

            <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-500">
              <p className="text-xs text-emerald-200">Total Skeins to Purchase</p>
              <p className="text-3xl font-black text-amber-300 mt-1">{totalSkeinsNeeded} Skeins</p>
              <p className="text-xs text-emerald-300">(Includes 10% extra safety margin)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
