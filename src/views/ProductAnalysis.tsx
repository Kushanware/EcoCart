import { Leaf, Lightbulb, AlertTriangle, BarChart3 } from 'lucide-react';
import { EcoScore } from '../components/ui/EcoScore';
import type { ProductData } from '../content';
import { getScoreInsights } from '../lib/ecocart';
import type { EcoAnalysis } from '../lib/gemini';

interface AnalysisProps {
  analysis: EcoAnalysis | null;
  productData: Partial<ProductData> | null;
}

function BreakdownBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-12 text-right">{score}/{max}</span>
    </div>
  );
}

export default function ProductAnalysis({ analysis, productData }: AnalysisProps) {
  if (!analysis) return null;

  const bd = analysis.scoreBreakdown;
  const scoreInsights = getScoreInsights(productData, bd);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Estimated Sustainability Score</h2>
          <p className="text-sm text-slate-500">Based on local rule engine analysis</p>
        </div>
        <EcoScore score={analysis.ecoScore} size="md" />
      </div>

      {/* Priority 3: Score Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Score Breakdown</h3>
        </div>
        <div className="flex flex-col gap-3">
          <BreakdownBar label="Materials" score={bd.materials} max={40} color="bg-eco-500" />
          <BreakdownBar label="Durability" score={bd.durability} max={20} color="bg-blue-500" />
          <BreakdownBar label="Packaging" score={bd.packaging} max={20} color="bg-purple-500" />
          <BreakdownBar label="Locality" score={bd.locality} max={20} color="bg-amber-500" />
          {bd.brandBonus > 0 && (
            <BreakdownBar label="Brand" score={bd.brandBonus} max={10} color="bg-teal-500" />
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Final Score</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{analysis.ecoScore}/100</span>
        </div>
      </div>

      <details className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Why this score?</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Tap to expand</span>
        </summary>
        <div className="mt-4 space-y-3">
          {scoreInsights.map((insight) => (
            <div key={insight.label} className="rounded-lg bg-slate-50 dark:bg-slate-800/70 p-3 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{insight.label}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">+{insight.value}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{insight.note}</p>
            </div>
          ))}
        </div>
      </details>

      {analysis.concerns.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800 dark:text-red-400">Main Concerns</h3>
          </div>
          <ul className="space-y-2">
            {analysis.concerns.map((c, i) => (
              <li key={i} className="text-sm text-red-700 dark:text-red-300 flex gap-2">
                <span className="font-bold">•</span> <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.strengths.length > 0 && (
        <div className="bg-eco-50 dark:bg-eco-900/20 rounded-xl p-4 border border-eco-100 dark:border-eco-800/30">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-eco-600" />
            <h3 className="font-semibold text-eco-800 dark:text-eco-400">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="text-sm text-eco-700 dark:text-eco-300 flex gap-2">
                <span className="font-bold">•</span> <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 mt-2 relative overflow-hidden">
        <div className="absolute top-2 right-2 text-slate-200 dark:text-slate-700">
          <Lightbulb className="w-16 h-16 opacity-50" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Recommendation</h3>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {analysis.recommendations}
          </p>
        </div>
      </div>
    </div>
  );
}
