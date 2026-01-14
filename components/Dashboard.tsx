
import React, { useState, useMemo, useEffect } from 'react';
import { Borrower, RiskSeverity, RiskSignal, RiskCategory, CandidateEntity, GeminiModel } from '../types.ts';
import { Radar, ExternalLink, Info, Plus, Shield, FileText, CheckCircle, Search, Network, Scale, Lock, Briefcase } from './Icons.tsx';
import { resolveEntities, analyzeBorrowerRisk } from '../services/gemini.ts';

const Dashboard: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  // Config State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('riskradar_key') || '');
  const [model, setModel] = useState<GeminiModel>(() => (localStorage.getItem('riskradar_model') as GeminiModel) || 'gemini-flash-latest');
  const [showConfig, setShowConfig] = useState(false);
  
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

  // Persist config
  useEffect(() => {
    localStorage.setItem('riskradar_key', apiKey);
    localStorage.setItem('riskradar_model', model);
  }, [apiKey, model]);

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
    if (!apiKey) {
      alert("Please provide an API Key in the Terminal Config.");
      setShowConfig(true);
      return;
    }
    if (!searchQuery.trim()) return;
    setIsResolving(true);
    try {
      const results = await resolveEntities(searchQuery, { model, apiKey });
      setCandidates(results);
    } catch (err: any) {
      alert(`Terminal Error: ${err.message || 'Check your API key and permissions.'}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleCommitEntity = async (candidate: CandidateEntity) => {
    setCandidates(null);
    setSearchQuery('');
    setLoading(true);
    try {
      const result = await analyzeBorrowerRisk(candidate.name, candidate.industry, { model, apiKey });
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
      alert(`Surveillance Failed: ${e.message}. Ensure Search Grounding is enabled on your project.`);
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

        {/* Manual Config Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            <span>Terminal Config</span>
            <Lock className="w-3 h-3" />
          </button>
          {showConfig && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">API Key</label>
                 <input 
                   type="password"
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[10px] focus:ring-1 focus:ring-blue-500 outline-none"
                   placeholder="Enter Key..."
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Engine</label>
                 <select 
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[10px] outline-none"
                   value={model}
                   onChange={(e) => setModel(e.target.value as GeminiModel)}
                 >
                   <option value="gemini-flash-latest">Gemini Flash (Latest)</option>
                   <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                   <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                   <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                 </select>
               </div>
               <p className="text-[8px] text-slate-600 italic">Keys are stored locally in your browser.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-10 py-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Current Node:</span>
            <span className="text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{model}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              Terminal {apiKey ? 'Armed' : 'Offline'}
            </div>
          </div>
        </header>

        {isResolving || loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="relative">
               <Radar className="w-16 h-16 text-blue-600" />
            </div>
            <div className="mt-8 text-sm font-black uppercase tracking-[0.5em] text-slate-900">{loading ? 'Running Surveillance...' : 'Resolving Identity...'}</div>
          </div>
        ) : !selectedBorrower ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-12">
            {!apiKey && (
              <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl mb-12 max-w-sm border border-slate-800">
                 <Lock className="w-12 h-12 text-blue-500 mb-6 mx-auto" />
                 <h3 className="text-white font-black text-xl mb-3 uppercase tracking-tighter">Identity Required</h3>
                 <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">Enter your Gemini API key in the terminal config or below to unlock OSINT capabilities.</p>
                 <input 
                   type="password"
                   className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-xs text-white mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Enter Gemini API Key..."
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                 />
                 <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black italic">Search Grounding Enabled Project Required</p>
              </div>
            )}
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border border-slate-100 mb-10">
               <Shield className="w-12 h-12 opacity-10 text-slate-900" />
            </div>
            <h3 className="text-slate-900 font-black text-2xl mb-3 uppercase tracking-tighter italic">Terminal Ready</h3>
            <p className="max-w-xs text-sm text-slate-500 leading-relaxed font-medium uppercase tracking-widest text-[10px]">Initialize monitoring using the sidebar search.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Dashboard Header */}
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
              
              {/* Main Feed */}
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                   {activeTab === 'news' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <div className="lg:col-span-2 space-y-8">
                         <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                           <p className="text-lg leading-relaxed font-bold italic text-slate-800">"{currentSummary}"</p>
                         </div>
                         {currentSignals.map(sig => (
                           <div key={sig.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl group">
                             <div className="flex justify-between items-center mb-6">
                               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getSeverityColor(sig.severity)}`}>{sig.severity} Severity</span>
                               <span className="text-[10px] font-black text-slate-400 uppercase">{sig.date}</span>
                             </div>
                             <h4 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">{sig.title}</h4>
                             <p className="text-slate-600 text-base leading-relaxed mb-6 font-medium">{sig.summary}</p>
                             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Surveillance Memo</span>
                                <p className="text-xs text-slate-700 font-bold italic leading-relaxed">{sig.impact}</p>
                             </div>
                             <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                               {sig.groundingSources?.map((s, i) => (
                                 <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                   <ExternalLink className="w-3.5 h-3.5" /> Source Proof
                                 </a>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                       
                       <div className="space-y-8">
                          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Risk Composition</h4>
                             <div className="space-y-4">
                                {Object.values(RiskCategory).map(cat => {
                                  const count = currentSignals.filter(s => s.category === cat).length;
                                  return count > 0 ? (
                                    <div key={cat} className="flex justify-between items-center text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-3">
                                       <span className="text-slate-400">{cat}</span>
                                       <span className="text-blue-400">{count}</span>
                                    </div>
                                  ) : null;
                                })}
                             </div>
                          </div>
                       </div>
                     </div>
                   )}
                   {activeTab === 'legal' && (
                     <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentSignals.map(sig => sig.covenantImpact && sig.covenantImpact.toLowerCase() !== "none" ? (
                          <div key={sig.id} className="bg-white border-l-8 border-l-red-500 rounded-r-[3rem] border border-slate-200 p-12 shadow-xl flex gap-10">
                            <div className="shrink-0 p-6 bg-red-50 rounded-[2rem] h-fit">
                              <Scale className="w-10 h-10 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight italic leading-tight">{sig.title}</h4>
                              <div className="p-8 bg-slate-900 rounded-[2rem] border-2 border-slate-800">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">Covenant Mapping</span>
                                <p className="text-lg font-bold text-slate-200 italic leading-relaxed">"{sig.covenantImpact}"</p>
                              </div>
                            </div>
                          </div>
                        ) : null)}
                     </div>
                   )}
                   {activeTab === 'supply' && (
                     <div className="grid md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentSignals.map(sig => (
                          <div key={sig.id} className="bg-slate-900 text-white p-12 rounded-[3.5rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                            <Network className="absolute top-0 right-0 p-10 opacity-10 w-32 h-32 group-hover:scale-125 transition-transform duration-1000" />
                            <h4 className="text-3xl font-black mb-8 leading-tight tracking-tight uppercase italic">{sig.title}</h4>
                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 italic text-base leading-relaxed text-slate-300">
                              {sig.supplyChainRipple || "Localized impact; low network risk ripple."}
                            </div>
                          </div>
                        ))}
                     </div>
                   )}
                   {activeTab === 'memo' && (
                     <div className="max-w-4xl mx-auto bg-white p-20 rounded-[4rem] shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <div className="border-b-4 border-slate-900 pb-12 mb-16">
                           <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Internal Assessment Memo</h2>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Confidential Terminal Record | {new Date().toLocaleDateString()}</div>
                        </div>
                        <div className="space-y-12">
                           <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">01 Executive Summary</h4>
                              <p className="text-2xl leading-relaxed font-bold italic border-l-8 border-blue-600 pl-10 text-slate-800">"{currentSummary}"</p>
                           </div>
                           <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">02 Observed Risk Signals</h4>
                              <div className="space-y-8">
                                 {currentSignals.map((s, i) => (
                                   <div key={i} className="flex gap-10 pb-8 border-b border-slate-100 last:border-0">
                                      <span className="font-black text-blue-600 text-3xl leading-none italic">0{i+1}</span>
                                      <div className="flex-1">
                                        <div className="font-black text-slate-900 text-xl mb-3 uppercase tracking-tight">{s.title}</div>
                                        <div className="text-base text-slate-500 leading-relaxed font-medium">{s.impact}</div>
                                      </div>
                                   </div>
                                 ))}
                              </div>
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
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-1">Entity Verification</h3>
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
