
import React, { useState, useEffect, useCallback } from 'react';
import { simulateScan } from './services/scannerLogic';
import { analyzeSecurity } from './services/geminiService';
import { ScanResult, SecurityInsight, PortStatus } from './types';
import { ICONS } from './constants.tsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const App: React.FC = () => {
  const [target, setTarget] = useState('');
  const [scanMode, setScanMode] = useState<'common' | 'range'>('common');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1024);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [insights, setInsights] = useState<SecurityInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    setError(null);
    setIsScanning(true);
    setScanResult(null);
    setInsights([]);

    try {
      const result = await simulateScan(target, scanMode, rangeStart, rangeEnd);
      setScanResult(result);
      
      // Perform AI Analysis
      const openPorts = result.ports.filter(p => p.status === PortStatus.OPEN);
      setIsAnalyzing(true);
      const securityInsights = await analyzeSecurity(target, openPorts);
      setInsights(securityInsights);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during the scan.");
    } finally {
      setIsScanning(false);
      setIsAnalyzing(false);
    }
  };

  const chartData = scanResult ? [
    { name: 'Open', value: scanResult.openPorts },
    { name: 'Closed', value: scanResult.totalPorts - scanResult.openPorts }
  ] : [];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <ICONS.Terminal className="w-6 h-6 text-zinc-950" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mono uppercase">CyberScan<span className="text-emerald-500">.io</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Security Advisories</a>
            <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-xs text-zinc-500 mono">v2.4.0-stable</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Input Section */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 scan-glow">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ICONS.Activity className="w-5 h-5 text-emerald-500" />
                Scan Configuration
              </h2>
              <form onSubmit={handleScan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Target IP / Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.1 or google.com"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-zinc-200 placeholder:text-zinc-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setScanMode('common')}
                    className={`py-2 text-sm font-medium rounded-lg transition-all ${scanMode === 'common' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Common Ports
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('range')}
                    className={`py-2 text-sm font-medium rounded-lg transition-all ${scanMode === 'range' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Port Range
                  </button>
                </div>

                {scanMode === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Start</label>
                      <input
                        type="number"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(parseInt(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 text-zinc-300"
                        min="1"
                        max="65535"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">End</label>
                      <input
                        type="number"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(parseInt(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 text-zinc-300"
                        min="1"
                        max="65535"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isScanning}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                    isScanning 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 active:scale-[0.98]'
                  }`}
                >
                  {isScanning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      Execute Network Scan
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 text-sm">
                  <ICONS.Alert className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <ICONS.Alert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Disclaimer</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This tool is developed strictly for educational purposes. Unauthorized scanning of networks without explicit permission is illegal. Users are responsible for their actions.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!scanResult && !isScanning && (
              <div className="h-full min-h-[400px] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                <div className="bg-zinc-900 p-4 rounded-full mb-4">
                  <ICONS.Shield className="w-12 h-12 text-zinc-700" />
                </div>
                <h3 className="text-xl font-medium text-zinc-400 mb-2">Ready for Analysis</h3>
                <p className="text-zinc-600 max-w-sm">
                  Enter an IP address or domain above to begin a secure network port discovery scan.
                </p>
              </div>
            )}

            {isScanning && (
              <div className="h-full min-h-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ICONS.Activity className="w-8 h-8 text-emerald-500 animate-pulse-slow" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white mono">Analyzing Packets...</h3>
                  <p className="text-zinc-500 text-sm">Target: {target}</p>
                  <div className="flex gap-1 justify-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                    <span className="text-xs font-medium text-zinc-500 block mb-1">Total Scanned</span>
                    <span className="text-2xl font-bold text-white mono">{scanResult.totalPorts}</span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                    <span className="text-xs font-medium text-zinc-500 block mb-1">Open Ports</span>
                    <span className="text-2xl font-bold text-emerald-500 mono">{scanResult.openPorts}</span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                    <span className="text-xs font-medium text-zinc-500 block mb-1">Scan Duration</span>
                    <span className="text-2xl font-bold text-blue-400 mono">{scanResult.timeElapsed.toFixed(2)}s</span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl overflow-hidden">
                    <div className="h-10 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                            data={chartData}
                            innerRadius={15}
                            outerRadius={20}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                           >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                           </Pie>
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Port Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-300">Detailed Scan Report</h3>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Status: Active
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-zinc-950/50 text-xs font-bold uppercase text-zinc-500">
                          <th className="px-6 py-4">Port</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Service</th>
                          <th className="px-6 py-4">Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {scanResult.ports.map((p, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                            <td className="px-6 py-4 font-bold mono text-emerald-400">
                              {p.port}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                                p.status === PortStatus.OPEN 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : 'bg-red-500/10 border-red-500/20 text-red-500'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-zinc-400 italic">
                              {p.service}
                            </td>
                            <td className="px-6 py-4 text-xs mono text-zinc-600 group-hover:text-zinc-400">
                              {p.latency ? `${p.latency}ms` : '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Insights Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 bg-emerald-500/5 border-b border-zinc-800 flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500 rounded-md">
                      <ICONS.Shield className="w-4 h-4 text-zinc-950" />
                    </div>
                    <h3 className="font-bold text-white uppercase tracking-tight">AI Security Analysis</h3>
                    {isAnalyzing && (
                      <div className="ml-auto flex items-center gap-2 text-xs text-emerald-500 mono">
                        <div className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        Generating Insights...
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {insights.length > 0 ? (
                      <div className="grid gap-4">
                        {insights.map((insight, idx) => (
                          <div key={idx} className="flex gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800/50 hover:border-emerald-500/20 transition-all">
                            <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                              insight.severity === 'critical' || insight.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 
                              insight.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-zinc-200">{insight.vulnerability}</h4>
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                  insight.severity === 'critical' ? 'bg-red-500 text-white' : 
                                  insight.severity === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                  'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}>
                                  {insight.severity}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed">
                                <span className="text-zinc-600 font-medium italic">Recommendation: </span>
                                {insight.recommendation}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !isAnalyzing ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                          <ICONS.Alert className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm italic">No significant security threats identified for this host.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500 uppercase tracking-widest font-medium">
          <p>© 2024 Network Intelligence Protocol. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Incident Response</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
