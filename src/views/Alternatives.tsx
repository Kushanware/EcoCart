
import { ProductCard } from '../components/ui/ProductCard';
import { Sparkles } from 'lucide-react';

export default function Alternatives() {
  const alternatives = [
    { title: 'Allbirds Tree Runners', brand: 'Allbirds', score: 92, price: '$98.00' },
    { title: 'Veja Campo Sneakers', brand: 'Veja', score: 88, price: '$135.00' },
    { title: 'Cariuma Oca Low', brand: 'Cariuma', score: 85, price: '$79.00' },
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10">
      <div className="bg-gradient-to-r from-eco-600 to-eco-500 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white opacity-10" />
        <h2 className="text-xl font-bold mb-1">Better Alternatives 🌱</h2>
        <p className="text-eco-50 text-sm">
          We found products with lower carbon footprints that match your style.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {alternatives.map((alt, i) => (
          <ProductCard key={i} {...alt} />
        ))}
      </div>
    </div>
  );
}
