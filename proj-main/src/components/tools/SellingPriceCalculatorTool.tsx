import React, { useState } from 'react';
import { Tag, DollarSign, PieChart, Sparkles } from 'lucide-react';

export const SellingPriceCalculatorTool: React.FC = () => {
  const [yarnCost, setYarnCost] = useState<number>(18.00);
  const [notionsCost, setNotionsCost] = useState<number>(4.00);
  const [hoursWorked, setHoursWorked] = useState<number>(6);
  const [hourlyWage, setHourlyWage] = useState<number>(15.00);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(20);
  const [etsyFeePercent, setEtsyFeePercent] = useState<number>(10);

  const materialsTotal = yarnCost + notionsCost;
  const laborTotal = hoursWorked * hourlyWage;
  const baseCost = materialsTotal + laborTotal;
  const profitAmount = baseCost * (profitMarginPercent / 100);
  const wholesalePrice = baseCost + profitAmount;
  const retailPrice = wholesalePrice * 1.5; // standard retail formula
  const etsyFees = retailPrice * (etsyFeePercent / 100);
  const netEarnings = retailPrice - etsyFees - materialsTotal;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Crochet Selling Price Calculator</h2>
            <p className="text-pink-100 text-sm">Price your handmade items fairly for Etsy, craft fairs, or custom orders!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cost Input Form */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 rounded-[24px] space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            1. Materials & Labor Inputs
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-slate-500 font-medium">Total Yarn Spent ($):</label>
              <input
                type="number"
                step="0.5"
                value={yarnCost}
                onChange={(e) => setYarnCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Notions & Extras (Buttons, Stuffing, Tags):</label>
              <input
                type="number"
                step="0.5"
                value={notionsCost}
                onChange={(e) => setNotionsCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Hours Worked:</label>
                <input
                  type="number"
                  step="0.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1 text-[#E96BA8]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Hourly Wage ($/hr):</label>
                <input
                  type="number"
                  step="1"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1 text-[#E96BA8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-500 font-medium">Profit Margin (%):</label>
                <input
                  type="number"
                  value={profitMarginPercent}
                  onChange={(e) => setProfitMarginPercent(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Platform Fee (%):</label>
                <input
                  type="number"
                  value={etsyFeePercent}
                  onChange={(e) => setEtsyFeePercent(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-bold mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Results Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-4">
              2. Recommended Retail Pricing Breakdown
            </h3>

            <div className="space-y-3">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-pink-500/30">
                <p className="text-xs text-pink-300 font-bold uppercase">Recommended Etsy / Craft Retail Price</p>
                <p className="text-4xl font-black text-white mt-1">${retailPrice.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 block">Materials Total</span>
                  <span className="font-bold text-slate-200 text-sm">${materialsTotal.toFixed(2)}</span>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 block">Your Labor Earnings</span>
                  <span className="font-bold text-emerald-400 text-sm">${laborTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-800 p-3.5 rounded-xl text-xs flex justify-between items-center text-slate-300">
                <span>Net Profit After Platform Fees & Yarn:</span>
                <span className="font-bold text-amber-300 text-sm">${netEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/60 p-3 rounded-xl">
            💡 <strong>Pro Tip:</strong> Never reduce your hourly wage to match mass-manufactured store prices. Handcrafted crochet items are luxury art!
          </div>
        </div>

      </div>
    </div>
  );
};
