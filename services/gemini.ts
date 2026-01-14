
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

    // Extract grounding URLs as required for search grounding usage.
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
    console.error("Resolution failed", e);
    return [];
  }
};

export const analyzeBorrowerRisk = async (name: string, industry: string, config: { model: GeminiModel }): Promise<RiskAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // High-fidelity prompt for 2025-2026 data and SMB proxy strategies
  const prompt = `It is currently early 2026. Perform deep risk surveillance for "${name}" (${industry}).
  
  URGENT: Prioritize latest data from 2025 and January 2026.
  
  SURVEILLANCE STRATEGY:
  - For PUBLIC/LARGE entities: Search institutional news, SEC filings, and global regulatory logs.
  - For PRIVATE/SMB entities (likely low news footprint): Search for 'SMB Proxies':
    1. Secretary of State filings (check for administrative dissolution, delinquency, or tax liens).
    2. Local/County court dockets (judgments or small claims).
    3. Website/Digital integrity (check for recent downtime or 'parked' domains).
    4. Sentiment pivots (sudden drops in Google/Yelp/Glassdoor reviews suggesting cash flow or management stress).

  REQUIRED TASKS:
  1. Find latest risk signals.
  2. Perform "Covenant Mapping": map signals to terms like 'Key Man Clause', 'Change of Control', or 'Material Adverse Effect'.
  3. Perform "Supply Chain Ripple": identify impacts on major suppliers or customer network.
  4. Compare event frequency to "${industry}" peers for a benchmark score.

  Return JSON ONLY:
  {
    "summarySentence": "Overall 2025-2026 risk outlook...",
    "benchmarkScore": "X% Higher/Lower than peers",
    "signals": [
      {
        "title": "Clear headline",
        "source": "Specific source name",
        "date": "2025-MM-DD or 2026-01-DD",
        "category": "LEGAL|REGULATORY|MANAGEMENT|OPERATIONAL|ENVIRONMENTAL",
        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
        "summary": "Detailed context",
        "impact": "Credit impact logic",
        "covenantImpact": "Potential Breach: Clause Name - Reasoning",
        "supplyChainRipple": "Network effect on suppliers/customers"
      }
    ]
  }`;

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
                },
                required: ["title", "source", "category", "severity", "summary", "impact", "covenantImpact", "supplyChainRipple"]
              }
            }
          },
          required: ["summarySentence", "signals", "benchmarkScore"]
        }
      }
    });

    // Extract grounding URLs as required for search grounding usage.
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
    console.error("Analysis failed", error);
    throw error;
  }
};
