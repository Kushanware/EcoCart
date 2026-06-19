import type { ProductData } from '../content';
import { getApiKey } from './storage';

export interface ScoreBreakdown {
  materials: number;
  durability: number;
  packaging: number;
  locality: number;
  brandBonus: number;
}

export interface EcoAnalysis {
  ecoScore: number;
  carbonImpact: string;
  waterUsage: string;
  confidence: 'Low' | 'Medium' | 'High';
  strengths: string[];
  concerns: string[];
  recommendations: string;
  scoreBreakdown: ScoreBreakdown;
}

export async function analyzeProduct(data: Partial<ProductData>): Promise<EcoAnalysis> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API Key is missing. Please add it in Settings.');
  }

  const prompt = `
Analyze this product's sustainability based on the following data:
Title: ${data.title || 'Unknown'}
Brand: ${data.brand || 'Unknown'}
Description: ${data.description || 'Unknown'}
Material: ${data.material || 'Unknown'}

Return ONLY a valid JSON object matching this schema exactly:
{
  "ecoScore": number (0-100),
  "carbonImpact": string ("Low", "Medium", or "High"),
  "waterUsage": string ("Low", "Medium", or "High"),
  "confidence": string ("Low", "Medium", or "High" depending on data completeness),
  "strengths": string[] (up to 3 positive environmental points),
  "concerns": string[] (up to 3 negative environmental points),
  "recommendations": string (1 short sentence recommending an alternative approach)
}
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      throw new Error('Failed to fetch from Gemini API');
    }

    const result = await res.json();
    const textResponse = result.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse) as EcoAnalysis;
  } catch (error) {
    throw error;
  }
}
