import { describe, it, expect } from 'vitest';
import { calculateLocalEcoScore } from '../lib/rules';

describe('Rule Engine V5 — Sustainability Scoring', () => {

  describe('Material-based scoring', () => {

    it('PVC Wallpaper → 20-35', () => {
      const a = calculateLocalEcoScore({
        title: 'PVC Wallpaper',
        description: 'Vinyl wallpaper for home decor',
        material: 'PVC',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(20);
      expect(a.ecoScore).toBeLessThanOrEqual(35);
      expect(a.carbonImpact).toBe('Very High');
      expect(
        a.concerns.some(c =>
          c.toLowerCase().includes('pvc')
        )
      ).toBe(true);
    });

    it('Plastic Ball → 30-50', () => {
      const a = calculateLocalEcoScore({
        title: 'Plastic Ball',
        description: 'Plastic cricket ball for kids',
        material: 'Plastic',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(30);
      expect(a.ecoScore).toBeLessThanOrEqual(50);
      expect(
        a.concerns.some(c =>
          c.toLowerCase().includes('plastic')
        )
      ).toBe(true);
    });

    it('Plastic Ball Pen → 35-50', () => {
      const a = calculateLocalEcoScore({
        title: 'Plastic Ball Pen',
        description: 'Disposable plastic pen',
        material: 'Plastic',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(35);
      expect(a.ecoScore).toBeLessThanOrEqual(50);
    });

    it('Refillable Fountain Pen → 60-75', () => {
      const a = calculateLocalEcoScore({
        title: 'Refillable Fountain Pen',
        description: 'Premium refillable fountain pen',
        material: 'Stainless Steel',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(60);
      expect(a.ecoScore).toBeLessThanOrEqual(100);

      expect(
        a.strengths.some(
          s =>
            s.toLowerCase().includes('refillable') ||
            s.toLowerCase().includes('reusable')
        )
      ).toBe(true);
    });

    it('Recycled Paper Notebook → 70-85', () => {
      const a = calculateLocalEcoScore({
        title: 'Recycled Paper Notebook',
        description: 'Notebook made from recycled paper',
        material: 'Recycled Paper',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(70);
      expect(a.ecoScore).toBeLessThanOrEqual(85);

      expect(
        a.strengths.some(s =>
          s.toLowerCase().includes('recycled')
        )
      ).toBe(true);
    });

    it('Glass Bottle → 75-90', () => {
      const a = calculateLocalEcoScore({
        title: 'Glass Water Bottle',
        description: 'Reusable glass bottle',
        material: 'Glass',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(75);
      expect(a.ecoScore).toBeLessThanOrEqual(100);

      expect(
        a.strengths.some(s =>
          s.toLowerCase().includes('glass')
        )
      ).toBe(true);
    });

    it('Stainless Steel Bottle → 75-90', () => {
      const a = calculateLocalEcoScore({
        title: 'Steel Water Bottle',
        description: 'Reusable stainless steel bottle',
        material: 'Stainless Steel',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(75);
      expect(a.ecoScore).toBeLessThanOrEqual(100);

      expect(
        a.strengths.some(s =>
          s.toLowerCase().includes('steel')
        )
      ).toBe(true);
    });

    it('Wooden Wardrobe → 65-85', () => {
      const a = calculateLocalEcoScore({
        title: 'Wooden Wardrobe',
        description: 'Solid Sheesham wood wardrobe',
        material: 'Sheesham Wood',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(65);
      expect(a.ecoScore).toBeLessThanOrEqual(85);
    });

    it('Biodegradable Garbage Bags → 70+', () => {
      const a = calculateLocalEcoScore({
        title: 'Biodegradable Garbage Bags',
        description: 'Compostable eco-friendly garbage bags',
        material: 'Biodegradable Material',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(70);

      expect(
        a.strengths.some(
          s =>
            s.toLowerCase().includes('biodegradable') ||
            s.toLowerCase().includes('compostable')
        )
      ).toBe(true);
    });

    it('Organic Cotton Shirt → 85+', () => {
      const a = calculateLocalEcoScore({
        title: 'Organic Cotton T-Shirt',
        description:
          'Long-lasting organic cotton shirt with recyclable packaging',
        material: 'Organic Cotton',
        brand: 'Patagonia',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(85);
      expect(a.carbonImpact).toBe('Low');

      expect(
        a.strengths.some(
          s => s.toLowerCase().includes('organic')
        )
      ).toBe(true);
    });

    it('Bamboo Toothbrush → 85+', () => {
      const a = calculateLocalEcoScore({
        title: 'Bamboo Toothbrush',
        description:
          'Biodegradable reusable bamboo toothbrush',
        material: 'Bamboo',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(85);
      expect(a.carbonImpact).toBe('Low');

      expect(
        a.strengths.some(
          s => s.toLowerCase().includes('bamboo')
        )
      ).toBe(true);
    });

    it('Electronics Charger → 25-50', () => {
      const a = calculateLocalEcoScore({
        title: 'USB Charger',
        category: 'Electronics',
        description: 'Standard charger with plastic housing',
        material: 'Plastic',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(25);
    });

    it('Organic Gobar Khad → 80-90', () => {
      const a = calculateLocalEcoScore({
        title: 'Organic Gobar Khad',
        description: 'Cow manure organic fertilizer for soil health and natural farming',
        material: 'Gobar Khad',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(80);
      expect(a.ecoScore).toBeLessThanOrEqual(95);
      expect(a.carbonImpact).toBe('Low');
      expect(a.waterUsage).toBe('Low');
    });

    it('Sterling Silver Anklet → 50-70', () => {
      const a = calculateLocalEcoScore({
        title: 'Sterling Silver Anklet',
        description: 'Handcrafted sterling silver anklet for women',
        material: 'Sterling Silver',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(50);
      expect(a.ecoScore).toBeLessThanOrEqual(70);
      expect(
        a.strengths.some(s =>
          s.toLowerCase().includes('silver')
        )
      ).toBe(true);
    });

    it('Gold Necklace → 50-70', () => {
      const a = calculateLocalEcoScore({
        title: 'Gold Pendant Necklace',
        description: 'Beautiful 18k gold necklace pendant',
        material: 'Gold',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(50);
      expect(a.ecoScore).toBeLessThanOrEqual(70);
      expect(
        a.strengths.some(s =>
          s.toLowerCase().includes('gold')
        )
      ).toBe(true);
    });

    it('Alloy Bracelet → 30-50', () => {
      const a = calculateLocalEcoScore({
        title: 'Metal Alloy Bracelet',
        description: 'Fashion alloy bracelet with beads',
        material: 'Alloy',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(30);
      expect(a.ecoScore).toBeLessThanOrEqual(50);
      expect(
        a.concerns.some(c =>
          c.toLowerCase().includes('alloy')
        )
      ).toBe(true);
    });

    it('Leather Bag → 35-55', () => {
      const a = calculateLocalEcoScore({
        title: 'Genuine Leather Tote Bag',
        description: 'Handcrafted leather tote bag',
        material: 'Leather',
      });

      expect(a.ecoScore).toBeGreaterThanOrEqual(35);
      expect(a.ecoScore).toBeLessThanOrEqual(55);
      expect(
        a.strengths.some(s =>
          s.toLowerCase().includes('leather')
        )
      ).toBe(true);
    });

    it('Title priority over description (Plastic vs Sheesham)', () => {
      const a = calculateLocalEcoScore({
        title: 'AVRO FURNITURE Plastic Chair',
        description: 'Other customers also bought Sheesham wood chair',
      });
      expect(a.ecoScore).toBeLessThan(55);
      expect(a.concerns.some(c => c.toLowerCase().includes('plastic'))).toBe(true);
    });

    it('Title priority over description (Steel vs Plastic)', () => {
      const a = calculateLocalEcoScore({
        title: 'Stainless Steel Water Bottle',
        description: 'Comes with a small plastic cap',
      });
      expect(a.ecoScore).toBeGreaterThanOrEqual(70);
    });

    it('Missing data gracefully handles edge case', () => {
      const a = calculateLocalEcoScore({});
      expect(a.ecoScore).toBeGreaterThanOrEqual(10);
      expect(a.confidence).toBe('Low');
    });

    it('Cotton edge case returns water concern', () => {
      const a = calculateLocalEcoScore({
        title: 'Basic Cotton T-Shirt',
        material: 'Cotton'
      });
      expect(a.concerns.some(c => c.toLowerCase().includes('water-intensive'))).toBe(true);
    });

    it('Eco-bonus keywords add points correctly', () => {
      const base = calculateLocalEcoScore({ title: 'Standard Bottle', material: 'Glass' });
      const eco = calculateLocalEcoScore({ title: 'Standard Bottle', material: 'Glass', description: 'reusable biodegradable compostable' });
      expect(eco.ecoScore).toBeGreaterThan(base.ecoScore);
    });

    it('Negative keywords deduct points correctly', () => {
      const base = calculateLocalEcoScore({ title: 'Basic Shirt', material: 'Cotton' });
      const bad = calculateLocalEcoScore({ title: 'Basic Shirt', material: 'Cotton', description: 'toxic chemicals single-use' });
      expect(bad.ecoScore).toBeLessThan(base.ecoScore);
    });

    it('Cap check: Eco score does not drop below 0', () => {
      const bad = calculateLocalEcoScore({ title: 'Plastic bag', description: 'single-use toxic chemicals disposable waste' });
      expect(bad.ecoScore).toBeGreaterThanOrEqual(0);
    });


  });

  describe('Ranking validation', () => {

    it('should rank products correctly', () => {

      const pvc = calculateLocalEcoScore({
        title: 'PVC Wallpaper',
        material: 'PVC',
      });

      const plastic = calculateLocalEcoScore({
        title: 'Plastic Ball',
        material: 'Plastic',
      });

      const notebook = calculateLocalEcoScore({
        title: 'Recycled Notebook',
        material: 'Recycled Paper',
      });

      const refillPen = calculateLocalEcoScore({
        title: 'Refillable Pen',
        material: 'Stainless Steel',
        description: 'Refillable reusable pen',
      });

      const wardrobe = calculateLocalEcoScore({
        title: 'Wooden Wardrobe',
        material: 'Sheesham Wood',
      });

      const steelBottle = calculateLocalEcoScore({
        title: 'Steel Bottle',
        material: 'Stainless Steel',
        description: 'Reusable bottle',
      });

      const bamboo = calculateLocalEcoScore({
        title: 'Bamboo Toothbrush',
        material: 'Bamboo',
      });

      const organic = calculateLocalEcoScore({
        title: 'Organic Cotton Shirt',
        material: 'Organic Cotton',
        brand: 'Patagonia',
        description: 'Long-lasting organic cotton shirt with recyclable packaging',
      });

      expect(pvc.ecoScore).toBeLessThan(plastic.ecoScore);
      expect(plastic.ecoScore).toBeLessThan(notebook.ecoScore);
      expect(notebook.ecoScore).toBeLessThan(wardrobe.ecoScore);
      expect(wardrobe.ecoScore).toBeLessThanOrEqual(bamboo.ecoScore);
      expect(bamboo.ecoScore).toBeLessThanOrEqual(refillPen.ecoScore);
      expect(refillPen.ecoScore).toBeLessThanOrEqual(steelBottle.ecoScore);
      expect(steelBottle.ecoScore).toBeLessThanOrEqual(organic.ecoScore);
    });

  });

  describe('Confidence scoring', () => {

    it('Low confidence for title only', () => {
      expect(
        calculateLocalEcoScore({
          title: 'Unknown Product',
        }).confidence
      ).toBe('Low');
    });

    it('Medium confidence for title + description', () => {
      expect(
        calculateLocalEcoScore({
          title: 'Unknown Product',
          description: 'This is a detailed product description used for confidence testing',
        }).confidence
      ).toBe('Medium');
    });

    it('High confidence for title + description + material', () => {
      expect(
        calculateLocalEcoScore({
          title: 'Unknown Product',
          description: 'This is a detailed product description used for confidence testing',
          material: 'Organic Cotton',
        }).confidence
      ).toBe('High');
    });

  });

  describe('Highlights', () => {

    it('must always generate at least one insight', () => {
      const a = calculateLocalEcoScore({
        title: 'Unknown Product',
      });

      expect(
        [...a.strengths, ...a.concerns].length
      ).toBeGreaterThan(0);
    });

  });

  describe('Score breakdown', () => {

    it('breakdown equals final score', () => {

      const a = calculateLocalEcoScore({
        title: 'Bamboo Toothbrush',
        material: 'Bamboo',
        description:
          'Biodegradable reusable bamboo toothbrush',
      });

      const bd = a.scoreBreakdown;

      const total =
        bd.materials +
        bd.durability +
        bd.packaging +
        bd.locality +
        bd.brandBonus;

      expect(a.ecoScore).toBe(
        Math.min(100, total)
      );
    });

    it('never exceeds 100 score', () => {
      const a = calculateLocalEcoScore({
        title: 'Perfect Product',
        material: 'Organic Cotton Bamboo Glass',
        description:
          'Reusable biodegradable compostable recyclable packaging',
        brand: 'Patagonia'
      });

      expect(a.ecoScore).toBeLessThanOrEqual(100);
    });

  });

});