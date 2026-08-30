import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  BarChart3,
  Flame,
  Activity,
  RefreshCw,
  HeartPulse,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Award,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const AnalyticsView: React.FC = () => {
  const { setSelectedBugId, setActiveView, setSearchQuery } = useApp();
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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500 text-xs font-mono gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-700" />
        </div>
        <span>Calculating MTTR and engineering telemetry metrics...</span>
      </div>
    );
  }

  const { overview, severityBreakdown, componentHealth, leaderBoard, recentAuditLogs } = metrics;

  const topMetricCards = [
    {
      label: 'Total Issues',
      value: overview.totalBugs,
      subtitle: 'Across all active products',
      textColor: 'text-slate-900',
      icon: <BarChart3 className="w-4 h-4 text-slate-700" />,
    },
    {
      label: 'Active Open',
      value: overview.openBugs,
      subtitle: 'Pending resolution',
      textColor: 'text-slate-900',
      icon: <Zap className="w-4 h-4 text-slate-700" />,
    },
    {
      label: 'Release Blockers',
      value: overview.blockerBugs,
      subtitle: 'P1 critical items',
      textColor: 'text-red-700',
      icon: <Flame className="w-4 h-4 text-red-600" />,
    },
    {
      label: 'Security Sensitive',
      value: overview.securityBugs,
      subtitle: 'Sandboxed vulnerabilities',
      textColor: 'text-red-700',
      icon: <ShieldCheck className="w-4 h-4 text-red-600" />,
    },
    {
      label: 'Mean Time to Fix',
      value: `${overview.mttrHours}h`,
      subtitle: 'MTTR moving average',
      textColor: 'text-slate-900',
      icon: <Clock className="w-4 h-4 text-slate-700" />,
    },
    {
      label: 'SLA Compliance',
      value: `${overview.slaCompliancePercent}%`,
      subtitle: 'On-schedule delivery',
      textColor: 'text-emerald-700',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto p-6 space-y-6 font-sans select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Analytics & Telemetry
            </h2>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            MTTR, triage throughput, component reliability, and SLA compliance.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-mono border border-slate-200 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topMetricCards.map((card, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg border border-slate-200 bg-white"
          >
            <span className="text-[10px] font-mono text-slate-400 uppercase font-medium tracking-wider block">
              {card.label}
            </span>
            
            <div className={`text-2xl font-bold font-mono mt-1.5 tracking-tight ${card.textColor}`}>
              {card.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal truncate">
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Decision-Support Drill-Downs */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
        <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">
          Decision Support
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-semibold text-red-600 uppercase">1. Release Threat</span>
              <div className="font-medium text-xs text-slate-900 mt-0.5">What threatens release?</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {overview.blockerBugs} blockers on Critical Path.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('severity:blocker');
                setActiveView('table');
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded text-xs font-mono text-left flex items-center justify-between transition-colors"
            >
              <span>Inspect Blockers</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-semibold text-slate-600 uppercase">2. Triage Velocity</span>
              <div className="font-medium text-xs text-slate-900 mt-0.5">Is triage keeping up?</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Median lag: ~1.2 hrs. {overview.openBugs} active.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveView('triage');
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded text-xs font-mono text-left flex items-center justify-between transition-colors"
            >
              <span>Launch Triage</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-semibold text-slate-600 uppercase">3. Defect Aging</span>
              <div className="font-medium text-xs text-slate-900 mt-0.5">Are bugs aging?</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                MTTR {overview.mttrHours}h, {overview.slaCompliancePercent}% on-time SLA.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('priority:P1');
                setActiveView('table');
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded text-xs font-mono text-left flex items-center justify-between transition-colors"
            >
              <span>Filter P1 Queue</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-semibold text-red-600 uppercase">4. Security</span>
              <div className="font-medium text-xs text-slate-900 mt-0.5">Vulnerability status</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {overview.securityBugs} security issues isolated.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('security');
                setActiveView('table');
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded text-xs font-mono text-left flex items-center justify-between transition-colors"
            >
              <span>Audit CVEs</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Component Health Matrix & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Component Reliability Matrix */}
        <div className="lg:col-span-2 p-4 rounded-lg border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">
              Component Reliability
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Health Score
            </span>
          </div>

          <div className="space-y-2">
            {componentHealth.map((comp: any) => (
              <div
                key={comp.componentId}
                className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-slate-900 truncate">{comp.componentName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {comp.productName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-normal flex items-center gap-2 flex-wrap">
                    <span>Lead: <span className="text-slate-800 font-mono">{comp.leadName}</span></span>
                    <span className="text-slate-300">•</span>
                    <span>Open: <span className="text-slate-800 font-mono">{comp.openBugs}</span></span>
                    <span className="text-slate-300">•</span>
                    <span>Blockers: <span className="text-red-600 font-mono">{comp.blockers}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-slate-900">{comp.healthScore}%</div>
                  </div>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        comp.healthScore > 80
                          ? 'bg-emerald-600'
                          : comp.healthScore > 50
                          ? 'bg-slate-700'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${comp.healthScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution & Contributors */}
        <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-4">
          <div>
            <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider mb-3">
              Severity Distribution
            </h3>

            <div className="space-y-2.5">
              {Object.entries(severityBreakdown).map(([sev, count]: [string, any]) => {
                const pct = overview.totalBugs > 0 ? Math.round((count / overview.totalBugs) * 100) : 0;
                return (
                  <div key={sev} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="capitalize text-slate-700 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sev === 'blocker'
                              ? 'bg-red-600'
                              : sev === 'critical'
                              ? 'bg-red-500'
                              : sev === 'major'
                              ? 'bg-red-400'
                              : 'bg-slate-400'
                          }`}
                        />
                        {sev}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sev === 'blocker'
                            ? 'bg-red-600'
                            : sev === 'critical'
                            ? 'bg-red-500'
                            : sev === 'major'
                            ? 'bg-red-400'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">
              Top Fixers
            </h3>
            <div className="space-y-1">
              {leaderBoard.slice(0, 4).map((user: any) => {
                return (
                  <div
                    key={user.name}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-md border border-slate-100 text-xs font-mono"
                  >
                    <span className="text-slate-800 font-sans">{user.name.split(' ')[0]}</span>
                    <span className="text-slate-600 text-[11px]">
                      {user.resolved} resolved
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Audit Trail */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs text-slate-900 uppercase font-mono tracking-wider">
            Audit Trail Stream
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Immutable</span>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentAuditLogs.map((log: any) => (
            <button
              type="button"
              key={log.id}
              onClick={() => setSelectedBugId(log.bugId)}
              className="w-full text-left px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors font-mono"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-slate-400 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-slate-900 font-medium shrink-0">{log.actorName}</span>
                <span className="text-slate-600 truncate font-sans text-xs">
                  {log.changes.map((c: any) => `${c.field}: ${c.newValue}`).join(', ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {log.bugId}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
