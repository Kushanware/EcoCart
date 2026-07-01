import { useState, useRef } from 'react';
import type { ProductData } from '../content';

declare global {
  interface Window {
    LanguageModel: {
      create: (options: { systemPrompt: string; expectedLanguage: string }) => Promise<unknown>;
    };
  }
}

export default function EcoCartRecommendations({ productData }: { productData: Partial<ProductData> | null }) {
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);

  const generateEcoTip = async () => {
    if (!productData) return;
    setLoading(true);
    setRecommendation("");

    try {
      // 1. Initialize the session only once
      if (!sessionRef.current) {
        if (typeof window.LanguageModel === 'undefined') {
          // Adding a fallback to standard window.ai.languageModel just in case
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof (window as any).ai !== 'undefined' && (window as any).ai.languageModel) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessionRef.current = await (window as any).ai.languageModel.create({
              systemPrompt: "You are an eco-friendly shopping assistant. Give a one-sentence sustainability tip based on the user's current item."
            });
          } else {
            setRecommendation("Your browser does not support the built-in AI feature yet. Try enabling it in chrome://flags.");
            setLoading(false);
            return;
          }
        } else {
          sessionRef.current = await window.LanguageModel.create({
            systemPrompt: "You are an eco-friendly shopping assistant. Give a one-sentence sustainability tip based on the user's current item.",
            expectedLanguage: "en"
          });
        }
      }

      // 2. Format the product data for the prompt
      const itemName = productData.title || "this item";
      const prompt = `The user is looking at: ${itemName}. Give a short, encouraging eco-tip.`;

      // 3. Stream the output for a fast UI
      const stream = await sessionRef.current.promptStreaming(prompt) as AsyncIterable<string>;
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText = typeof chunk === 'string' ? chunk : fullText; // sometimes chunk is the full string so far
        setRecommendation(chunk);
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      setRecommendation("Consider reusable alternatives for your everyday items!");
    } finally {
      setLoading(false);
    }
  };

  if (!productData) return null;

  return (
    <div className="p-4 bg-eco-50 dark:bg-eco-900/30 rounded-xl border border-eco-200 dark:border-eco-800 mt-4 text-left">
      <h3 className="font-bold text-eco-800 dark:text-eco-300 text-sm flex items-center gap-2">
        <span>🌱</span> Smart Eco-Tips
      </h3>
      
      <button 
        onClick={generateEcoTip}
        disabled={loading}
        className="mt-3 bg-eco-600 hover:bg-eco-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Analyzing Item..." : "Get a Sustainability Tip"}
      </button>

      {recommendation && (
        <p className="mt-3 text-slate-700 dark:text-slate-300 text-sm italic border-l-2 border-eco-400 pl-3 py-1">"{recommendation}"</p>
      )}
    </div>
  );
}
