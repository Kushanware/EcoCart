import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingDown, Target, Award, Leaf } from 'lucide-react';
import { getMetrics, type ImpactMetrics, defaultMetrics } from '../lib/storage';

const data = [
  { name: 'Mon', co2: 2.1 },
  { name: 'Tue', co2: 1.8 },
  { name: 'Wed', co2: 3.4 },
  { name: 'Thu', co2: 1.2 },
  { name: 'Fri', co2: 0.8 },
  { name: 'Sat', co2: 2.5 },
  { name: 'Sun', co2: 1.0 },
];

export default function ImpactDashboard() {
  const [metrics, setMetrics] = useState<ImpactMetrics>(defaultMetrics);

  useEffect(() => {
    getMetrics().then(setMetrics);
  }, []);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-4 shadow-md border border-slate-900 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-eco-400" />
            <span className="text-xs font-medium text-slate-300">CO₂ Saved</span>
          </div>
          <span className="text-2xl font-bold">{metrics.totalCO2Saved.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span></span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Products Scanned</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{metrics.productsAnalyzed}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Weekly Impact (CO₂ kg)</h3>
        <div className="h-40 w-full" role="img" aria-label="Line chart showing weekly CO2 impact">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
              />
              <Line type="monotone" dataKey="co2" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Recent Achievements</h3>
        <div className="flex gap-3">
          <div className={`flex-1 rounded-lg p-3 border flex flex-col items-center text-center ${metrics.greenChoices > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-50 grayscale'}`}>
            <Trophy className={`w-6 h-6 mb-1 ${metrics.greenChoices > 0 ? 'text-yellow-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold leading-tight ${metrics.greenChoices > 0 ? 'text-yellow-800 dark:text-yellow-400' : 'text-slate-500'}`}>First Green<br/>Purchase</span>
          </div>
          <div className={`flex-1 rounded-lg p-3 border flex flex-col items-center text-center ${metrics.totalCO2Saved >= 10 ? 'bg-eco-50 dark:bg-eco-900/20 border-eco-100 dark:border-eco-800/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-50 grayscale'}`}>
            <Leaf className={`w-6 h-6 mb-1 ${metrics.totalCO2Saved >= 10 ? 'text-eco-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold leading-tight ${metrics.totalCO2Saved >= 10 ? 'text-eco-800 dark:text-eco-400' : 'text-slate-500'}`}>10kg CO₂<br/>Saved</span>
          </div>
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center opacity-50 grayscale">
            <Award className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-500 leading-tight">5x Streak<br/>Champion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
