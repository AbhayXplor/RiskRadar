
import React, { useState, useMemo, useEffect } from 'react';
import { Borrower, RiskSeverity, RiskSignal, RiskCategory, CandidateEntity, GeminiModel } from '../types.ts';
import { Radar, ExternalLink, Info, Plus, Shield, FileText, CheckCircle, Search, Network, Scale, Lock, Briefcase } from './Icons.tsx';
import { resolveEntities, analyzeBorrowerRisk } from '../services/gemini.ts';

// Using the pre-defined AIStudio type to avoid type declaration conflicts.
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

const Dashboard: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  // Config State
  const [model, setModel] = useState<GeminiModel>('gemini-3-flash-preview');
  const [hasKey, setHasKey] = useState(false);
  
  // Data State
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<Record<string, { signals: RiskSignal[], summary: string, benchmark: string }>>({});
  const [activeTab, setActiveTab] = useState<'news' | 'legal' | 'supply' | 'memo'>('news');
  
  // Workflow State
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<CandidateEntity[] | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (process.env.API_KEY) {
        setHasKey(true);
      } else if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success after opening dialog to mitigate potential race conditions.
      setHasKey(true);
    }
  };

  const selectedBorrower = useMemo(() => borrowers.find(b => b.id === selectedId) || null, [borrowers, selectedId]);
  const currentSignals = useMemo(() => (selectedId && cachedData[selectedId]?.signals) || [], [cachedData, selectedId]);
  const currentSummary = useMemo(() => (selectedId && cachedData[selectedId]?.summary) || '', [cachedData, selectedId]);
  const currentBenchmark = useMemo(() => (selectedId && cachedData[selectedId]?.benchmark) || '', [cachedData, selectedId]);

  const calculateOverallRisk = (signals: RiskSignal[]): RiskSeverity => {
    const severities = signals.map(s => s.severity);
    if (severities.includes(RiskSeverity.CRITICAL)) return RiskSeverity.CRITICAL;
    if (severities.includes(RiskSeverity.HIGH)) return RiskSeverity.HIGH;
    if (severities.includes(RiskSeverity.MEDIUM)) return RiskSeverity.MEDIUM;
    if (severities.includes(RiskSeverity.LOW)) return RiskSeverity.LOW;
    return RiskSeverity.NONE;
  };

  const handleStartResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKey) {
      await handleSelectKey();
      return;
    }
    if (!searchQuery.trim()) return;
    setIsResolving(true);
    try {
      const results = await resolveEntities(searchQuery, { model });
      setCandidates(results);
    } catch (err: any) {
      // Prompt user to select a key again if a "Requested entity was not found." error occurs.
      if (err?.message?.includes("Requested entity was not found.")) {
        setHasKey(false);
        await handleSelectKey();
      } else {
        alert("Resolution failed. Verify your API key is configured.");
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleCommitEntity = async (candidate: CandidateEntity) => {
    setCandidates(null);
    setSearchQuery('');
    setLoading(true);
    try {
      const result = await analyzeBorrowerRisk(candidate.name, candidate.industry, { model });
      const newId = Date.now().toString();
      const newBorrower: Borrower = {
        id: newId,
        name: candidate.name,
        industry: candidate.industry,
        ticker: candidate.ticker,
        riskStatus: calculateOverallRisk(result.signals),
        trend: 'stable',
        lastMonitored: new Date().toISOString().split('T')[0],
        signalsCount: result.signals.length,
        isReviewed: false,
        benchmarkScore: result.benchmarkScore
      };
      setBorrowers(prev => [newBorrower, ...prev]);
      setCachedData(prev => ({ ...prev, [newId]: { signals: result.signals, summary: result.summarySentence, benchmark: result.benchmarkScore } }));
      setSelectedId(newId);
    } catch (e: any) {
      // Prompt user to select a key again if a "Requested entity was not found." error occurs.
      if (e?.message?.includes("Requested entity was not found.")) {
        setHasKey(false);
        await handleSelectKey();
      } else {
        alert("Analysis failed. Ensure you have selected a valid API Key with Search Grounding enabled.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: RiskSeverity) => {
    switch (sev) {
      case RiskSeverity.CRITICAL: return 'bg-red-500 text-white';
      case RiskSeverity.HIGH: return 'bg-orange-500 text-white';
      case RiskSeverity.MEDIUM: return 'bg-amber-400 text-slate-900';
      case RiskSeverity.LOW: return 'bg-emerald-500 text-white';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-8 flex items-center gap-3 border-b border-slate-800 cursor-pointer group" onClick={onBackToHome}>
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <Radar className="text-white h-5 w-5" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">RiskRadar</span>
        </div>
        
        <div className="p-5 border-b border-slate-800 bg-slate-800/20">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 px-2 flex items-center gap-2">
            <Plus className="w-3 h-3" /> Monitor New Target
          </h4>
          <form onSubmit={handleStartResolution} className="relative">
            <input 
              type="text" 
              placeholder="Borrower name or ticker..."
              className="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-7 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex justify-between items-center">
            <span>Portfolio Queue</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded-full">{borrowers.length}</span>
          </div>
          {borrowers.map(b => (
            <button 
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`w-full text-left p-6 border-b border-slate-800/50 flex justify-between items-start transition-all ${selectedId === b.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500 shadow-inner' : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm truncate uppercase tracking-tight">{b.name}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">{b.industry}</div>
              </div>
              <div className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase shrink-0 mt-1 ${getSeverityColor(b.riskStatus)}`}>
                {b.riskStatus}
              </div>
            </button>
          ))}
          {borrowers.length === 0 && (
            <div className="p-10 text-center text-slate-600 italic text-xs leading-relaxed">
               Queue is empty. <br /> Initialize surveillance above.
            </div>
          )}
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-10 py-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Engine:</span>
              <select 
                className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-[11px] text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                value={model}
                onChange={(e) => setModel(e.target.value as GeminiModel)}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!hasKey ? (
              <button 
                onClick={handleSelectKey}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
              >
                Connect to Gemini API
              </button>
            ) : (
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                OSINT Grounding Active
              </div>
            )}
          </div>
        </header>

        {isResolving || loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="relative">
               <Radar className="w-16 h-16 text-blue-600" />
            </div>
            <div className="mt-8 text-sm font-black uppercase tracking-[0.5em] text-slate-900">{loading ? 'Indexing Risk Data...' : 'Resolving Identity...'}</div>
          </div>
        ) : !selectedBorrower ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-12">
            {!hasKey && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-10 max-w-sm">
                <p className="text-amber-700 text-[10px] font-black uppercase tracking-widest mb-4">Action Required</p>
                <p className="text-xs text-amber-600 font-medium leading-relaxed mb-6">You must select a Gemini API key from a paid GCP project to use real-time search grounding.</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold underline mb-4 block">Billing Documentation</a>
                <button onClick={handleSelectKey} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px]">Bring Your Key</button>
              </div>
            )}
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border border-slate-100 mb-10">
               <Shield className="w-12 h-12 opacity-10 text-slate-900" />
            </div>
            <h3 className="text-slate-900 font-black text-2xl mb-3 uppercase tracking-tighter italic">Terminal Ready</h3>
            <p className="max-w-xs text-sm text-slate-500 leading-relaxed font-medium uppercase tracking-widest text-[10px]">Select or add a borrower to initialize OSINT surveillance.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="px-10 pt-10 pb-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">{selectedBorrower.name}</h2>
                    <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">
                      <span className="flex items-center gap-2 text-slate-900"><Briefcase className="w-3.5 h-3.5 text-blue-600" /> {selectedBorrower.industry}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-900">Benchmark: {currentBenchmark}</span>
                      <span className={`px-3 py-1 rounded-lg text-white font-black ${getSeverityColor(selectedBorrower.riskStatus)}`}>{selectedBorrower.riskStatus}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    {['news', 'legal', 'supply', 'memo'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex items-center gap-2.5 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                   {activeTab === 'news' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <div className="lg:col-span-2 space-y-8">
                         <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                           <p className="text-lg leading-relaxed font-bold italic text-slate-800">"{currentSummary}"</p>
                         </div>
                         {currentSignals.map(sig => (
                           <div key={sig.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                             <h4 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tight">{sig.title}</h4>
                             <p className="text-slate-600 text-base leading-relaxed mb-6">{sig.summary}</p>
                             <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                               {sig.groundingSources?.map((s, i) => (
                                 <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600">
                                   <ExternalLink className="w-3.5 h-3.5" /> Proof Link
                                 </a>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   {activeTab === 'legal' && (
                     <div className="space-y-8">
                       <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl">
                         <div className="flex items-center gap-4 mb-8">
                           <Scale className="w-8 h-8 text-blue-400" />
                           <h3 className="text-3xl font-black uppercase italic tracking-tighter">Covenant Clause Mapping</h3>
                         </div>
                         <div className="grid gap-6">
                            {currentSignals.filter(s => s.category === RiskCategory.LEGAL || s.category === RiskCategory.REGULATORY).map(sig => (
                              <div key={sig.id} className="p-8 bg-slate-800 rounded-2xl border border-slate-700">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Detected Signal</div>
                                <div className="text-xl font-bold mb-4">{sig.title}</div>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                  <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Covenant Impact</div>
                                  <div className="text-sm font-medium text-slate-300 italic">{sig.covenantImpact || "No direct covenant friction mapped."}</div>
                                </div>
                              </div>
                            ))}
                         </div>
                       </div>
                     </div>
                   )}
                   {activeTab === 'supply' && (
                     <div className="space-y-8">
                       <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                         <div className="flex items-center gap-4 mb-8">
                           <Network className="w-8 h-8 text-blue-600" />
                           <h3 className="text-3xl font-black uppercase italic tracking-tighter">Supply Chain Contagion</h3>
                         </div>
                         <div className="grid md:grid-cols-2 gap-8">
                            {currentSignals.map(sig => (
                              <div key={sig.id} className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="font-bold mb-3">{sig.title}</div>
                                <div className="text-sm text-slate-500 leading-relaxed italic">{sig.supplyChainRipple || "Localized impact; low systemic ripple detected."}</div>
                              </div>
                            ))}
                         </div>
                       </div>
                     </div>
                   )}
                   {activeTab === 'memo' && (
                     <div className="max-w-4xl mx-auto bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-16">
                           <div>
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Internal Monitoring Memo</div>
                             <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Credit Committee Brief</h2>
                           </div>
                           <div className="text-right">
                             <div className="text-[10px] font-bold text-slate-500 uppercase">{new Date().toLocaleDateString()}</div>
                             <div className="text-[10px] font-bold text-blue-600 uppercase mt-1">Status: {selectedBorrower.riskStatus}</div>
                           </div>
                        </div>
                        <div className="space-y-10 text-slate-800 leading-relaxed font-medium">
                           <p className="text-xl italic font-bold">"Overall assessment for {selectedBorrower.name} indicates {selectedBorrower.riskStatus.toLowerCase()} risk profile based on current OSINT surveillance."</p>
                           <div className="grid gap-6">
                              <h4 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-100 pb-2">Key Highlights</h4>
                              {currentSignals.slice(0, 3).map(sig => (
                                <div key={sig.id} className="flex gap-4">
                                   <div className="shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2.5" />
                                   <div>
                                      <span className="font-bold">{sig.title}:</span> {sig.impact}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>
          </div>
        )}

        {/* Resolution Modal */}
        {candidates && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-xl overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-1">Entity Verification</h3>
                </div>
                <button onClick={() => setCandidates(null)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {candidates.map((c, i) => (
                  <div key={i} className="w-full text-left p-8 rounded-[2rem] border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                    <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{c.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{c.industry}</div>
                    <button 
                      onClick={() => handleCommitEntity(c)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      Initialize Monitoring
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
