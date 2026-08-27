import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  BarChart3,
  Flame,
  Activity,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const AnalyticsView: React.FC = () => {
  const { setSelectedBugId } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnalytics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mr-2" />
        Calculating MTTR and engineering telemetry metrics...
      </div>
    );
  }

  const { overview, severityBreakdown, componentHealth, leaderBoard, recentAuditLogs } = metrics;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto p-6 space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Engineering Analytics & SLA Monitor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            Real-time MTTR, triage throughput, component reliability scores, and team leaderboard.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-mono border border-slate-700/80 transition-all duration-150 active:scale-[0.98]"
        >
          <RefreshCw className="w-3 h-3 text-emerald-400" /> Refresh Telemetry
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md transition-all hover:border-slate-700">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">Total Issues</div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">{overview.totalBugs}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal">Across all products</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md transition-all hover:border-slate-700">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">Active Open</div>
          <div className="text-2xl font-bold text-sky-400 font-mono mt-1">{overview.openBugs}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal">Pending resolution</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md transition-all hover:border-slate-700">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">Release Blockers</div>
          <div className="text-2xl font-bold text-red-400 font-mono mt-1">{overview.blockerBugs}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal">P1 critical issues</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md transition-all hover:border-slate-700">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">Security CVEs</div>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">{overview.securityBugs}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal">Sandboxed issues</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md transition-all hover:border-slate-700">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">Mean Time to Fix</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{overview.mttrHours}h</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal">MTTR average</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md transition-all hover:border-slate-700">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-medium">SLA Compliance</div>
          <div className="text-2xl font-bold text-teal-400 font-mono mt-1">{overview.slaCompliancePercent}%</div>
          <div className="text-[10px] text-slate-500 mt-1 font-normal">On-schedule fixes</div>
        </div>
      </div>

      {/* Grid: Component Health Matrix & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Reliability Matrix */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Component Health & Defect Density</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Reliability scoring</span>
          </div>

          <div className="space-y-2.5">
            {componentHealth.map((comp: any) => (
              <div
                key={comp.componentId}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between gap-4 transition-colors hover:border-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200 truncate font-sans">{comp.componentName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({comp.productName})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                    Lead: <span className="text-slate-300 font-mono">{comp.leadName}</span> • Open: {comp.openBugs} • Blockers: {comp.blockers}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">{comp.healthScore}%</div>
                    <div className="text-[10px] text-slate-500 font-mono">Health Score</div>
                  </div>
                  <div className="w-16 h-2 bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        comp.healthScore > 80
                          ? 'bg-emerald-400'
                          : comp.healthScore > 50
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${comp.healthScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-lg">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Severity Distribution</span>
          </h3>

          <div className="space-y-2.5">
            {Object.entries(severityBreakdown).map(([sev, count]: [string, any]) => {
              const pct = overview.totalBugs > 0 ? Math.round((count / overview.totalBugs) * 100) : 0;
              return (
                <div key={sev} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="capitalize text-slate-300 font-sans">{sev}</span>
                    <span className="text-slate-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sev === 'blocker'
                          ? 'bg-red-500'
                          : sev === 'critical'
                          ? 'bg-orange-500'
                          : sev === 'major'
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300">Top Fixers & Contributors</div>
            <div className="space-y-1.5">
              {leaderBoard.slice(0, 4).map((user: any, idx: number) => (
                <div
                  key={user.name}
                  className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-850 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">#{idx + 1}</span>
                    <span className="text-slate-200 truncate font-sans">{user.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{user.resolved} resolved</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Audit Trail Activity Feed */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 shadow-lg">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>System-wide Micro-Audit Trail Feed</span>
        </h3>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {recentAuditLogs.map((log: any) => (
            <div
              key={log.id}
              onClick={() => setSelectedBugId(log.bugId)}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-850 rounded-xl border border-slate-850 text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 font-mono"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-500 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-emerald-400 font-bold shrink-0">{log.actorName}</span>
                <div className="text-slate-300 truncate font-sans">
                  {log.changes.map((c: any) => `${c.field}: ${c.newValue}`).join(', ')}
                </div>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0 hover:text-emerald-400 font-mono">
                {log.bugId} →
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
