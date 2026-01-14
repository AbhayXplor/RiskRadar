
import React from 'react';
import { Shield, Radar, Briefcase, Lock, Search, Network, CheckCircle, Scale, FileText } from './Icons';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group"
          >
            <div className="bg-slate-900 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <Radar className="text-blue-400 h-5 w-5" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic">RiskRadar</span>
          </button>
          
          <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-blue-600 transition-colors">Capabilities</button>
            <button onClick={() => scrollToSection('smb-gap')} className="hover:text-blue-600 transition-colors">The SMB Gap</button>
            <button onClick={() => scrollToSection('trust')} className="hover:text-blue-600 transition-colors">Trust Architecture</button>
            <button 
              onClick={onGetStarted}
              className="bg-slate-900 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 lg:pt-56 lg:pb-40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] opacity-50 -z-10" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 border border-slate-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 2026 Real-Time Surveillance Engine
            </div>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-slate-900 mb-10 leading-[0.95] uppercase italic">
              Keeping Loans <br />
              <span className="text-blue-600">On Track.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-500 mb-14 leading-relaxed max-w-2xl font-medium">
              A professional OSINT monitoring tool for lenders. Identifying emerging risks in public data months before financial reporting lags.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button 
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-2xl shadow-blue-200 uppercase tracking-tight flex items-center justify-center gap-3 group"
              >
                Enter Terminal <Radar className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              </button>
              <div className="flex items-center gap-6 px-8 h-12 border-l border-slate-200 ml-0 sm:ml-4">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-tight">
                    Institutional <br /> Grade Tool
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capabilities" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h4 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Functional Pillars</h4>
              <h2 className="text-4xl lg:text-5xl font-black mb-12 tracking-tighter uppercase leading-tight italic">Beyond Headline <br /> Monitoring</h2>
              <div className="space-y-10">
                <div className="flex gap-8 group">
                  <div className="shrink-0 w-16 h-16 bg-slate-800 rounded-[2rem] flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Scale className="text-blue-400 group-hover:text-white w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Covenant Mapping</h3>
                    <p className="text-slate-400 leading-relaxed text-base">Automatically maps public signals to common credit agreement clauses (Key Man, MAC, Indebtedness Negative Covenants).</p>
                  </div>
                </div>
                <div className="flex gap-8 group">
                  <div className="shrink-0 w-16 h-16 bg-slate-800 rounded-[2rem] flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Network className="text-blue-400 group-hover:text-white w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Supply Chain Ripple</h3>
                    <p className="text-slate-400 leading-relaxed text-base">Predicts downstream contagion by analyzing industry dependencies and supplier-to-customer network nodes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-slate-800/50 p-1 rounded-[3rem] border border-slate-700/50 backdrop-blur-sm shadow-3xl">
                <div className="bg-slate-950 rounded-[2.5rem] p-10">
                  <div className="flex justify-between items-center mb-10">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Risk Feed Demo</div>
                    <div className="flex gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-red-500" />
                       <div className="w-2 h-2 rounded-full bg-amber-500" />
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 border-l-4 border-l-red-500 animate-pulse">
                       <div className="text-[9px] font-bold text-slate-500 uppercase mb-2">Operational Risk | 2026-01-14</div>
                       <div className="font-bold text-sm text-slate-200">Secondary Node Disruption Detected</div>
                    </div>
                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 border-l-4 border-l-amber-500">
                       <div className="text-[9px] font-bold text-slate-500 uppercase mb-2">Legal Risk | 2025-12-03</div>
                       <div className="font-bold text-sm text-slate-200">Secretary of State Status: Delinquent</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solving the SMB Gap */}
      <section id="smb-gap" className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h4 className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Strategic Value</h4>
            <h2 className="text-5xl font-black tracking-tighter uppercase italic">Bridging the SMB Monitoring Gap</h2>
            <p className="text-slate-500 mt-6 text-lg font-medium leading-relaxed">
              Standard news engines ignore small-to-medium businesses. RiskRadar targets alternative OSINT proxies to ensure 360-degree portfolio surveillance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Statutory Filings", 
                desc: "Direct monitoring of Secretary of State (SoS) status and tax lien registrations.",
                icon: <FileText className="w-8 h-8 text-blue-600" />
              },
              { 
                title: "Digital Footprint", 
                desc: "Tracking domain health, web downtime, and SSL expiry as proxies for operational distress.",
                icon: <Radar className="w-8 h-8 text-blue-600" />
              },
              { 
                title: "Sentiment Pivots", 
                desc: "Aggregating sudden localized review drops as early indicators of cash-flow friction.",
                icon: <Search className="w-8 h-8 text-blue-600" />
              }
            ].map((card, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-100/50 transition-all group">
                <div className="mb-8 p-4 bg-white rounded-2xl inline-block shadow-sm group-hover:scale-110 transition-transform">{card.icon}</div>
                <h3 className="text-xl font-black mb-4 tracking-tight uppercase">{card.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Anti-Hallucination */}
      <section id="trust" className="py-32 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-white rounded-[3rem] p-12 lg:p-20 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <Shield className="w-40 h-40" />
            </div>
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-black mb-8 tracking-tight uppercase italic leading-tight">Trust by Design: <br /> No Mock Data.</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <CheckCircle className="text-emerald-500 w-6 h-6 shrink-0" />
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase text-xs tracking-widest">Grounding Architecture</span>
                      Every risk signal is grounded in a verified web source. Our AI cannot "invent" events; it only summarizes retrieved OSINT data.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle className="text-emerald-500 w-6 h-6 shrink-0" />
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase text-xs tracking-widest">Live Jan 2026 Context</span>
                      Using Gemini Search Grounding, we pull live information. Your dashboard is as fresh as the last indexed article.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle className="text-emerald-500 w-6 h-6 shrink-0" />
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase text-xs tracking-widest">OSINT Attribution</span>
                      We provide clickable direct URLs for every signal. The AI is the filter; the original source is the truth.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                 <div className="p-8 bg-slate-900 rounded-3xl text-white">
                    <div className="flex items-center gap-3 mb-6">
                       <Lock className="text-blue-400 w-5 h-5" />
                       <span className="font-black text-[10px] uppercase tracking-widest">Compliance Protocol</span>
                    </div>
                    <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                       <li className="flex gap-3"><span className="text-blue-500">•</span> ZERO PRIVATE DATA INGESTION</li>
                       <li className="flex gap-3"><span className="text-blue-500">•</span> NO FINANCIAL PREDICTIONS</li>
                       <li className="flex gap-3"><span className="text-blue-500">•</span> DETERMINISTIC RETRIEVAL ONLY</li>
                       <li className="flex gap-3"><span className="text-blue-500">•</span> FULL OSINT TRACEABILITY</li>
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <Radar className="text-blue-400 h-4 w-4" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase italic">RiskRadar</span>
          </div>
          <div className="flex gap-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">OSINT Disclaimer</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Institutional Only</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">© 2026 RiskRadar</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
