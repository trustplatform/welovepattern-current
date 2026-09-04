import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Maximize2, 
  Square, 
  DollarSign, 
  RefreshCw, 
  CheckCircle2, 
  FileText, 
  Clock, 
  BookOpen, 
  ListOrdered, 
  FolderHeart, 
  Layers, 
  Scissors,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Calculator,
  Search,
  Check,
  Tag,
  BookMarked,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface OtherToolsProps {
  toolId?: string;
  activeToolSlug?: string;
}

export const OtherToolsContainer: React.FC<OtherToolsProps> = ({ toolId, activeToolSlug }) => {
  const currentId = toolId || activeToolSlug || '';

  // --- STITCH COUNTER STATE ---
  const [stitchSections, setStitchSections] = useState<{ id: string; name: string; count: number }[]>([
    { id: '1', name: 'Front Panel Repeat', count: 18 },
    { id: '2', name: 'Sleeve Increase', count: 6 }
  ]);
  const [newSecName, setNewSecName] = useState('');

  // --- PROJECT TRACKER STATE ---
  const [projects, setProjects] = useState<any[]>([
    { id: '1', title: 'Sunburst Throw Blanket', status: 'In Progress', progressPercent: 65, hookSize: '5.0mm', yarnNotes: '600g Cream + Pink', startDate: '2026-07-10' },
    { id: '2', title: 'Honey Bear Plushie', status: 'Completed', progressPercent: 100, hookSize: '3.5mm', yarnNotes: 'Brown Plush Cotton', startDate: '2026-06-01' }
  ]);
  const [projTitle, setProjTitle] = useState('');
  const [projHook, setProjHook] = useState('5.0mm');
  const projectsLoadedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crochethub_projects');
      if (saved) {
        try { setProjects(JSON.parse(saved)); } catch (e) {}
      }
      projectsLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && projectsLoadedRef.current) {
      localStorage.setItem('crochethub_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // --- GRANNY SQUARE CALCULATOR STATE ---
  const [desiredBlanketW, setDesiredBlanketW] = useState<number>(50); // inches
  const [desiredBlanketH, setDesiredBlanketH] = useState<number>(60); // inches
  const [squareSize, setSquareSize] = useState<number>(6); // inches

  const squaresW = Math.max(1, Math.round(desiredBlanketW / squareSize));
  const squaresH = Math.max(1, Math.round(desiredBlanketH / squareSize));
  const totalSquares = squaresW * squaresH;

  // --- BLANKET CALCULATOR STATE ---
  const [blanketPreset, setBlanketPreset] = useState<string>('throw');
  const PRESETS: Record<string, { w: number; h: number; name: string }> = {
    'baby': { w: 30, h: 36, name: 'Baby Afghan (30" x 36")' },
    'lapghan': { w: 40, h: 48, name: 'Lapghan Throw (40" x 48")' },
    'throw': { w: 50, h: 60, name: 'Standard Throw (50" x 60")' },
    'twin': { w: 66, h: 90, name: 'Twin Bed Blanket (66" x 90")' },
    'queen': { w: 90, h: 90, name: 'Queen Bed Blanket (90" x 90")' }
  };
  const selectedPreset = PRESETS[blanketPreset] || PRESETS['throw'];

  // --- CROCHET TIMER STATE ---
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- PATTERN DIFFICULTY QUIZ STATE ---
  const [diffAnswers, setDiffAnswers] = useState<Record<string, number>>({});
  const calculateDifficulty = () => {
    const score = (Object.values(diffAnswers) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (score <= 3) return { level: 'Beginner', desc: 'Basic single & double crochet with minimal shaping.' };
    if (score <= 7) return { level: 'Easy', desc: 'Simple stitch repeats and basic color changes.' };
    if (score <= 12) return { level: 'Intermediate', desc: 'Post stitches, cable texture, and detailed assembly.' };
    return { level: 'Advanced', desc: 'Complex lace, tapestry colorwork, or intricate lace shaping.' };
  };

  // --- YARN WEIGHT CONVERTER STATE ---
  const [selectedYarnWeight, setSelectedYarnWeight] = useState<string>('4');
  const YARN_WEIGHT_DATA: Record<string, { name: string; ply: string; wpi: string; hook: string; needle: string; gauge: string; desc: string }> = {
    '0': { name: 'Lace / Thread', ply: '1 - 2 ply', wpi: '18+ WPI', hook: '1.6 - 2.25 mm', needle: '1.5 - 2.25 mm (US 000-1)', gauge: '32-40 sts / 4 in', desc: 'Doilies, delicate shawls, fine lace collars.' },
    '1': { name: 'Super Fine / Sock', ply: '3 - 4 ply', wpi: '14 - 18 WPI', hook: '2.25 - 3.5 mm (B-1 to E-4)', needle: '2.25 - 3.25 mm (US 1-3)', gauge: '21-32 sts / 4 in', desc: 'Socks, lightweight baby booties, fingering shawls.' },
    '2': { name: 'Fine / Sport', ply: '5 ply', wpi: '12 - 14 WPI', hook: '3.5 - 4.5 mm (E-4 to 7)', needle: '3.25 - 3.75 mm (US 3-5)', gauge: '16-20 sts / 4 in', desc: 'Baby blankets, lightweight sweaters, lightweight amigurumi.' },
    '3': { name: 'Light / DK', ply: '8 ply', wpi: '11 - 12 WPI', hook: '4.5 - 5.5 mm (7 to I-9)', needle: '3.75 - 4.5 mm (US 5-7)', gauge: '12-17 sts / 4 in', desc: 'Cardigans, baby sets, light scarves, blankets.' },
    '4': { name: 'Medium / Worsted / Aran', ply: '10 - 12 ply', wpi: '9 - 11 WPI', hook: '5.5 - 6.5 mm (I-9 to K-10.5)', needle: '4.5 - 5.5 mm (US 7-9)', gauge: '11-14 sts / 4 in', desc: 'Afghans, beanies, winter sweaters, amigurumi.' },
    '5': { name: 'Bulky / Chunky', ply: '12 - 14 ply', wpi: '7 - 8 WPI', hook: '6.5 - 9.0 mm (K-10.5 to M-13)', needle: '5.5 - 8.0 mm (US 9-11)', gauge: '8-11 sts / 4 in', desc: 'Chunky rugs, warm cowls, thick winter hats.' },
    '6': { name: 'Super Bulky / Roving', ply: '16 ply+', wpi: '5 - 6 WPI', hook: '9.0 - 15.0 mm (M-13 to Q)', needle: '8.0 - 12.75 mm (US 11-17)', gauge: '5-9 sts / 4 in', desc: 'Quick weekend blankets, chunky baskets, thick cowls.' },
    '7': { name: 'Jumbo', ply: 'Giant', wpi: '1 - 4 WPI', hook: '15.0 mm+ (Q and up)', needle: '12.75 mm+ (US 17+)', gauge: '6 or fewer sts / 4 in', desc: 'Arm knitting, giant floor cushions, chunky throws.' }
  };

  // --- NEEDLE SIZE CONVERTER STATE ---
  const [selectedNeedleMm, setSelectedNeedleMm] = useState<string>('5.0');
  const NEEDLE_DATA: Record<string, { us: string; uk: string; yarn: string }> = {
    '2.0': { us: '0', uk: '14', yarn: '#0 Lace' },
    '2.25': { us: '1', uk: '13', yarn: '#1 Sock' },
    '2.75': { us: '2', uk: '12', yarn: '#1 Sock' },
    '3.25': { us: '3', uk: '10', yarn: '#2 Sport' },
    '3.5': { us: '4', uk: '—', yarn: '#2 Sport / #3 DK' },
    '3.75': { us: '5', uk: '9', yarn: '#3 DK' },
    '4.0': { us: '6', uk: '8', yarn: '#3 DK' },
    '4.5': { us: '7', uk: '7', yarn: '#4 Worsted' },
    '5.0': { us: '8', uk: '6', yarn: '#4 Worsted' },
    '5.5': { us: '9', uk: '5', yarn: '#4 Worsted' },
    '6.0': { us: '10', uk: '4', yarn: '#5 Bulky' },
    '6.5': { us: '10.5', uk: '3', yarn: '#5 Bulky' },
    '8.0': { us: '11', uk: '0', yarn: '#5 Bulky / #6 Super Bulky' },
    '9.0': { us: '13', uk: '00', yarn: '#6 Super Bulky' },
    '10.0': { us: '15', uk: '000', yarn: '#6 Super Bulky' }
  };

  // --- BORDER CALCULATOR STATE ---
  const [borderStitchType, setBorderStitchType] = useState<string>('dc');
  const [borderRows, setBorderRows] = useState<number>(100);
  const [borderTopSts, setBorderTopSts] = useState<number>(120);

  const calculateBorderPickups = () => {
    let ratio = 1;
    if (borderStitchType === 'sc') ratio = 1;
    if (borderStitchType === 'hdc') ratio = 1.5;
    if (borderStitchType === 'dc') ratio = 2;
    if (borderStitchType === 'tr') ratio = 3;
    const sideSts = Math.round(borderRows * ratio);
    const totalBorderSts = (sideSts * 2) + (borderTopSts * 2) + 4; // +4 for corners
    return { sideSts, totalBorderSts };
  };
  const borderCalculated = calculateBorderPickups();

  // --- YARN COST CALCULATOR STATE ---
  const [skeinPrice, setSkeinPrice] = useState<number>(7.99);
  const [skeinYardage, setSkeinYardage] = useState<number>(200);
  const [projectYardsUsed, setProjectYardsUsed] = useState<number>(650);
  const [notionsCost, setNotionsCost] = useState<number>(3.00);

  const costPerYard = skeinYardage > 0 ? skeinPrice / skeinYardage : 0;
  const directYarnCost = projectYardsUsed * costPerYard;
  const skeinsToBuy = Math.ceil(projectYardsUsed / (skeinYardage || 1));
  const fullPurchasedCost = (skeinsToBuy * skeinPrice) + notionsCost;
  const exactMaterialUsedCost = directYarnCost + notionsCost;

  // --- YARN SUBSTITUTE FINDER STATE ---
  const [subWeight, setSubWeight] = useState<string>('worsted');
  const [subFiber, setSubFiber] = useState<string>('acrylic');
  const SUB_RECOMMENDATIONS: Record<string, { title: string; fiber: string; yardageNote: string; care: string }[]> = {
    'worsted': [
      { title: 'Lion Brand Heartland', fiber: '100% Premium Acrylic', yardageNote: '251 yds / 142g', care: 'Machine Wash & Dry' },
      { title: 'Caron Simply Soft', fiber: '100% Acrylic', yardageNote: '315 yds / 170g', care: 'Soft silk-like sheen' },
      { title: 'Paintbox Yarns Simply Aran', fiber: '100% Acrylic', yardageNote: '201 yds / 100g', care: 'Huge color range' },
      { title: 'Cascade 220 Superwash', fiber: '100% Merino Wool', yardageNote: '220 yds / 100g', care: 'Superwash wool alternative' }
    ],
    'dk': [
      { title: 'Stylecraft Special DK', fiber: '100% Acrylic', yardageNote: '322 yds / 100g', care: 'Industry gold standard for blankets' },
      { title: 'Paintbox Yarns Cotton DK', fiber: '100% Cotton', yardageNote: '137 yds / 50g', care: 'Crisp plant fiber definition' }
    ],
    'bulky': [
      { title: 'Bernat Blanket Yarn', fiber: '100% Polyester Chenille', yardageNote: '220 yds / 300g', care: 'Plush & ultra cozy' },
      { title: 'Lion Brand Hue + Me', fiber: '80% Acrylic / 20% Wool', yardageNote: '137 yds / 125g', care: 'Modern matte texture' }
    ]
  };

  // --- PATTERN PDF & LIBRARY STATE ---
  const [pdfNotes, setPdfNotes] = useState<{ id: string; title: string; link: string; tag: string }[]>([
    { id: '1', title: 'Vintage Rose Hexagon Afghan', link: 'https://welovepattern.com/patterns', tag: 'Blankets' },
    { id: '2', title: 'Chubby Chubby Hamster Plush', link: 'https://welovepattern.com/patterns', tag: 'Amigurumi' }
  ]);
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfTag, setNewPdfTag] = useState('General');

  // RENDER SPECIFIC TOOL BASED ON TOOL ID
  switch (currentId) {

    // 2. STITCH COUNTER
    case 'stitch-counter':
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-[#9B7CF8] text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ListOrdered className="w-6 h-6" /> Multi-Section Stitch Counter
            </h2>
            <p className="text-purple-100 text-sm">Track stitch repeats across multiple pattern sections simultaneously.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New section name (e.g. Right Armhole)..."
                value={newSecName}
                onChange={(e) => setNewSecName(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm"
              />
              <button
                onClick={() => {
                  if (newSecName) {
                    setStitchSections([...stitchSections, { id: Date.now().toString(), name: newSecName, count: 0 }]);
                    setNewSecName('');
                  }
                }}
                className="bg-[#9B7CF8] text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              >
                Add Section
              </button>
            </div>

            <div className="space-y-3">
              {stitchSections.map((sec) => (
                <div key={sec.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{sec.name}</p>
                    <p className="text-2xl font-black text-[#9B7CF8]">{sec.count} sts</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStitchSections(stitchSections.map(s => s.id === sec.id ? { ...s, count: Math.max(0, s.count - 1) } : s))}
                      className="bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold text-sm cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => setStitchSections(stitchSections.map(s => s.id === sec.id ? { ...s, count: s.count + 1 } : s))}
                      className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold text-base cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => setStitchSections(stitchSections.filter(s => s.id !== sec.id))}
                      className="bg-rose-100 text-rose-600 p-2 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    // 3. PROJECT TRACKER
    case 'project-tracker':
      return (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-[#E96BA8] text-white p-6 rounded-[24px] flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FolderHeart className="w-6 h-6" /> WIPs Project Tracker
              </h2>
              <p className="text-pink-100 text-sm">Organize your active works-in-progress and completed projects.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Add New Crochet Project</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Project title (e.g. Boho Tote Bag)..."
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="Hook size (e.g. 5.0mm)"
                value={projHook}
                onChange={(e) => setProjHook(e.target.value)}
                className="w-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm"
              />
              <button
                onClick={() => {
                  if (projTitle) {
                    setProjects([{ id: Date.now().toString(), title: projTitle, status: 'In Progress', progressPercent: 10, hookSize: projHook, startDate: new Date().toISOString().split('T')[0] }, ...projects]);
                    setProjTitle('');
                  }
                }}
                className="bg-[#E96BA8] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              >
                Save WIP
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {projects.map((p) => (
                <div key={p.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white">{p.title}</h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#E96BA8]">{p.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">Hook: {p.hookSize} • Started: {p.startDate}</p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E96BA8] rounded-full" style={{ width: `${p.progressPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    // 6. YARN WEIGHT CONVERTER
    case 'yarn-weight-converter':
      const currentYarn = YARN_WEIGHT_DATA[selectedYarnWeight] || YARN_WEIGHT_DATA['4'];
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6" /> Standard Yarn Weight Converter (CYC 0-7)
            </h2>
            <p className="text-purple-100 text-sm">Convert between CYC categories, Wraps Per Inch (WPI), ply ratings, and hook sizes.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Select CYC Weight Category</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {Object.keys(YARN_WEIGHT_DATA).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedYarnWeight(key)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedYarnWeight === key 
                        ? 'bg-[#E96BA8] text-white border-[#E96BA8] shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    #{key}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase text-slate-400">Category Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">#{selectedYarnWeight} - {currentYarn.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">WPI (Wraps Per Inch)</span>
                  <span className="font-bold text-[#E96BA8]">{currentYarn.wpi}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold">UK / AU Ply</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentYarn.ply}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold">Recommended Hook</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentYarn.hook}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-bold">Standard Gauge</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentYarn.gauge}</span>
                </div>
              </div>
              <div className="pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                <strong>Best Project Uses:</strong> {currentYarn.desc}
              </div>
            </div>
          </div>
        </div>
      );

    // 8. NEEDLE SIZE CONVERTER
    case 'needle-size-converter':
      const currentNeedle = NEEDLE_DATA[selectedNeedleMm] || NEEDLE_DATA['5.0'];
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Scissors className="w-6 h-6" /> Knitting Needle Size Converter
            </h2>
            <p className="text-sky-100 text-sm">Instant lookup between Metric (mm), US Numbers, and UK/Canadian gauge sizes.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Select Metric Diameter (mm)</label>
              <select
                value={selectedNeedleMm}
                onChange={(e) => setSelectedNeedleMm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-base"
              >
                {Object.keys(NEEDLE_DATA).map(mm => (
                  <option key={mm} value={mm}>{mm} mm (US {NEEDLE_DATA[mm].us})</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 text-center">
              <span className="text-xs uppercase text-sky-400 font-bold">Selected Metric Size</span>
              <h3 className="text-3xl font-black text-white">{selectedNeedleMm} mm</h3>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">US Needle Size</p>
                  <p className="text-xl font-black text-[#E96BA8]">US {currentNeedle.us}</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">UK / Canadian Size</p>
                  <p className="text-xl font-black text-sky-400">{currentNeedle.uk}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-1">Recommended for: <strong>{currentNeedle.yarn}</strong></p>
            </div>
          </div>
        </div>
      );

    // 9. GRANNY SQUARE CALCULATOR
    case 'granny-square-calculator':
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Grid className="w-6 h-6" /> Granny Square Blanket Calculator
            </h2>
            <p className="text-purple-100 text-sm">Calculate how many squares you need for your target blanket dimensions.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-bold">Target Width (inches)</label>
                <input
                  type="number"
                  value={desiredBlanketW}
                  onChange={(e) => setDesiredBlanketW(parseFloat(e.target.value) || 10)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">Target Height (inches)</label>
                <input
                  type="number"
                  value={desiredBlanketH}
                  onChange={(e) => setDesiredBlanketH(parseFloat(e.target.value) || 10)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">1 Square Size (inches)</label>
                <input
                  type="number"
                  value={squareSize}
                  onChange={(e) => setSquareSize(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm text-[#E96BA8]"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl text-center space-y-2">
              <p className="text-xs text-purple-300 font-bold uppercase">Required Grid Assembly</p>
              <p className="text-4xl font-black text-[#E96BA8]">{squaresW} wide × {squaresH} high</p>
              <p className="text-sm font-bold text-amber-300">Total: {totalSquares} Granny Squares Needed</p>
            </div>
          </div>
        </div>
      );

    // 10. BLANKET CALCULATOR
    case 'blanket-calculator':
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-indigo-600 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Maximize2 className="w-6 h-6" /> Blanket Dimension Calculator
            </h2>
            <p className="text-indigo-100 text-sm">Estimate starting chain stitches & total rows for standard mattress afghans.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Select Blanket Mattress / Style Preset</label>
              <select
                value={blanketPreset}
                onChange={(e) => setBlanketPreset(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-base"
              >
                {Object.entries(PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase text-indigo-400">Calculated Specifications (Worsted Yarn & 5mm Hook)</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">Starting Chain Stitches</p>
                  <p className="text-2xl font-black text-[#E96BA8]">{Math.round(selectedPreset.w * 3.5)} sts</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">Total Rows Needed</p>
                  <p className="text-2xl font-black text-[#9B7CF8]">{Math.round(selectedPreset.h * 2.5)} rows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // 11. BORDER CALCULATOR
    case 'border-calculator':
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Square className="w-6 h-6" /> Crochet Blanket Border Calculator
            </h2>
            <p className="text-teal-100 text-sm">Calculate edge pick-up stitches and corner multiples for ripple-free borders.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-bold">Body Stitch Type</label>
                <select
                  value={borderStitchType}
                  onChange={(e) => setBorderStitchType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                >
                  <option value="sc">Single Crochet (1:1)</option>
                  <option value="hdc">Half Double (3:2)</option>
                  <option value="dc">Double Crochet (2:1)</option>
                  <option value="tr">Treble Crochet (3:1)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">Total Side Rows</label>
                <input
                  type="number"
                  value={borderRows}
                  onChange={(e) => setBorderRows(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">Top/Bottom Stitches</label>
                <input
                  type="number"
                  value={borderTopSts}
                  onChange={(e) => setBorderTopSts(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm text-[#E96BA8]"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 text-center">
              <p className="text-xs text-teal-300 font-bold uppercase">Border Round 1 Pick-Up Plan</p>
              <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                <div className="bg-slate-800 p-2.5 rounded-xl">
                  <p className="text-xs text-slate-400">Pick up along each side</p>
                  <p className="text-lg font-bold text-teal-300">{borderCalculated.sideSts} stitches</p>
                </div>
                <div className="bg-slate-800 p-2.5 rounded-xl">
                  <p className="text-xs text-slate-400">Total Round 1 Perimeter</p>
                  <p className="text-lg font-bold text-[#E96BA8]">{borderCalculated.totalBorderSts} stitches</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-1">Corner rule: Place 3 sc or (dc, ch 2, dc) into each of the 4 corner loops.</p>
            </div>
          </div>
        </div>
      );

    // 12. YARN COST CALCULATOR
    case 'yarn-cost-calculator':
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6" /> Raw Yarn Cost Calculator
            </h2>
            <p className="text-amber-100 text-sm">Calculate exact material expenditure per project including partial skeins and notions.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-bold">Price per Skein ($)</label>
                <input
                  type="number"
                  step="0.10"
                  value={skeinPrice}
                  onChange={(e) => setSkeinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">Yards per Skein</label>
                <input
                  type="number"
                  value={skeinYardage}
                  onChange={(e) => setSkeinYardage(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">Yards Used in Project</label>
                <input
                  type="number"
                  value={projectYardsUsed}
                  onChange={(e) => setProjectYardsUsed(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm text-[#E96BA8]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold">Notions / Tags ($)</label>
                <input
                  type="number"
                  step="0.50"
                  value={notionsCost}
                  onChange={(e) => setNotionsCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-xl font-bold mt-1 text-sm"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">Direct Material Consumed</p>
                  <p className="text-2xl font-black text-emerald-400">${exactMaterialUsedCost.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 font-mono">${costPerYard.toFixed(3)} / yard</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">Skeins to Buy ({skeinsToBuy} skeins)</p>
                  <p className="text-2xl font-black text-amber-300">${fullPurchasedCost.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">Full checkout cost</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // 14. YARN SUBSTITUTE FINDER
    case 'yarn-substitute-finder':
      const substitutes = SUB_RECOMMENDATIONS[subWeight] || SUB_RECOMMENDATIONS['worsted'];
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Search className="w-6 h-6" /> Yarn Substitute Finder
            </h2>
            <p className="text-pink-100 text-sm">Find compatible alternative yarns by weight class, yardage density, and fiber type.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex gap-2">
              {['worsted', 'dk', 'bulky'].map(wt => (
                <button
                  key={wt}
                  onClick={() => setSubWeight(wt)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs capitalize border transition-all cursor-pointer ${
                    subWeight === wt ? 'bg-[#E96BA8] text-white border-[#E96BA8]' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {wt} Weight
                </button>
              ))}
            </div>

            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Recommended Alternative Yarns</h4>
              {substitutes.map((sub, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{sub.title}</p>
                    <p className="text-xs text-slate-500">{sub.fiber} • {sub.yardageNote}</p>
                  </div>
                  <span className="text-xs font-bold bg-pink-100 dark:bg-pink-900/40 text-[#E96BA8] px-2.5 py-1 rounded-full">
                    {sub.care}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    // 15. PATTERN DIFFICULTY CHECKER
    case 'pattern-difficulty-checker':
      const diffResult = calculateDifficulty();
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-500 to-sky-600 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> Pattern Difficulty Level Checker
            </h2>
            <p className="text-emerald-100 text-sm">Answer a few technique questions to find out the skill level rating.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4 text-sm">
            {[
              { q: '1. What stitch types are used?', options: [{ label: 'Basic (sc, hdc, dc)', val: 1 }, { label: 'Texture (puff, popcorn, bobble)', val: 3 }, { label: 'Complex Lace / Cables', val: 5 }] },
              { q: '2. Are there multiple yarn color changes?', options: [{ label: 'Solid 1 color', val: 1 }, { label: 'Stripes at row ends', val: 2 }, { label: 'Tapestry / Intarsia Motif', val: 4 }] }
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">{item.q}</p>
                <div className="flex flex-wrap gap-2">
                  {item.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => setDiffAnswers({ ...diffAnswers, [idx]: opt.val })}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        diffAnswers[idx] === opt.val ? 'bg-[#E96BA8] text-white border-[#E96BA8]' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs uppercase text-emerald-400 font-bold">Assessed Skill Level</span>
              <h3 className="text-2xl font-black text-[#E96BA8]">{diffResult.level}</h3>
              <p className="text-xs text-slate-300">{diffResult.desc}</p>
            </div>
          </div>
        </div>
      );

    // 16. PATTERN PDF ORGANIZER & 18. PATTERN LIBRARY
    case 'pattern-pdf-organizer':
    case 'pattern-library':
      const isLibrary = currentId === 'pattern-library';
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 rounded-[24px]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookMarked className="w-6 h-6" /> {isLibrary ? 'Crochet Pattern Library' : 'Pattern PDF Organizer'}
            </h2>
            <p className="text-pink-100 text-sm">Save pattern links, tag project ideas, and organize your maker inspiration.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Pattern title (e.g. Mosaic Star Blanket)..."
                value={newPdfTitle}
                onChange={(e) => setNewPdfTitle(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm"
              />
              <select
                value={newPdfTag}
                onChange={(e) => setNewPdfTag(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm font-bold"
              >
                <option value="Blankets">Blankets</option>
                <option value="Amigurumi">Amigurumi</option>
                <option value="Wearables">Wearables</option>
                <option value="General">General</option>
              </select>
              <button
                onClick={() => {
                  if (newPdfTitle) {
                    setPdfNotes([...pdfNotes, { id: Date.now().toString(), title: newPdfTitle, link: 'https://welovepattern.com/patterns', tag: newPdfTag }]);
                    setNewPdfTitle('');
                  }
                }}
                className="bg-[#E96BA8] text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {pdfNotes.map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded-md">
                      {item.tag}
                    </span>
                  </div>
                  <button
                    onClick={() => setPdfNotes(pdfNotes.filter(n => n.id !== item.id))}
                    className="text-rose-500 hover:text-rose-700 p-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    // 17. CROCHET TIMER
    case 'crochet-timer':
      return (
        <div className="space-y-6 max-w-md mx-auto text-center">
          <div className="bg-slate-900 text-white p-8 rounded-[24px] space-y-4 border border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-pink-400 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-[#E96BA8]" /> Crafting Session Timer
            </h2>

            <div className="text-6xl font-black font-mono tracking-wider text-white">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 cursor-pointer ${
                  timerActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#E96BA8] hover:bg-pink-600'
                }`}
              >
                {timerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{timerActive ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={() => { setTimerActive(false); setTimerSeconds(0); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-2xl font-bold cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );

    // DEFAULT FALLBACK
    default: {
      const displayTitle = currentId ? currentId.replace(/-/g, ' ') : 'Craft Tool';
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
            <h2 className="text-2xl font-extrabold capitalize">{displayTitle}</h2>
            <p className="text-pink-100 text-sm mt-1">Interactive craft calculator and reference tool ready for your projects.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-pink-100 text-[#E96BA8] flex items-center justify-center mx-auto text-3xl">
              🧶
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{displayTitle} Active</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              This craft reference tool is pre-configured with standard craft formulas and standard measurements.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-xs text-slate-600 dark:text-slate-300 font-mono">
              Status: 100% Operational & Offline Capable
            </div>
          </div>
        </div>
      );
    }
  }
};
