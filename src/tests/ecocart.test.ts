import { describe, expect, it } from 'vitest';
import {
  detectMaterialFromSources,
  detectProductCategoryFromText,
  getAlternativesForProduct,
  getScoreInsights,
} from '../lib/ecocart';

describe('EcoCart helpers', () => {
  it('routes anklets to jewelry alternatives', () => {
    const alternatives = getAlternativesForProduct({
      title: 'Sterling Silver Anklet',
      description: 'Handcrafted jewelry for women',
    });

    expect(detectProductCategoryFromText('Sterling Silver Anklet')).toBe('jewelry');
    expect(alternatives.map((alt) => alt.name)).toContain('Brilliant Earth');
    expect(alternatives.map((alt) => alt.name)).not.toContain('Patagonia');
  });

  it('detects common materials from product text', () => {
    expect(detectMaterialFromSources('925 sterling silver anklet')).toBe('sterling silver');
    expect(detectMaterialFromSources('gold plated ring')).toBe('gold');
    expect(detectMaterialFromSources('polyester shirt')).toBe('polyester');
  });

  it('builds readable score insights', () => {
    const insights = getScoreInsights(
      {
        title: 'Reusable Bamboo Bottle',
        description: 'Reusable and durable bottle with recyclable packaging',
        material: 'Bamboo',
        brand: 'Patagonia',
      },
      { materials: 40, durability: 20, packaging: 10, locality: 10, brandBonus: 10 }
    );

    expect(insights.some((insight) => insight.label === 'Material')).toBe(true);
    expect(insights.some((insight) => insight.label === 'Reusable')).toBe(true);
    expect(insights.some((insight) => insight.note.toLowerCase().includes('reusable'))).toBe(true);
  });
});
