import type { ProductData } from '../content';
import type { EcoAnalysis } from './gemini';

// ─── Centralized Material Dictionary ───
// Each entry: [keyword, absoluteScore, strengthLabel]
// Sorted longest-first so "organic cotton" matches before "cotton"
// Scores are ABSOLUTE material values (0-55), not adjustments
const POSITIVE_MATERIALS: [string, number, string][] = [
  ['organic fertilizer', 50, '✓ Organic fertilizer supports sustainable agriculture'],
  ['organic cotton', 50, '✓ Organic cotton grown without toxic pesticides'],
  ['stainless steel', 45, '✓ Stainless steel is durable and highly recyclable'],
  ['recycled paper', 40, '✓ Recycled paper reduces deforestation'],
  ['recycled plastic', 20, '✓ Recycled plastic diverts waste from landfills'],
  ['fsc certified', 45, '✓ FSC certified for responsible forestry'],
  ['recycled', 35, '✓ Contains recycled materials'],
  ['upcycled', 25, '✓ Uses upcycled materials to reduce waste'],
  ['vermicompost', 55, '✓ Vermicompost improves soil fertility naturally'],
  ['bamboo', 50, '✓ Bamboo is rapidly renewable and biodegradable'],
  ['gobar khad', 50, '✓ Traditional organic fertilizer improves soil health'],
  ['cow manure', 45, '✓ Cow manure is a natural organic fertilizer'],
  ['hemp', 35, '✓ Hemp requires minimal water and no pesticides'],
  ['linen', 35, '✓ Linen is made from renewable flax plants'],
  ['jute', 35, '✓ Jute is a sustainable, biodegradable natural fiber'],
  ['biodegradable', 40, '✓ Biodegradable materials break down naturally'],
  ['compostable', 40, '✓ Compostable materials return to earth safely'],
  ['compost', 50, '✓ Compost recycles nutrients back into soil'],
  ['manure', 40, '✓ Natural manure reduces synthetic fertilizer use'],
  ['organic', 20, '✓ Organic materials reduce chemical pollution'],
  ['glass', 50, '✓ Glass is infinitely recyclable'],
  ['sheesham', 45, '✓ Sheesham is a durable, long-lasting hardwood'],
  ['teak', 45, '✓ Teak wood is extremely durable and sustainable'],
  ['aluminium', 30, '✓ Aluminium is lightweight and widely recyclable'],
  ['aluminum', 30, '✓ Aluminum is lightweight and widely recyclable'],
  ['solid wood', 50, '✓ Solid wood furniture is durable and long-lasting'],
  ['wood', 40, '✓ Wood is a renewable natural material'],
  ['steel', 40, '✓ Steel is highly durable and recyclable'],
  ['ceramic', 30, '✓ Ceramic is a natural, long-lasting material'],
  ['gobar', 45, '✓ Gobar manure improves soil naturally'],
  ['cotton', 10, ''],
];

const NEGATIVE_MATERIALS: [string, number, string][] = [
  ['pvc', 0, '⚠ PVC is toxic to manufacture and difficult to recycle'],
  ['vinyl', 0, '⚠ Vinyl is a non-recyclable synthetic material'],
  ['polyester', 5, '⚠ Polyester is a petroleum-based synthetic'],
  ['nylon', 5, '⚠ Nylon is petroleum-based and slow to decompose'],
  ['polypropylene', 5, '⚠ Polypropylene is a petroleum-based plastic'],
  ['acrylic', 5, '⚠ Acrylic is a non-biodegradable synthetic'],
  ['microfiber', 5, '⚠ Microfiber sheds microplastics when washed'],
  ['spandex', 5, '⚠ Spandex is a petroleum-based synthetic'],
  ['elastane', 5, '⚠ Elastane is a petroleum-based synthetic'],
  ['plastic', 10, '⚠ Plastic components detected'],
];

// Eco modifiers: bonus points added ON TOP of material score
// Cap total materials at 60
const ECO_BONUS_KEYWORDS: [string, number][] = [
  ['refillable', 10],
  ['reusable', 10],
  ['eco-friendly', 10],
  ['eco friendly', 10],
  ['biodegradable', 5],
  ['compostable', 5],
  ['sustainable', 5],
  ['natural fiber', 5],
  ['fsc certified', 5],
  ['natural fertilizer', 10],
  ['chemical free', 10],
  ['eco farming', 10],
  ['organic farming', 10],
  ['soil health', 5],
];

const SUSTAINABLE_BRANDS = [
  'patagonia', 'allbirds', 'tentree', 'pact', 'coyuchi',
  'eileen fisher', 'outerknown', 'veja', 'toms', 'seventh generation',
  'method', 'cariuma', 'pangaia', 'girlfriend collective', 'thought', 'people tree',
];

type ProductCategory = 'fashion' | 'electronics' | 'stationery' | 'home_decor' | 'kitchen' | 'gardening' | 'cleaning' | 'personal_care' | 'general';

function detectCategory(text: string): ProductCategory {
  if (text.includes('shirt') || text.includes('clothing') || text.includes('fashion') || text.includes('apparel') || text.includes('dress') || text.includes('jacket') || text.includes('shoe') || text.includes('sneaker') || text.includes('jeans') || text.includes('sweater') || text.includes('hoodie'))
    return 'fashion';
  if (text.includes('electronic') || text.includes('phone') || text.includes('charger') || text.includes('cable') || text.includes('computer') || text.includes('laptop') || text.includes('appliance') || text.includes('headphone') || text.includes('speaker'))
    return 'electronics';
  if (text.includes('pen') || text.includes('notebook') || text.includes('stationery') || text.includes('pencil') || text.includes('diary') || text.includes('journal') || text.includes('paper') || text.includes('office supplies'))
    return 'stationery';
  if (text.includes('wallpaper') || text.includes('curtain') || text.includes('rug') || text.includes('carpet') || text.includes('decor') || text.includes('candle') || text.includes('furniture') || text.includes('lamp') || text.includes('wardrobe'))
    return 'home_decor';
  if (text.includes('bottle') || text.includes('kitchen') || text.includes('utensil') || text.includes('cookware') || text.includes('mug') || text.includes('cup') || text.includes('container') || text.includes('toothbrush') || text.includes('brush'))
    return 'kitchen';
  if (text.includes('fertilizer') || text.includes('manure') || text.includes('gobar') || text.includes('compost') || text.includes('soil') || text.includes('plant') || text.includes('garden') || text.includes('seed'))
    return 'gardening';
  if (text.includes('cleaner') || text.includes('detergent') || text.includes('soap') || text.includes('wash') || text.includes('mop') || text.includes('broom'))
    return 'cleaning';
  if (text.includes('shampoo') || text.includes('lotion') || text.includes('cream') || text.includes('serum') || text.includes('toothpaste') || text.includes('oil'))
    return 'personal_care';
  return 'general';
}

export function calculateLocalEcoScore(data: Partial<ProductData>): EcoAnalysis {
  const strengths: string[] = [];
  const concerns: string[] = [];

  const textToAnalyze = `${data.title || ''} ${data.description || ''} ${data.material || ''} ${data.category || ''}`.toLowerCase();
  const brand = (data.brand || '').toLowerCase();
  const detectedCategory = detectCategory(textToAnalyze);

  // ─── Confidence ───
  const hasMaterial = !!(data.material && data.material.length > 3);
  const hasDescription = !!(data.description && data.description.length >= 20);
  const hasTitle = !!(data.title && data.title.length > 3);

  let confidence: 'Low' | 'Medium' | 'High';
  if (hasTitle && hasDescription && hasMaterial) {
    confidence = 'High';
  } else if (hasTitle && (hasDescription || hasMaterial)) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // ─── Materials (0-60, dictionary lookup) ───
  let materialsScore = 10; // Unknown baseline
  let primaryMatchKeyword = '';

  // 1. Check positive materials (first match wins)
  for (const [keyword, score, label] of POSITIVE_MATERIALS) {
    if (textToAnalyze.includes(keyword)) {
      materialsScore = score;
      primaryMatchKeyword = keyword;
      if (label) strengths.push(label);
      if (keyword === 'cotton') {
        concerns.push('⚠ Conventional cotton is water-intensive to produce');
      }
      break;
    }
  }

  // 2. If no positive found, check negatives
  if (!primaryMatchKeyword) {
    for (const [keyword, score, label] of NEGATIVE_MATERIALS) {
      if (textToAnalyze.includes(keyword)) {
        materialsScore = score;
        primaryMatchKeyword = keyword;
        if (label) concerns.push(label);
        break;
      }
    }
  }

  // 3. Apply eco bonus keywords (skip if same as primary match), cap materials at 60
  for (const [keyword, bonus] of ECO_BONUS_KEYWORDS) {
    if (textToAnalyze.includes(keyword) && keyword !== primaryMatchKeyword) {
      materialsScore = Math.min(60, materialsScore + bonus);
      if (keyword === 'refillable' || keyword === 'reusable') {
        strengths.push('✓ Refillable or reusable design reduces waste');
      }
    }
  }

  // 4. Single-use / disposable penalty (overrides)
  if (textToAnalyze.includes('single-use') || textToAnalyze.includes('disposable') || textToAnalyze.includes('fast fashion')) {
    materialsScore = 5;
    concerns.push('⚠ Single-use or disposable product contributes to landfill waste');
  }

  // 5. Category fallback when no material detected
  if (!primaryMatchKeyword) {
    if (detectedCategory === 'electronics') {
      materialsScore = Math.min(materialsScore, 10);
      concerns.push('⚠ No sustainability data for electronic components');
    } else {
      concerns.push('⚠ No material sustainability information found');
    }
  }

  // ─── Durability (0-30) ───
  let durabilityScore = 10;
  if (textToAnalyze.includes('refillable') || textToAnalyze.includes('reusable')) {
    durabilityScore = 30;
  } else if (textToAnalyze.includes('durable') || textToAnalyze.includes('long-lasting') || textToAnalyze.includes('lifetime warranty') || textToAnalyze.includes('repairable')) {
    durabilityScore = 20;
    strengths.push('✓ Durable construction extends product lifecycle');
  } else if (textToAnalyze.includes('warranty') || textToAnalyze.includes('guaranteed')) {
    durabilityScore = 15;
    strengths.push('✓ Warranty indicates manufacturer confidence in durability');
  } else if (detectedCategory === 'electronics') {
    durabilityScore = 5;
    concerns.push('⚠ No warranty or repairability information found');
  }



  // ─── Packaging (0-20) ───
  let packagingScore = 10;
  if (textToAnalyze.includes('plastic-free packaging') || textToAnalyze.includes('recyclable packaging') || textToAnalyze.includes('minimal packaging') || textToAnalyze.includes('eco packaging')) {
    packagingScore = 20;
    strengths.push('✓ Eco-friendly or minimal packaging');
  } else if (textToAnalyze.includes('excessive plastic') || textToAnalyze.includes('bubble wrap') || textToAnalyze.includes('polystyrene')) {
    packagingScore = 0;
    concerns.push('⚠ Uses excessive or non-recyclable packaging');
  }

  // ─── Locality (0-20) ───
  let localityScore = 10;
  if (textToAnalyze.includes('imported') || textToAnalyze.includes('international shipping') || textToAnalyze.includes('made in china') || textToAnalyze.includes('made in bangladesh')) {
    localityScore = 5;
    concerns.push('⚠ Imported product has higher shipping carbon footprint');
  } else if (textToAnalyze.includes('locally sourced') || textToAnalyze.includes('made domestically') || textToAnalyze.includes('made in india') || textToAnalyze.includes('handmade') || textToAnalyze.includes('locally made')) {
    localityScore = 20;
    strengths.push('✓ Locally sourced or manufactured');
  }

  // ─── Brand Bonus (0-10) ───
  let brandBonus = 0;
  if (SUSTAINABLE_BRANDS.some(b => brand.includes(b))) {
    brandBonus = 10;
    strengths.push('✓ Brand recognized for sustainable practices');
  }

  // ─── Guarantee non-empty highlights ───
  if (strengths.length === 0 && concerns.length === 0) {
    concerns.push('⚠ No sustainability certifications detected');
    concerns.push('⚠ Limited product data available for assessment');
  }

  // ─── Calculate Totals ───
  const totalScore = materialsScore + durabilityScore + packagingScore + localityScore + brandBonus;
  const clampedScore = Math.max(0, Math.min(100, totalScore));

  // 4-tier carbon impact
  let carbonImpact: string;
  let waterUsage: string;
  if (textToAnalyze.includes('compost') || textToAnalyze.includes('gobar') || textToAnalyze.includes('cow manure') || textToAnalyze.includes('organic fertilizer')) {
    carbonImpact = 'Low';
    waterUsage = 'Low';
  } else if (clampedScore > 80) {
    carbonImpact = 'Low';
    waterUsage = 'Low';
  } else if (clampedScore > 60) {
    carbonImpact = 'Medium';
    waterUsage = 'Medium';
  } else if (clampedScore > 40) {
    carbonImpact = 'High';
    waterUsage = 'High';
  } else {
    carbonImpact = 'Very High';
    waterUsage = 'Very High';
  }

  let recommendations: string;
  if (clampedScore >= 80) {
    recommendations = 'Great choice! This is a highly sustainable option.';
  } else if (clampedScore >= 60) {
    recommendations = 'Good option. Check if local or organic alternatives exist to improve further.';
  } else if (clampedScore >= 40) {
    recommendations = 'Consider alternatives made with organic, recycled, or natural materials.';
  } else {
    recommendations = 'This product has significant sustainability concerns. Look for eco-certified alternatives.';
  }

  return {
    ecoScore: clampedScore,
    carbonImpact,
    waterUsage,
    confidence,
    strengths,
    concerns,
    recommendations,
    scoreBreakdown: {
      materials: materialsScore,
      durability: durabilityScore,
      packaging: packagingScore,
      locality: localityScore,
      brandBonus,
    }
  };
}
