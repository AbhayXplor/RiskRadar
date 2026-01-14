
import { GoogleGenAI, Type } from "@google/genai";
import { RiskCategory, RiskSeverity, RiskSignal, RiskAnalysisResult, CandidateEntity, GeminiModel } from "../types.ts";

/**
 * Helper to safely extract JSON from a potentially conversational model response
 */
const extractJSON = (text: string): any => {
  try {
    // Attempt direct parse first
    return JSON.parse(text.trim());
  } catch (e) {
    // If that fails, look for markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e2) {
        throw new Error("Could not parse JSON from model response.");
      }
    }
    // Final attempt: find the first '[' or '{' and the last ']' or '}'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e3) {
        throw new Error("Failed to extract valid JSON from search response.");
      }
    }
    throw new Error("Model response did not contain a valid JSON structure.");
  }
};

export const resolveEntities = async (query: string, config: { model: GeminiModel, apiKey: string }): Promise<CandidateEntity[]> => {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const prompt = `Search for 3 corporate entities matching: "${query}". 
  Return the results as a raw JSON array of objects with these keys: name, ticker, industry, description.
  DO NOT include any conversational text or explanation. Just the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" is unsupported when using tools
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || "Source", uri: chunk.web?.uri || "" }));

    const entities = extractJSON(response.text || "[]");
    return entities.map((e: any) => ({
      ...e,
      groundingSources: webSources
    }));
  } catch (e) {
    console.error("Resolution failed", e);
    throw e;
  }
};

export const analyzeBorrowerRisk = async (name: string, industry: string, config: { model: GeminiModel, apiKey: string }): Promise<RiskAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  const prompt = `It is currently early 2026. Perform deep risk surveillance for "${name}" (${industry}).
  REQUIRED TASKS:
  1. Find latest risk signals from 2025/2026 using search.
  2. Perform "Covenant Mapping" and "Supply Chain Ripple" analysis.
  3. Return results as a single JSON object with: 
     - summarySentence (1 sentence)
     - benchmarkScore (A string e.g. "72/100")
     - signals (array of objects with: title, source, date, category, severity, summary, impact, covenantImpact, supplyChainRipple)
  
  ONLY return the JSON. No markdown blocks if possible, no preamble.`;

  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" is unsupported when using tools
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web?.title || "Source", uri: chunk.web?.uri || "" }));

    const result = extractJSON(response.text || '{}');
    const mappedSignals = (result.signals || []).map((s: any, i: number) => ({
      ...s,
      id: `sig-${i}-${Date.now()}`,
      category: RiskCategory[s.category as keyof typeof RiskCategory] || RiskCategory.NEUTRAL,
      severity: RiskSeverity[s.severity as keyof typeof RiskSeverity] || RiskSeverity.NONE,
      groundingSources: webSources
    }));

    return {
      summarySentence: result.summarySentence || "Analysis complete.",
      benchmarkScore: result.benchmarkScore || "N/A",
      signals: mappedSignals
    };
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};
