
import { GoogleGenAI, Type } from "@google/genai";
import { RiskCategory, RiskSeverity, RiskSignal, RiskAnalysisResult, CandidateEntity, GeminiModel } from "../types.ts";

// Always initialize GoogleGenAI with { apiKey: process.env.API_KEY } inside functions to ensure correct key usage and prevent key leakage or misuse.
export const resolveEntities = async (query: string, config: { model: GeminiModel }): Promise<CandidateEntity[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Search for 3 corporate entities matching: "${query}". Return Official Name, Ticker, Industry, and 1-sentence description in JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ticker: { type: Type.STRING },
              industry: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "industry", "description"]
          }
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || "Source", uri: chunk.web?.uri || "" }));

    const entities = JSON.parse(response.text || "[]");
    return entities.map((e: any) => ({
      ...e,
      groundingSources: webSources
    }));
  } catch (e) {
    // Re-throw to allow dashboard to handle "Requested entity was not found." error
    console.error("Resolution failed", e);
    throw e;
  }
};

export const analyzeBorrowerRisk = async (name: string, industry: string, config: { model: GeminiModel }): Promise<RiskAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `It is currently early 2026. Perform deep risk surveillance for "${name}" (${industry}).
  REQUIRED TASKS:
  1. Find latest risk signals from 2025/2026.
  2. Perform "Covenant Mapping" and "Supply Chain Ripple" analysis.
  Return JSON ONLY with summarySentence, benchmarkScore, and signals array.`;

  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summarySentence: { type: Type.STRING },
            benchmarkScore: { type: Type.STRING },
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  date: { type: Type.STRING },
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  covenantImpact: { type: Type.STRING },
                  supplyChainRipple: { type: Type.STRING }
                }
              }
            }
          },
          required: ["summarySentence", "signals", "benchmarkScore"]
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || "Source", uri: chunk.web?.uri || "" }));

    const result = JSON.parse(response.text || '{}');
    const mappedSignals = (result.signals || []).map((s: any, i: number) => ({
      ...s,
      id: `sig-${i}-${Date.now()}`,
      category: RiskCategory[s.category as keyof typeof RiskCategory] || RiskCategory.NEUTRAL,
      severity: RiskSeverity[s.severity as keyof typeof RiskSeverity] || RiskSeverity.NONE,
      groundingSources: webSources
    }));

    return {
      summarySentence: result.summarySentence,
      benchmarkScore: result.benchmarkScore,
      signals: mappedSignals
    };
  } catch (error) {
    // Re-throw to allow dashboard to handle "Requested entity was not found." error
    console.error("Analysis failed", error);
    throw error;
  }
};
