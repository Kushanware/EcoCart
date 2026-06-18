
import { ExternalLink } from 'lucide-react';
import { EcoScore } from './EcoScore';

interface ProductCardProps {
  title: string;
  brand: string;
  score: number;
  price: string;
}

export function ProductCard({ title, brand, score, price }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:border-eco-300 transition-colors cursor-pointer group">
      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
         {/* Placeholder for product image */}
         <div className="w-full h-full bg-slate-200 animate-pulse"></div>
      </div>
      
      <div className="flex-1">
        <span className="text-xs text-slate-500 font-medium">{brand}</span>
        <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1">{title}</h3>
        <span className="text-sm font-semibold text-slate-600">{price}</span>
      </div>

      <div className="flex flex-col items-end gap-2">
        <EcoScore score={score} size="sm" />
        <button aria-label={`View details for ${title}`} className="text-xs font-medium text-eco-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
