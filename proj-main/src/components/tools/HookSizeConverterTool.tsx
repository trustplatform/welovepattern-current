import React, { useState } from 'react';
import { Search, Wrench, RefreshCcw } from 'lucide-react';

interface HookSize {
  metric: string;
  usLetter: string;
  uk: string;
  japan: string;
  bestForYarn: string;
}

const HOOK_SIZES: HookSize[] = [
  { metric: '2.00 mm', usLetter: '-', uk: '14', japan: '2/0', bestForYarn: 'Lace / Thread (#0)' },
  { metric: '2.25 mm', usLetter: 'B-1', uk: '13', japan: '3/0', bestForYarn: 'Super Fine / Sock (#1)' },
  { metric: '2.75 mm', usLetter: 'C-2', uk: '12', japan: '4/0', bestForYarn: 'Super Fine / Fingering (#1)' },
  { metric: '3.25 mm', usLetter: 'D-3', uk: '10', japan: '5/0', bestForYarn: 'Fine / Sport (#2)' },
  { metric: '3.50 mm', usLetter: 'E-4', uk: '9', japan: '6/0', bestForYarn: 'Fine / Sport (#2) / Amigurumi' },
  { metric: '3.75 mm', usLetter: 'F-5', uk: '8', japan: '-', bestForYarn: 'Light / DK (#3)' },
  { metric: '4.00 mm', usLetter: 'G-6', uk: '8', japan: '7/0', bestForYarn: 'Light / DK (#3)' },
  { metric: '4.50 mm', usLetter: '7', uk: '7', japan: '7.5/0', bestForYarn: 'Worsted / Aran (#4)' },
  { metric: '5.00 mm', usLetter: 'H-8', uk: '6', japan: '8/0', bestForYarn: 'Worsted / Afghan (#4)' },
  { metric: '5.50 mm', usLetter: 'I-9', uk: '5', japan: '9/0', bestForYarn: 'Worsted / Heavy Aran (#4)' },
  { metric: '6.00 mm', usLetter: 'J-10', uk: '4', japan: '10/0', bestForYarn: 'Bulky (#5)' },
  { metric: '6.50 mm', usLetter: 'K-10.5', uk: '3', japan: '-', bestForYarn: 'Bulky (#5)' },
  { metric: '8.00 mm', usLetter: 'L-11', uk: '0', japan: '-', bestForYarn: 'Super Bulky (#6)' },
  { metric: '9.00 mm', usLetter: 'M/N-13', uk: '00', japan: '-', bestForYarn: 'Super Bulky (#6)' },
  { metric: '10.00 mm', usLetter: 'N/P-15', uk: '000', japan: '-', bestForYarn: 'Jumbo (#7)' }
];

export const HookSizeConverterTool: React.FC = () => {
  const [query, setQuery] = useState('');

  const filtered = HOOK_SIZES.filter(h => 
    h.metric.toLowerCase().includes(query.toLowerCase()) ||
    h.usLetter.toLowerCase().includes(query.toLowerCase()) ||
    h.uk.toLowerCase().includes(query.toLowerCase()) ||
    h.bestForYarn.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Crochet Hook Size Converter</h2>
          <p className="text-purple-100 text-sm mt-1">Convert metric (mm) hook sizes to US letter names, UK numbers, and Japanese sizes.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search e.g. 5.0mm or H-8..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/20 placeholder-purple-200 text-white border border-white/30 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:bg-white/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">Metric (mm)</th>
                <th className="py-4 px-5 text-[#E96BA8]">US Letter</th>
                <th className="py-4 px-5">UK Number</th>
                <th className="py-4 px-5">Japan Size</th>
                <th className="py-4 px-5">Recommended Yarn Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
              {filtered.map((row, idx) => (
                <tr key={idx} className="hover:bg-pink-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">{row.metric}</td>
                  <td className="py-3.5 px-5 font-black text-[#E96BA8] text-base">{row.usLetter}</td>
                  <td className="py-3.5 px-5">{row.uk}</td>
                  <td className="py-3.5 px-5">{row.japan}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 font-semibold">{row.bestForYarn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
