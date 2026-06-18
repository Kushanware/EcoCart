import { ShoppingBag, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ViewState } from '../App';
import { EcoScore } from '../components/ui/EcoScore';
import type { ProductData } from '../content';
import type { EcoAnalysis } from '../lib/gemini';

interface PopupProps {
  onNavigate: (view: ViewState) => void;
  data: Partial<ProductData> | null;
  analysis: EcoAnalysis | null;
  isLoading: boolean;
  error: string;
}

export default function PopupDashboard({ onNavigate, data, analysis, isLoading, error }: PopupProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Error</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        <button aria-label="Go to Settings" onClick={() => onNavigate('settings')} className="mt-4 px-4 py-2 bg-eco-600 text-white rounded-lg text-sm font-semibold">Go to Settings</button>
      </div>
    );
  }

  if (isLoading || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="w-10 h-10 text-eco-500 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">Analyzing product with Gemini API...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-eco-50 dark:bg-eco-900/20 rounded-bl-[100px] -z-10"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-2">
            <span className="text-xs font-semibold text-eco-600 dark:text-eco-400 uppercase tracking-wider mb-1 block">
              {data?.category ? data.category.split(' > ').pop() : 'Product'} Detected
            </span>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2" title={data?.title || 'Product'}>
              {data?.title || 'Unknown Product'}
            </h2>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6">
          <EcoScore score={analysis.ecoScore} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${analysis.ecoScore >= 70 ? 'bg-green-500' : analysis.ecoScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {analysis.ecoScore >= 70 ? 'Good Choice' : analysis.ecoScore >= 40 ? 'Average Choice' : 'Poor Choice'}
              </span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analysis.confidence === 'High' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                analysis.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {analysis.confidence} Confidence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {analysis.recommendations}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Carbon Impact</span>
          <span className={`text-lg font-bold ${
            analysis.carbonImpact === 'Low' ? 'text-green-600 dark:text-green-400' :
            analysis.carbonImpact === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
            analysis.carbonImpact === 'High' ? 'text-orange-600 dark:text-orange-400' :
            'text-red-600 dark:text-red-400'
          }`}>{analysis.carbonImpact}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Water Usage</span>
          <span className={`text-lg font-bold ${
            analysis.waterUsage === 'Low' ? 'text-green-600 dark:text-green-400' :
            analysis.waterUsage === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
            analysis.waterUsage === 'High' ? 'text-orange-600 dark:text-orange-400' :
            'text-red-600 dark:text-red-400'
          }`}>{analysis.waterUsage}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Sustainability Highlights</h3>
        <ul className="space-y-2">
          {analysis.strengths.slice(0, 2).map((s, i) => (
            <li key={`s-${i}`} className="flex items-start gap-2 text-sm text-eco-700 dark:text-eco-300">
              <CheckCircle2 className="w-4 h-4 text-eco-500 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
          {analysis.concerns.slice(0, 2).map((c, i) => (
            <li key={`c-${i}`} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={() => onNavigate('analysis')}
        aria-label="View Detailed Analysis"
        className="w-full bg-slate-900 dark:bg-eco-600 text-white font-medium p-3.5 rounded-xl shadow-md hover:bg-slate-800 dark:hover:bg-eco-700 transition-all flex items-center justify-center gap-2 group"
      >
        View Detailed Analysis
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
      </button>
    </div>
  );
}
