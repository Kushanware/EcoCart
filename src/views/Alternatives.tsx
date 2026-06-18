
import { Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ui/ProductCard';
import type { ProductData } from '../content';
import { getAlternativesForProduct, detectProductCategoryFromText } from '../lib/ecocart';

interface AlternativesProps {
  productData: Partial<ProductData> | null;
}

export default function Alternatives({ productData }: AlternativesProps) {
  const alternatives = getAlternativesForProduct(productData);
  const category = detectProductCategoryFromText(
    [productData?.title, productData?.description, productData?.material, productData?.category]
      .filter(Boolean)
      .join(' ')
  );

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10">
      <div className="bg-gradient-to-r from-eco-600 to-eco-500 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white opacity-10" />
        <h2 className="text-xl font-bold mb-1">Better Alternatives 🌱</h2>
        <p className="text-eco-50 text-sm">
          Showing {category.replace('_', ' ')} alternatives with lower carbon footprints.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {alternatives.map((alt, i) => (
          <ProductCard key={i} title={alt.name} brand={alt.reason} score={alt.score} price="Eco-rated" reason={alt.reason} />
        ))}
      </div>
    </div>
  );
}
