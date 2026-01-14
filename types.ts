
export enum RiskCategory {
  LEGAL = 'Legal & Litigation',
  REGULATORY = 'Regulatory Compliance',
  MANAGEMENT = 'Management & Governance',
  OPERATIONAL = 'Operational Disruption',
  ENVIRONMENTAL = 'Environmental & Social',
  NEUTRAL = 'General Information'
}

export enum RiskSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  NONE = 'None'
}

export type Trend = 'up' | 'down' | 'stable';

export interface RiskSignal {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
  category: RiskCategory;
  severity: RiskSeverity;
  summary: string;
  impact: string;
  covenantImpact?: string; // Legal Tech: Clause mapping
  supplyChainRipple?: string; // Supply Chain: Second-order risk
  groundingSources?: Array<{ title: string; uri: string }>;
}

export interface Borrower {
  id: string;
  name: string;
  industry: string;
  ticker?: string;
  riskStatus: RiskSeverity;
  trend: Trend;
  lastMonitored: string;
  signalsCount: number;
  notes?: string;
  isReviewed?: boolean;
  benchmarkScore?: string;
  country?: string;
}

export interface RiskAnalysisResult {
  summarySentence: string;
  signals: RiskSignal[];
  benchmarkScore: string;
}

export interface CandidateEntity {
  name: string;
  ticker?: string;
  industry: string;
  description: string;
  groundingSources?: Array<{ title: string; uri: string }>;
}

export type GeminiModel = 
  | 'gemini-3-flash-preview' 
  | 'gemini-3-pro-preview' 
  | 'gemini-flash-lite-latest'
  | 'gemini-2.5-flash-native-audio-preview-12-2025';
