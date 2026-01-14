
# RiskRadar
### Institutional OSINT Surveillance for Borrower Risk Monitoring

**RiskRadar** is an enterprise-grade surveillance tool designed for lenders and credit committees to bridge the information gap between quarterly financial reporting cycles. By leveraging deterministic retrieval and advanced OSINT (Open Source Intelligence) grounding, RiskRadar identifies material adverse events (MAE) in real-time, focusing specifically on public, non-financial signals.

## 🚀 Commercial Viability

### 1. Value Proposition
Traditional credit monitoring relies on lagging financial data. RiskRadar surfaces leading indicators—litigation, regulatory delinquency, operational ripples, and management shifts—allowing lenders to move from reactive to proactive risk mitigation.

### 2. Efficiency Gains
Replaces hours of manual "Google-searching" and Secretary of State portal checks with a single automated surveillance terminal. Automates the drafting of Internal Risk Memos for Credit Committee review.

### 3. Scalability
Designed to handle both high-profile public entities and "dark" SMBs. By utilizing **Alternative Data Proxies** (domain health, local court dockets, sentiment pivots), RiskRadar provides coverage for segments typically ignored by institutional news terminals.

### 4. Risk Mitigation
Specifically maps OSINT signals to common **Loan Covenant Clauses** (e.g., Key Man, Change of Control, Technical Default triggers), reducing time-to-detection for potential defaults.

## 🛠 Tech Stack

- **Frontend:** React 19, Tailwind CSS
- **Intelligence Engine:** Gemini 2.5/3 (Flash & Pro variants)
- **Data Grounding:** Search Grounding via @google/genai (Real-time 2025/2026 data)
- **Verification:** Deterministic Source Attribution (Clickable OSINT Proofs)

## 🛡 Anti-Hallucination Architecture
RiskRadar implements a strict **Evidence-Based Protocol**:
- **Zero Hallucination:** Every risk claim is mapped to a `groundingChunk` URL.
- **Deterministic Summarization:** The AI acts as a sophisticated reader/summarizer of retrieved facts, not a generative creative engine.
- **Traceability:** Clickable "Proof" links allow human officers to verify the original source instantly.

## 📦 Deployment on Vercel

To deploy this terminal as a production-ready application:

1. **Environment Variable:**
   Add the following to your Vercel Project Settings:
   - `API_KEY`: Your Production API Key.

2. **Build Configuration:**
   - Framework Preset: `Other` (or React)
   - Build Command: `npm run build` (if applicable) or ensure the entry point is `index.html`.

## 📖 Features

- **Surveillance Feed:** Real-time risk categorization and severity scoring.
- **Covenant Analysis:** AI-assisted mapping of news to technical default triggers.
- **Supply Chain Ripple:** Network contagion visualization.
- **Credit Memo Generator:** Instant drafting of institutional assessment reports.

---
*Note: This tool uses public OSINT data and does not analyze private borrower financial statements.*
