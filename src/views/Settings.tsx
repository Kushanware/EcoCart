import { useState, useEffect } from 'react';
import { Moon, Shield, Sparkles } from 'lucide-react';
import { LocalAIEngine } from '../lib/localAi';

export default function Settings() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [aiModel, setAiModel] = useState('Gemini 3.1 Pro (High)');
  
  const [aiStatus, setAiStatus] = useState<'ready' | 'downloading' | 'unsupported'>('unsupported');
  const [useLocalAI, setUseLocalAI] = useState(() => localStorage.getItem('useLocalAI') === 'true');

  useEffect(() => {
    async function verifyHardware() {
      const status = await LocalAIEngine.checkAvailability();
      setAiStatus(status);
    }
    verifyHardware();
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const changeAiModel = () => {
    const models = ['Gemini 3.1 Pro (High)', 'Gemini 3.1 Flash', 'EcoCart Lite AI'];
    const idx = models.indexOf(aiModel);
    setAiModel(models[(idx + 1) % models.length]);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Settings</h2>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">Dark Theme</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Manual toggle</span>
            </div>
          </div>
          <button 
            onClick={toggleDark} 
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle Dark Theme"
            className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-eco-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isDark ? 'bg-eco-500' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${isDark ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Sparkles className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">AI Model</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{aiModel}</span>
            </div>
          </div>
          <button onClick={changeAiModel} aria-label="Change AI Model" className="text-xs font-semibold text-eco-600 dark:text-eco-400 bg-eco-50 dark:bg-eco-900/30 px-3 py-1.5 rounded-md hover:bg-eco-100 dark:hover:bg-eco-900 transition-colors">Change</button>
        </div>

        <div className="p-4 flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Sparkles className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">On-Device Gemini Nano AI</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Processes recommendations locally via GPU</span>
              </div>
            </div>
            
            <input 
              type="checkbox"
              disabled={aiStatus !== 'ready'}
              checked={useLocalAI}
              onChange={(e) => {
                setUseLocalAI(e.target.checked);
                localStorage.setItem('useLocalAI', e.target.checked.toString());
              }}
              className="w-5 h-5 accent-eco-600"
            />
          </div>

          <div className="mt-2 text-xs pl-12">
            {aiStatus === 'ready' && <span className="text-green-600 dark:text-green-400 font-bold">● Active (Running on Local GPU)</span>}
            {aiStatus === 'downloading' && <span className="text-amber-600 dark:text-amber-400 font-bold">🔄 Chrome is downloading Gemini Nano (4GB)... Check chrome://components</span>}
            {aiStatus === 'unsupported' && <span className="text-red-600 dark:text-red-400 font-bold">❌ Hardware or browser unsupported (Requires Chrome 148+, 4GB VRAM).</span>}
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Shield className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">Privacy</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Data sharing preferences</span>
            </div>
          </div>
          <button className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Manage</button>
        </div>
      </div>
    </div>
  );
}
