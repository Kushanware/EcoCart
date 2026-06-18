export type ProductCategory =
  | 'fashion'
  | 'jewelry'
  | 'electronics'
  | 'stationery'
  | 'home_decor'
  | 'kitchen'
  | 'gardening'
  | 'cleaning'
  | 'personal_care'
  | 'furniture'
  | 'general';

export interface ProductLike {
  title?: string;
  description?: string;
  material?: string;
  category?: string;
  brand?: string;
}

export interface AlternativeSuggestion {
  name: string;
  score: number;
  reason: string;
}

export interface ScoreInsight {
  label: string;
  value: number;
  max: number;
  note: string;
}

const MATERIAL_KEYWORDS = [
  'sterling silver',
  'silver plated',
  'stainless steel',
  'recycled paper',
  'recycled plastic',
  'organic cotton',
  'genuine leather',
  'faux leather',
  'full grain leather',
  'silver',
  'gold',
  'platinum',
  'aluminium',
  'aluminum',
  'brass',
  'copper',
  'glass',
  'bamboo',
  'wood',
  'sheesham',
  'teak',
  'steel',
  'alloy',
  'polyester',
  'nylon',
  'leather',
  'rubber',
  'plastic',
  'vinyl',
  'pvc',
  'jute',
  'hemp',
  'linen',
  'silk',
  'ceramic',
  'cotton',
  'recycled',
].sort((a, b) => b.length - a.length);

const CATEGORY_ALTERNATIVES: Record<ProductCategory, AlternativeSuggestion[]> = {
  jewelry: [
    { name: 'Brilliant Earth', score: 92, reason: 'Conflict-free & lab-grown gems' },
    { name: 'Mejuri', score: 88, reason: 'Recycled gold & ethical sourcing' },
    { name: 'Soko', score: 90, reason: 'Fair-trade artisan jewelry' },
    { name: 'Catbird', score: 85, reason: 'Recycled metals & ethical gems' },
    { name: 'Aurate', score: 86, reason: 'Sustainably sourced gold' },
  ],
  fashion: [
    { name: 'Patagonia', score: 92, reason: 'Recycled materials & fair trade' },
    { name: 'Tentree', score: 88, reason: 'Plants 10 trees per purchase' },
    { name: 'Pact', score: 85, reason: 'Organic cotton & fair trade' },
    { name: 'Allbirds', score: 87, reason: 'Natural materials & carbon neutral' },
    { name: 'Pangaia', score: 84, reason: 'Bio-based & recycled fabrics' },
  ],
  electronics: [
    { name: 'Fairphone', score: 90, reason: 'Modular design & fair materials' },
    { name: 'Framework Laptop', score: 85, reason: 'User-repairable & upgradeable' },
    { name: 'Teracube', score: 78, reason: '4-year warranty & repairable' },
  ],
  stationery: [
    { name: 'Karst Stone Paper', score: 88, reason: 'Tree-free waterproof paper' },
    { name: 'Onyx + Green', score: 85, reason: 'Recycled & plant-based materials' },
    { name: 'Decomposition Book', score: 82, reason: '100% recycled paper' },
  ],
  kitchen: [
    { name: 'Klean Kanteen', score: 90, reason: 'Stainless steel & B Corp certified' },
    { name: 'Stasher', score: 88, reason: 'Reusable silicone replaces plastic' },
    { name: 'Hydro Flask', score: 85, reason: 'Durable & eliminates single-use' },
  ],
  gardening: [
    { name: 'Organic Compost Co.', score: 90, reason: '100% organic & chemical-free' },
    { name: 'Earthworm Technologies', score: 88, reason: 'Vermicompost for soil health' },
    { name: 'Coco Coir Peat', score: 85, reason: 'Sustainable coconut byproduct' },
  ],
  cleaning: [
    { name: 'Seventh Generation', score: 88, reason: 'Plant-based & biodegradable' },
    { name: 'Ecover', score: 86, reason: 'Recycled packaging & plant-based' },
    { name: 'Method', score: 85, reason: 'Recycled bottles & clean formulas' },
  ],
  personal_care: [
    { name: 'Ethique', score: 92, reason: 'Plastic-free solid bars' },
    { name: "Dr. Bronner's", score: 90, reason: 'Organic & fair trade certified' },
    { name: 'Bite Toothpaste Bits', score: 88, reason: 'Zero-waste tablets' },
  ],
  home_decor: [
    { name: 'Avocado Green Mattress', score: 90, reason: 'Organic latex & wool' },
    { name: 'Coyuchi', score: 88, reason: 'Organic cotton textiles' },
    { name: 'Viva Terra', score: 85, reason: 'Reclaimed & natural materials' },
  ],
  furniture: [
    { name: 'Medley', score: 88, reason: 'FSC-certified & non-toxic' },
    { name: 'Sabai', score: 86, reason: 'Recycled & upcycled materials' },
    { name: 'Inside Weather', score: 84, reason: 'Made-to-order, zero waste' },
  ],
  general: [
    { name: 'Patagonia', score: 90, reason: 'Industry leader in sustainability' },
    { name: 'Seventh Generation', score: 85, reason: 'Plant-based household products' },
    { name: "Dr. Bronner's", score: 88, reason: 'Organic & fair trade certified' },
  ],
};

export function detectProductCategoryFromText(text: string): ProductCategory {
  const value = text.toLowerCase();

  if (value.includes('anklet') || value.includes('bracelet') || value.includes('necklace') || value.includes('ring') || value.includes('earring') || value.includes('pendant') || value.includes('chain') || value.includes('bangle') || value.includes('jewel') || value.includes('jewelry') || value.includes('jewellery') || value.includes('mangalsutra') || value.includes('nose pin') || value.includes('toe ring')) {
    return 'jewelry';
  }
  if (value.includes('shirt') || value.includes('clothing') || value.includes('fashion') || value.includes('apparel') || value.includes('dress') || value.includes('jacket') || value.includes('shoe') || value.includes('sneaker') || value.includes('jeans') || value.includes('sweater') || value.includes('hoodie') || value.includes('t-shirt')) {
    return 'fashion';
  }
  if (value.includes('electronic') || value.includes('phone') || value.includes('charger') || value.includes('cable') || value.includes('computer') || value.includes('laptop') || value.includes('appliance') || value.includes('headphone') || value.includes('speaker') || value.includes('tablet')) {
    return 'electronics';
  }
  if (value.includes('pen') || value.includes('notebook') || value.includes('stationery') || value.includes('pencil') || value.includes('diary') || value.includes('journal') || value.includes('paper') || value.includes('office supplies')) {
    return 'stationery';
  }
  if (value.includes('wallpaper') || value.includes('curtain') || value.includes('rug') || value.includes('carpet') || value.includes('decor') || value.includes('candle') || value.includes('home decor') || value.includes('lamp') || value.includes('wardrobe') || value.includes('mattress')) {
    return 'home_decor';
  }
  if (value.includes('chair') || value.includes('sofa') || value.includes('table') || value.includes('desk') || value.includes('couch') || value.includes('bookshelf') || value.includes('furniture') || value.includes('cabinet') || value.includes('bed frame')) {
    return 'furniture';
  }
  if (value.includes('bottle') || value.includes('kitchen') || value.includes('utensil') || value.includes('cookware') || value.includes('mug') || value.includes('cup') || value.includes('container') || value.includes('toothbrush') || value.includes('brush')) {
    return 'kitchen';
  }
  if (value.includes('fertilizer') || value.includes('manure') || value.includes('gobar') || value.includes('compost') || value.includes('soil') || value.includes('plant') || value.includes('garden') || value.includes('seed')) {
    return 'gardening';
  }
  if (value.includes('cleaner') || value.includes('detergent') || value.includes('soap') || value.includes('wash') || value.includes('mop') || value.includes('broom')) {
    return 'cleaning';
  }
  if (value.includes('shampoo') || value.includes('lotion') || value.includes('cream') || value.includes('serum') || value.includes('toothpaste') || value.includes('oil')) {
    return 'personal_care';
  }

  return 'general';
}

export function detectMaterialFromSources(...sources: Array<string | undefined | null>): string {
  const text = sources.filter(Boolean).join(' ').toLowerCase();
  for (const keyword of MATERIAL_KEYWORDS) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  return '';
}

export function getAlternativesForProduct(product: ProductLike | null | undefined): AlternativeSuggestion[] {
  const text = [product?.title, product?.description, product?.material, product?.category].filter(Boolean).join(' ');
  const category = detectProductCategoryFromText(text);
  return CATEGORY_ALTERNATIVES[category].slice(0, 3);
}

export function getScoreInsights(product: ProductLike | null | undefined, breakdown: { materials: number; durability: number; packaging: number; locality: number; brandBonus: number }): ScoreInsight[] {
  const text = [product?.title, product?.description, product?.material, product?.category].filter(Boolean).join(' ').toLowerCase();
  const brand = (product?.brand || '').toLowerCase();
  const material = detectMaterialFromSources(product?.material, product?.title, product?.description, product?.category);

  return [
    {
      label: 'Material',
      value: breakdown.materials,
      max: 60,
      note: material ? `Detected material: ${material}` : 'No explicit material keyword found',
    },
    {
      label: 'Reusable',
      value: text.includes('refillable') || text.includes('reusable') ? 10 : 0,
      max: 10,
      note: text.includes('refillable') || text.includes('reusable') ? 'Reusable or refillable language detected' : 'No reusable signal found',
    },
    {
      label: 'Durability',
      value: breakdown.durability,
      max: 30,
      note: text.includes('durable') || text.includes('long-lasting') || text.includes('repairable') || text.includes('warranty') ? 'Durability or warranty signal detected' : 'Default durability baseline applied',
    },
    {
      label: 'Packaging',
      value: breakdown.packaging,
      max: 20,
      note: text.includes('plastic-free packaging') || text.includes('recyclable packaging') || text.includes('minimal packaging') || text.includes('eco packaging') ? 'Eco-friendly or minimal packaging mentioned' : 'No packaging claim detected',
    },
    {
      label: 'Locality',
      value: breakdown.locality,
      max: 20,
      note: text.includes('made in india') || text.includes('locally sourced') || text.includes('made domestically') || text.includes('handmade') ? 'Local or handmade signal detected' : 'No locality signal detected',
    },
    {
      label: 'Brand',
      value: breakdown.brandBonus,
      max: 10,
      note: brand.includes('patagonia') || brand.includes('allbirds') || brand.includes('tentree') || brand.includes('pact') || brand.includes('coyuchi') ? 'Brand matched the sustainable brand list' : 'No known sustainable brand match',
    },
  ];
}
