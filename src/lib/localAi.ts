// src/lib/localAi.ts

export interface AISuggestion {
  explanation: string;
  alternatives: string[];
}

export class LocalAIEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static session: any = null;

  /**
   * Checks if the user's browser version and hardware support Gemini Nano.
   */
  static async checkAvailability(): Promise<'ready' | 'downloading' | 'unsupported'> {
    if (!('LanguageModel' in window)) {
      // Also try window.ai.languageModel for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!((window as any).ai && (window as any).ai.languageModel)) {
        return 'unsupported';
      }
    }
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lm = (window as any).LanguageModel || (window as any).ai.languageModel;
      const availability = await lm.availability();
      if (availability === 'readily' || availability === 'available') return 'ready';
      if (availability === 'after-download' || availability === 'downloadable') return 'downloading';
      return 'unsupported';
    } catch {
      return 'unsupported';
    }
  }

  /**
   * Initializes the on-device AI session with strict guidelines
   */
  private static async getSession() {
    if (this.session) return this.session;

    const status = await this.checkAvailability();
    if (status !== 'ready') throw new Error("Local AI model is not ready or unsupported.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lm = (window as any).LanguageModel || (window as any).ai.languageModel;

    this.session = await lm.create({
      systemPrompt: `You are an eco-friendly shopping assistant. You analyze products and explain their environmental impact. 
      You strictly output valid JSON structures matching the exact keys provided. No conversational filler, no backticks, no markdown formatting.`,
      expectedLanguage: "en"
    });

    return this.session;
  }

  /**
   * Replaces the old Gemini Cloud API call. Takes the output of your 
   * deterministic rules engine and gives natural language depth.
   */
  static async generateEcoInsights(title: string, score: number, materials: string[]): Promise<AISuggestion> {
    try {
      const model = await this.getSession();
      
      const prompt = `
        Product: "${title}"
        Calculated EcoScore: ${score}/100
        Detected Materials: ${JSON.stringify(materials)}

        Analyze this item. Output exactly this JSON structure, completely raw without backticks or markdown wraps:
        {
          "explanation": "A one-sentence summary explaining why this score was given based on its materials.",
          "alternatives": ["Greener alternative item 1", "Greener alternative item 2"]
        }
      `;

      const rawResult = await model.prompt(prompt);
      
      // Sanitization Layer: Cleans up accidental backticks or markdown text configurations
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      const cleanedString = jsonMatch ? jsonMatch[0] : rawResult;

      return JSON.parse(cleanedString.trim());
    } catch (error) {
      console.error("Local AI Inference crash, falling back to static generation:", error);
      return {
        explanation: `This item has an EcoScore of ${score}/100 based primarily on its ${materials.join(', ')} components.`,
        alternatives: ["Look for organic or recycled variants of this item."]
      };
    }
  }
}
