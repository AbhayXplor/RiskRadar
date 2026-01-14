
import React, { useState, useMemo } from 'react';
import { Borrower, RiskSeverity, RiskSignal, RiskCategory, CandidateEntity, GeminiModel } from '../types';
import { Radar, ExternalLink, Info, Plus, Shield, FileText, CheckCircle, Search, Network, Scale, Lock, Briefcase } from './Icons';
import { resolveEntities, analyzeBorrowerRisk } from '../services/gemini';

const Dashboard: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  // Config State
  const [model, setModel] = useState<GeminiModel>('gemini-3-flash-preview');
  
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
    if (!searchQuery.trim()) return;
    setIsResolving(true);
    try {
      const results = await resolveEntities(searchQuery, { model });
      setCandidates(results);
    } catch (err) {
      alert("Resolution failed. Verify your API key is configured in the environment.");
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
    } catch (e) {
      alert("Analysis failed. Ensure your environment has a valid API Key and has search grounding access.");
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
                <optgroup label="Gemini 3 Series">
                  <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (High Complexity)</option>
                </optgroup>
                <optgroup label="Gemini 2.5 Series">
                  <option value="gemini-2.5-flash-native-audio-preview-12-2025">Gemini 2.5 Flash</option>
                  <option value="gemini-flash-lite-latest">Gemini Flash Lite</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${(typeof process !== 'undefined' && process.env.API_KEY) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            OSINT Grounding: {(typeof process !== 'undefined' && process.env.API_KEY) ? 'Active (2026)' : 'Key Error'}
          </div>
        </header>

        {/* Resolution Modal */}
        {candidates && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-1">Entity Verification</h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm identity to begin surveillance</div>
                </div>
                <button onClick={() => setCandidates(null)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {candidates.map((c, i) => (
                  <div 
                    key={i} 
                    className="w-full text-left p-8 rounded-[2rem] border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 group transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-black text-slate-900 group-hover:text-blue-700 text-lg uppercase tracking-tight">{c.name}</div>
                      {c.ticker && <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded uppercase tracking-widest">{c.ticker}</span>}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{c.industry}</div>
                    <div className="text-xs text-slate-500 leading-relaxed font-medium mb-6">{c.description}</div>
                    
                    {c.groundingSources && c.groundingSources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {c.groundingSources.slice(0, 2).map((s, idx) => (
                          <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 hover:bg-blue-600 hover:text-white transition-all">
                             <ExternalLink className="w-3 h-3" /> Proof
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleCommitEntity(c)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Initialize Monitoring
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isResolving || loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="relative">
               <Radar className="w-16 h-16 text-blue-600" />
            </div>
            <div className="mt-8 text-sm font-black uppercase tracking-[0.5em] text-slate-900">{loading ? 'Indexing 2026 Risk Data...' : 'Resolving Identity...'}</div>
            <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-xs text-center leading-relaxed">Scanning SoS Portals, News Terminals, and Proxy Signal Points...</div>
          </div>
        ) : !selectedBorrower ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-12">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border border-slate-100 mb-10">
               <Shield className="w-12 h-12 opacity-10 text-slate-900" />
            </div>
            <h3 className="text-slate-900 font-black text-2xl mb-3 uppercase tracking-tighter italic">Terminal Ready</h3>
            <p className="max-w-xs text-sm text-slate-500 leading-relaxed font-medium uppercase tracking-widest text-[10px]">Select or add a borrower to initialize OSINT surveillance.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-10 pt-10 pb-6 bg-white border-b border-slate-100">
              <div className="max-w-7xl mx-auto flex justify-between items-end">
                <div>
                  <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">{selectedBorrower.name}</h2>
                  <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">
                    <span className="flex items-center gap-2 text-slate-900"><Briefcase className="w-3.5 h-3.5 text-blue-600" /> {selectedBorrower.industry}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-900">Benchmark: {currentBenchmark}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className={`px-3 py-1 rounded-lg text-white font-black ${getSeverityColor(selectedBorrower.riskStatus)}`}>{selectedBorrower.riskStatus}</span>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {[
                    { id: 'news', label: 'Feed', icon: <Radar className="w-3.5 h-3.5" /> },
                    { id: 'legal', label: 'Covenants', icon: <Scale className="w-3.5 h-3.5" /> },
                    { id: 'supply', label: 'Ripple', icon: <Network className="w-3.5 h-3.5" /> },
                    { id: 'memo', label: 'Memo', icon: <FileText className="w-3.5 h-3.5" /> },
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2.5 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Workspace */}
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
              <div className="max-w-7xl mx-auto">
                {activeTab === 'news' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                           <Info className="w-20 h-20" />
                        </div>
                        <span className="text-blue-600 font-black block mb-4 uppercase text-[10px] tracking-[0.3em]">2025-2026 OSINT Analysis</span>
                        <p className="text-lg leading-relaxed font-bold italic text-slate-800">"{currentSummary}"</p>
                      </div>
                      
                      {currentSignals.length === 0 ? (
                        <div className="p-24 text-center bg-white border border-slate-200 border-dashed rounded-[3rem] text-slate-400 italic font-medium">No signals detected for the current surveillance cycle.</div>
                      ) : (
                        currentSignals.map(sig => (
                          <div key={sig.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                              <div className="flex gap-3">
                                <span className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{sig.category}</span>
                                <span className={`px-3 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-widest ${getSeverityColor(sig.severity)}`}>{sig.severity}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{sig.date}</span>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight italic">{sig.title}</h4>
                            <p className="text-slate-600 text-base leading-relaxed mb-8 font-medium">{sig.summary}</p>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-8">
                               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                  <span className="font-black text-slate-400 block mb-2 uppercase text-[9px] tracking-widest">Credit Impact Logic</span>
                                  <p className="text-xs text-slate-700 font-bold leading-relaxed">{sig.impact}</p>
                               </div>
                               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                  <span className="font-black text-slate-400 block mb-2 uppercase text-[9px] tracking-widest">Verified Source</span>
                                  <p className="text-xs text-slate-900 font-black truncate">{sig.source}</p>
                               </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                              {sig.groundingSources?.slice(0, 3).map((s, i) => (
                                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                  <ExternalLink className="w-3.5 h-3.5" /> {s.title || "Open Proof Link"}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Stats */}
                    <div className="space-y-8">
                      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                           <Radar className="w-24 h-24" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-8">Risk Composition</h4>
                        <div className="space-y-6">
                          {Object.values(RiskCategory).map(cat => {
                            const count = currentSignals.filter(s => s.category === cat).length;
                            if (count === 0 && cat !== RiskCategory.NEUTRAL) return null;
                            return (
                              <div key={cat} className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                  <span className="text-slate-400">{cat}</span>
                                  <span className="text-blue-400">{count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000" style={{ width: `${(count / (currentSignals.length || 1)) * 100}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em] mb-6 flex items-center gap-2 italic"><Shield className="w-4 h-4 text-emerald-500" /> Evidence Protocol</h4>
                        <p className="text-[10px] font-bold text-slate-500 leading-loose uppercase tracking-[0.1em]">All surfaced signals are grounded in 2025/2026 data. This system implements Deterministic Retrieval to eliminate hallucination risks for credit committees.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'legal' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-8">
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Covenant Analysis Engine</h3>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Legal-Tech mapping to boilerplate credit agreements</div>
                      </div>
                      <div className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] bg-blue-50 px-6 py-3 rounded-full border border-blue-100 shadow-sm">Clause Trigger Monitoring Enabled</div>
                    </div>
                    {currentSignals.filter(s => s.covenantImpact && s.covenantImpact.toLowerCase() !== "none").length === 0 ? (
                      <div className="p-32 text-center bg-white border border-slate-200 border-dashed rounded-[3rem] text-slate-400 italic font-medium">No covenant breaches or clause triggers identified in current dataset.</div>
                    ) : (
                      currentSignals.map(sig => sig.covenantImpact && sig.covenantImpact.toLowerCase() !== "none" ? (
                        <div key={sig.id} className="bg-white border-l-8 border-l-red-500 rounded-r-[3rem] border border-slate-200 p-12 shadow-xl hover:shadow-2xl transition-all flex gap-10">
                          <div className="shrink-0 p-6 bg-red-50 rounded-[2rem] h-fit shadow-inner">
                            <Scale className="w-10 h-10 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                              Critical Trigger <span className="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse"></span> {sig.date}
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight italic leading-tight">{sig.title}</h4>
                            <div className="p-8 bg-slate-900 rounded-[2rem] border-2 border-slate-800 shadow-2xl">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">AI Clause Analysis</span>
                              <p className="text-lg font-bold text-slate-200 italic leading-relaxed">"{sig.covenantImpact}"</p>
                            </div>
                          </div>
                        </div>
                      ) : null)
                    )}
                  </div>
                )}

                {activeTab === 'supply' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="border-b border-slate-200 pb-8">
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Network Contagion Mapping</h3>
                       <p className="text-slate-500 text-sm mt-2 font-medium">Visualizing second-order impacts on the borrower's ecosystem.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-10">
                      {currentSignals.map(sig => (
                        <div key={sig.id} className="bg-slate-900 text-white p-12 rounded-[3.5rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                            <Network className="w-32 h-32" />
                          </div>
                          <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                               <Network className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Node Failure Ripple</span>
                          </div>
                          <h4 className="text-3xl font-black mb-8 leading-tight tracking-tight uppercase italic">{sig.title}</h4>
                          <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 italic text-base leading-relaxed text-slate-300 shadow-inner">
                            {sig.supplyChainRipple || "No network contagion data identified for this event."}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'memo' && (
                  <div className="bg-white p-20 lg:p-32 rounded-[4rem] border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 memo-content text-slate-900 relative">
                    <div className="absolute top-0 left-0 w-full h-4 bg-slate-900 rounded-t-[4rem]" />
                    <div className="max-w-4xl mx-auto space-y-20">
                      <div className="border-b-4 border-slate-900 pb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                             <Radar className="w-6 h-6 text-blue-600" />
                             <span className="text-blue-600 font-black text-xs uppercase tracking-[0.4em]">RiskRadar Terminal</span>
                          </div>
                          <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter italic leading-none">Internal Risk <br /> Assessment</h2>
                        </div>
                        <div className="text-left md:text-right font-black uppercase tracking-widest leading-loose">
                          <div className="text-sm text-slate-900">ID: {selectedBorrower.id.slice(-8).toUpperCase()}</div>
                          <div className="text-[10px] text-slate-400">TIMESTAMP: {new Date().toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">STATUS: OFFICIAL RECORD</div>
                        </div>
                      </div>

                      <div className="space-y-20">
                        <section className="grid md:grid-cols-3 gap-10">
                          <div className="md:col-span-1">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">01. Subject</h4>
                          </div>
                          <div className="md:col-span-2">
                             <div className="text-3xl font-black italic uppercase tracking-tight mb-2">{selectedBorrower.name}</div>
                             <div className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">{selectedBorrower.industry} Sector Monitor</div>
                          </div>
                        </section>

                        <section className="grid md:grid-cols-3 gap-10">
                          <div className="md:col-span-1">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">02. OSINT Summary</h4>
                          </div>
                          <div className="md:col-span-2">
                             <p className="text-2xl leading-relaxed font-bold italic border-l-8 border-blue-600 pl-10 text-slate-800">"{currentSummary}"</p>
                          </div>
                        </section>

                        <section className="grid md:grid-cols-3 gap-10">
                          <div className="md:col-span-1">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">03. Signal Log</h4>
                          </div>
                          <div className="md:col-span-2 space-y-12">
                            {currentSignals.map((s, i) => (
                              <div key={i} className="flex gap-10 border-b border-slate-100 pb-12 last:border-0 group">
                                <span className="font-black text-blue-600 text-3xl leading-none italic">0{i+1}</span>
                                <div className="flex-1">
                                  <div className="font-black text-slate-900 text-xl mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{s.title}</div>
                                  <div className="text-base text-slate-500 leading-relaxed font-medium">{s.impact}</div>
                                </div>
                                <div className={`px-3 py-1.5 h-fit rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${getSeverityColor(s.severity)}`}>
                                  {s.severity}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="bg-slate-50 p-12 rounded-[3.5rem] border-2 border-slate-100">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10">04. Credit Officer Attestation</h4>
                          <div className="grid md:grid-cols-2 gap-10">
                             <div>
                                <div className="h-20 border-b-4 border-slate-200 border-dashed mb-6 bg-white/50 rounded-t-2xl"></div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surveillance Officer Signature</div>
                             </div>
                             <div>
                                <div className="h-20 border-b-4 border-slate-200 border-dashed mb-6 bg-white/50 rounded-t-2xl"></div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review Date & Timestamp</div>
                             </div>
                          </div>
                        </section>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => {
                            const text = (document.querySelector('.memo-content') as HTMLElement)?.innerText || 'Memo Draft';
                            navigator.clipboard.writeText(text);
                            alert("Institutional Memo Draft copied to secure clipboard.");
                          }}
                          className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl group"
                        >
                          <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" /> Export Record
                        </button>
                        <button 
                          className="bg-slate-100 text-slate-900 px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-slate-200 transition-all border border-slate-200"
                          onClick={() => window.print()}
                        >
                          Print PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @media print {
          aside, header, nav, .bg-slate-900, button {
            display: none !important;
          }
          main, .memo-content, .memo-content * {
            display: block !important;
            visibility: visible !important;
            color: black !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .memo-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
