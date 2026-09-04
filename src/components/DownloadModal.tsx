import React, { useState } from 'react';
import { Pattern } from '../types';
import { X, Download, FileText, CheckCircle2, Share2, Sparkles, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

interface DownloadModalProps {
  pattern: Pattern | null;
  onClose: () => void;
  onDownloadSuccess: (patternId: string) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  pattern,
  onClose,
  onDownloadSuccess
}) => {
  const [downloading, setDownloading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!pattern) return null;

  const handleGeneratePDF = () => {
    if (pattern.pdfUrl) {
      window.open(pattern.pdfUrl, '_blank', 'noopener,noreferrer');
      setCompleted(true);
      onDownloadSuccess(pattern.id);
      return;
    }

    setDownloading(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(233, 107, 168); // #E96BA8
        doc.rect(0, 0, 210, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('WeLovePattern Free Pattern', 14, 16);
        
        doc.setFontSize(10);
        doc.text('www.welovepattern.com', 160, 16);

        // Pattern Title
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(pattern.title, 14, 38);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(pattern.subtitle, 14, 45);

        // Specifications Box
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 52, 182, 35, 3, 3, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 107, 168);
        doc.text(`Difficulty: ${pattern.difficulty}`, 20, 62);
        doc.text(`Hook Size: ${pattern.hookSize}`, 85, 62);
        doc.text(`Yarn: ${pattern.yarnWeight}`, 145, 62);

        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Finished Size: ${pattern.finishedSize}`, 20, 72);
        doc.text(`Gauge: ${pattern.gauge}`, 120, 72);

        // Materials Header
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Materials Needed', 14, 98);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let currentY = 106;
        pattern.materials.forEach((item) => {
          doc.text(`[  ]  ${item}`, 18, currentY);
          currentY += 7;
        });

        // Steps Header
        currentY += 5;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Pattern Instructions', 14, currentY);

        currentY += 8;
        doc.setFontSize(9);
        pattern.steps.forEach((step) => {
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(233, 107, 168);
          doc.text(`${step.rowNumber}: `, 14, currentY);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const lines = doc.splitTextToSize(step.instruction, 140);
          doc.text(lines, 45, currentY);
          currentY += (lines.length * 5) + 4;
        });

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('Thank you for crafting with WeLovePattern! Happy stitching.', 14, 285);

        // Save PDF
        doc.save(`${pattern.slug}-welovepattern.pdf`);
        setDownloading(false);
        setCompleted(true);
        onDownloadSuccess(pattern.id);
      } catch (err) {
        console.error("PDF generation error:", err);
        setDownloading(false);
        setCompleted(true);
      }
    }, 600);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-[24px] max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] text-white flex items-center justify-center mx-auto text-3xl shadow-md">
            📄
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Download Pattern PDF
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Free high-resolution printer-friendly PDF file
          </p>
        </div>

        {/* File Information Card */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {pattern.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Category: {pattern.category} • Difficulty: {pattern.difficulty}
              </p>
            </div>
            <span className="bg-pink-100 text-[#E96BA8] dark:bg-pink-950/60 dark:text-pink-300 text-xs font-bold px-2.5 py-1 rounded-full">
              Free PDF
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs text-center">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl">
              <p className="text-slate-400">File Size</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{pattern.pdfSize}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl">
              <p className="text-slate-400">Length</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{pattern.pdfPages} Pages</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl">
              <p className="text-slate-400">License</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Personal Use</p>
            </div>
          </div>
        </div>

        {/* Actions & Download Trigger */}
        <div className="space-y-3">
          <button
            onClick={handleGeneratePDF}
            disabled={downloading}
            className="w-full bg-[#E96BA8] hover:bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-base active:scale-98 disabled:opacity-60"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing PDF Document...</span>
              </>
            ) : completed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>PDF Downloaded! Click to Save Again</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Printable PDF Now</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#9B7CF8]" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Pattern'}</span>
          </button>
        </div>

        {/* Printer Friendly Guarantee */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/50">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Includes materials checklist, row-by-row steps, and hook gauge specs.</span>
        </div>

      </div>
    </div>
  );
};
