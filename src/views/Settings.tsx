import { useState, useEffect } from 'react';
import { Moon, Shield, Sparkles, Key } from 'lucide-react';
import { getApiKey, saveApiKey } from '../lib/storage';

export default function Settings() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [aiModel, setAiModel] = useState('Gemini 3.1 Pro (High)');
  const [apiKey, setApiKeyValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getApiKey().then(setApiKeyValue);
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

  const handleSaveKey = () => {
    saveApiKey(apiKey).then(() => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Key className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">Gemini API Key</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Required for analysis</span>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <input 
              type="password" 
              value={apiKey} 
              onChange={e => setApiKeyValue(e.target.value)} 
              placeholder="Enter your API Key" 
              aria-label="Gemini API Key"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-eco-500"
            />
            <button onClick={handleSaveKey} aria-label="Save API Key" className="px-4 py-2 bg-eco-600 text-white text-sm font-semibold rounded-lg hover:bg-eco-700 transition-colors">
              {isSaved ? 'Saved!' : 'Save'}
            </button>
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
