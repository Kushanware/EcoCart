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
  ['sterling silver', 35, '✓ Sterling silver is durable and recyclable'],
  ['silver plated', 20, '✓ Silver plating extends product life'],
  ['recycled paper', 40, '✓ Recycled paper reduces deforestation'],
  ['recycled plastic', 30, '✓ Recycled plastic diverts waste from landfills'],
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
  ['platinum', 35, '✓ Platinum is highly durable and recyclable'],
  ['gold', 35, '✓ Gold can be recycled indefinitely'],
  ['silver', 30, '✓ Silver is recyclable and has lasting value'],
  ['copper', 30, '✓ Copper is naturally antimicrobial and recyclable'],
  ['brass', 25, '✓ Brass is a durable and recyclable alloy'],
  ['sheesham', 45, '✓ Sheesham is a durable, long-lasting hardwood'],
  ['teak', 45, '✓ Teak wood is extremely durable and sustainable'],
  ['aluminium', 30, '✓ Aluminium is lightweight and widely recyclable'],
  ['aluminum', 30, '✓ Aluminum is lightweight and widely recyclable'],
  ['solid wood', 50, '✓ Solid wood furniture is durable and long-lasting'],
  ['oak', 45, '✓ Oak is a durable long-lasting hardwood'],
  ['wood', 40, '✓ Wood is a renewable natural material'],
  ['steel', 40, '✓ Steel is highly durable and recyclable'],
  ['ceramic', 30, '✓ Ceramic is a natural, long-lasting material'],
  ['leather', 20, '✓ Genuine leather is durable and long-lasting'],
  ['silk', 25, '✓ Silk is a natural, biodegradable fiber'],
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
  ['alloy', 15, '⚠ Mixed metal alloy may be difficult to recycle'],
  ['rubber', 15, '⚠ Synthetic rubber is petroleum-based'],
  ['faux leather', 10, '⚠ Faux leather is typically made from plastics'],
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
  'mejuri', 'catbird', 'brilliant earth', 'vrai', 'aurate',
  'soko', 'able', 'nisolo', 'matt & nat', 'stella mccartney',
];

type ProductCategory = 'fashion' | 'jewelry' | 'electronics' | 'stationery' | 'home_decor' | 'kitchen' | 'gardening' | 'cleaning' | 'personal_care' | 'furniture' | 'general';

function detectCategory(text: string): ProductCategory {
  const value = text.toLowerCase();

  if (/\b(anklet|bracelet|necklace|ring|earring|pendant|chain|bangle|jewel|jewelry|jewellery|mangalsutra|nose\spin|toe\sring)\b/.test(value)) return 'jewelry';
  if (/\b(shirt|clothing|fashion|apparel|dress|jacket|shoe|sneaker|jeans|sweater|hoodie|t-shirt)\b/.test(value)) return 'fashion';
  if (/\b(electronic|phone|charger|cable|computer|laptop|appliance|headphone|speaker|tablet)\b/.test(value)) return 'electronics';
  if (/\b(pen|notebook|stationery|pencil|diary|journal|paper|office\ssupplies)\b/.test(value)) return 'stationery';
  if (/\b(wallpaper|curtain|rug|carpet|decor|candle|home\sdecor|lamp|wardrobe|mattress)\b/.test(value)) return 'home_decor';
  if (/\b(chair|sofa|table|desk|couch|bookshelf|furniture|cabinet|bed\sframe)\b/.test(value)) return 'furniture';
  if (/\b(bottle|kitchen|utensil|cookware|mug|cup|container|toothbrush|brush)\b/.test(value)) return 'kitchen';
  if (/\b(fertilizer|manure|gobar|compost|soil|plant|garden|seed)\b/.test(value)) return 'gardening';
  if (/\b(cleaner|detergent|soap|wash|mop|broom)\b/.test(value)) return 'cleaning';
  if (/\b(shampoo|lotion|cream|serum|toothpaste|oil)\b/.test(value)) return 'personal_care';

  return 'general';
}

/**
 * Evaluates a product's environmental footprint strictly based on rule-based heuristics.
 *
 * This deterministically assigns an EcoScore (0-100), carbon impact label, and water
 * usage label by analyzing the product title, explicit material, and description text.
 * It prioritizes exact material matches in the title over ambiguous description matches
 * to prevent false positives from related-product suggestions.
 *
 * @param {Partial<ProductData>} data - The extracted product information, including title, material, and description.
 * @returns {EcoAnalysis} The comprehensive sustainability analysis.
 */
export function calculateLocalEcoScore(data: Partial<ProductData>): EcoAnalysis {
  let strengths: string[] = [];
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

  // Helper to find material in a given text
  const findMaterialMatch = (text: string) => {
    for (const [keyword, score, label] of POSITIVE_MATERIALS) {
      if (text.includes(keyword)) return { keyword, score, label, isPositive: true };
    }
    for (const [keyword, score, label] of NEGATIVE_MATERIALS) {
      if (text.includes(keyword)) return { keyword, score, label, isPositive: false };
    }
    return null;
  };

  // 1. High priority: check Title and explicit Material field first
  const highPriorityText = `${data.title || ''} ${data.material || ''}`.toLowerCase();
  let match = findMaterialMatch(highPriorityText);

  // 2. Fallback to full description if nothing found in title
  if (!match) {
    match = findMaterialMatch(textToAnalyze);
  }

  if (match) {
    primaryMatchKeyword = match.keyword;
    materialsScore = match.score;
    if (match.label) {
      if (match.isPositive) strengths.push(match.label);
      else concerns.push(match.label);
    }
    if (match.keyword === 'cotton') {
      concerns.push('⚠ Conventional cotton is water-intensive to produce');
    }
  }

  console.log("EcoCart AI Extraction Debug:");
  console.log("Product Title:", data.title);
  console.log("Description:", data.description ? data.description.substring(0, 150) + "..." : "None");
  console.log("Detected Material:", primaryMatchKeyword || "None");

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
