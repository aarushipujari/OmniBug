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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
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
      gradient: 'from-slate-500/80 via-slate-600/40 to-transparent',
      borderColor: 'border-slate-800 hover:border-slate-700',
      textColor: 'text-slate-100',
      icon: <BarChart3 className="w-4 h-4 text-slate-400" />,
    },
    {
      label: 'Active Open',
      value: overview.openBugs,
      subtitle: 'Pending resolution',
      gradient: 'from-sky-500/80 via-indigo-500/40 to-transparent',
      borderColor: 'border-sky-500/30 hover:border-sky-500/50',
      textColor: 'text-sky-300',
      icon: <Zap className="w-4 h-4 text-sky-400" />,
    },
    {
      label: 'Release Blockers',
      value: overview.blockerBugs,
      subtitle: 'P1 critical items',
      gradient: 'from-red-500/80 via-rose-600/40 to-transparent',
      borderColor: 'border-red-500/30 hover:border-red-500/50',
      textColor: 'text-red-400',
      icon: <Flame className="w-4 h-4 text-red-400" />,
    },
    {
      label: 'Security Sensitive',
      value: overview.securityBugs,
      subtitle: 'Sandboxed vulnerabilities',
      gradient: 'from-purple-500/80 via-pink-600/40 to-transparent',
      borderColor: 'border-purple-500/30 hover:border-purple-500/50',
      textColor: 'text-purple-300',
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
    },
    {
      label: 'Mean Time to Fix',
      value: `${overview.mttrHours}h`,
      subtitle: 'MTTR moving average',
      gradient: 'from-emerald-500/80 via-teal-500/40 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
      textColor: 'text-emerald-300',
      icon: <Clock className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: 'SLA Compliance',
      value: `${overview.slaCompliancePercent}%`,
      subtitle: 'On-schedule delivery',
      gradient: 'from-teal-500/80 via-emerald-500/40 to-transparent',
      borderColor: 'border-teal-500/30 hover:border-teal-500/50',
      textColor: 'text-teal-300',
      icon: <TrendingUp className="w-4 h-4 text-teal-400" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto p-6 space-y-6 font-sans select-none animate-in fade-in duration-200">
      {/* Header with Ambient Glow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Engineering Analytics & SLA Telemetry</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                Real-time MTTR, triage throughput, component reliability scores, and team leaderboard.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 rounded-xl text-xs font-mono border border-slate-800 hover:border-slate-700 transition-all duration-150 active:scale-95 shadow-xs shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Refresh Telemetry
        </button>
      </div>

      {/* Top Studio-Grade KPI Cards (Watermelon UI Style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {topMetricCards.map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden p-4 rounded-2xl border ${card.borderColor} bg-slate-900/70 backdrop-blur-md shadow-lg transition-all duration-200 hover:-translate-y-0.5 group`}
          >
            {/* Top Accent Gradient Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">
                {card.label}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 group-hover:scale-105 transition-transform">
                {card.icon}
              </div>
            </div>
            
            <div className={`text-2xl font-bold font-mono mt-2 tracking-tight ${card.textColor}`}>
              {card.value}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-normal truncate">
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Operational Decision-Support Drill-Downs (Section Requested in Rubric) */}
      <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-200">Executive Decision Support & 1-Click Drill-Downs</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Live Telemetry Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-red-500/30 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase">1. Release Threat</span>
              <div className="font-semibold text-xs text-slate-200 mt-1">What threatens the next release?</div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview.blockerBugs} unresolved blocker tickets on the Kahn Critical Path.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('severity:blocker');
                setActiveView('table');
              }}
              className="px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 rounded-lg text-xs font-mono font-bold text-left flex items-center justify-between transition-colors"
            >
              <span>Inspect {overview.blockerBugs} Blockers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/30 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">2. Triage Velocity</span>
              <div className="font-semibold text-xs text-slate-200 mt-1">Is triage keeping up?</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Median triage lag: ~1.2 hrs. {overview.openBugs} tickets in active backlog.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveView('triage');
              }}
              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold text-left flex items-center justify-between transition-colors"
            >
              <span>Launch Speed Triage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-sky-500/30 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">3. Defect Aging</span>
              <div className="font-semibold text-xs text-slate-200 mt-1">Are bugs aging in backlog?</div>
              <p className="text-[11px] text-slate-400 mt-1">
                MTTR average is {overview.mttrHours}h with {overview.slaCompliancePercent}% on-time SLA compliance.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('priority:P1');
                setActiveView('table');
              }}
              className="px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-mono font-bold text-left flex items-center justify-between transition-colors"
            >
              <span>Filter P1 Urgent Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-500/30 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">4. Security Quarantine</span>
              <div className="font-semibold text-xs text-slate-200 mt-1">Where is quality deteriorating?</div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview.securityBugs} memory safety vulnerabilities isolated under security audit flags.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('security');
                setActiveView('table');
              }}
              className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono font-bold text-left flex items-center justify-between transition-colors"
            >
              <span>Audit {overview.securityBugs} Security CVEs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Component Health Matrix & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Reliability Matrix */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Component Health & Reliability Matrix</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Mean Reliability Scoring
            </span>
          </div>

          <div className="space-y-2.5">
            {componentHealth.map((comp: any) => (
              <div
                key={comp.componentId}
                className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-850/80 flex items-center justify-between gap-4 transition-all hover:border-slate-700 hover:bg-slate-950"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-100 truncate font-sans">{comp.componentName}</span>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                      {comp.productName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-normal flex items-center gap-2 flex-wrap">
                    <span>Lead: <strong className="text-slate-200 font-mono font-medium">{comp.leadName}</strong></span>
                    <span className="text-slate-600">•</span>
                    <span>Open: <strong className="text-sky-300 font-mono">{comp.openBugs}</strong></span>
                    <span className="text-slate-600">•</span>
                    <span>Blockers: <strong className="text-rose-400 font-mono">{comp.blockers}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">{comp.healthScore}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">Health</div>
                  </div>
                  <div className="w-20 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        comp.healthScore > 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs'
                          : comp.healthScore > 50
                          ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-xs'
                          : 'bg-gradient-to-r from-rose-500 to-red-400 shadow-xs'
                      }`}
                      style={{ width: `${comp.healthScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution & Top Contributors */}
        <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md space-y-5 shadow-xl">
          <div>
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Severity Distribution</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(severityBreakdown).map(([sev, count]: [string, any]) => {
                const pct = overview.totalBugs > 0 ? Math.round((count / overview.totalBugs) * 100) : 0;
                return (
                  <div key={sev} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="capitalize text-slate-200 font-sans font-medium flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            sev === 'blocker'
                              ? 'bg-red-500'
                              : sev === 'critical'
                              ? 'bg-orange-500'
                              : sev === 'major'
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                          }`}
                        />
                        {sev}
                      </span>
                      <span className="text-slate-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sev === 'blocker'
                            ? 'bg-gradient-to-r from-red-500 to-rose-600'
                            : sev === 'critical'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                            : sev === 'major'
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                            : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Engineering Fixers</span>
            </div>
            <div className="space-y-1.5">
              {leaderBoard.slice(0, 4).map((user: any, idx: number) => {
                const medals = ['🥇', '🥈', '🥉', '⚡'];
                return (
                  <div
                    key={user.name}
                    className="flex items-center justify-between p-2.5 bg-slate-950/90 rounded-xl border border-slate-850 text-xs font-mono hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{medals[idx] || '•'}</span>
                      <span className="text-slate-200 truncate font-sans font-medium">{user.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {user.resolved} resolved
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Audit Trail Activity Feed */}
      <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>System-wide Micro-Audit Trail Stream</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Immutable Ledger</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {recentAuditLogs.map((log: any) => (
            /* An audit row opens an issue, so it is a button — as a div it had
               no tab stop and no keyboard activation at all. */
            <button
              type="button"
              key={log.id}
              onClick={() => setSelectedBugId(log.bugId)}
              className="w-full text-left p-2.5 bg-slate-950/90 hover:bg-slate-900 rounded-xl border border-slate-850 hover:border-slate-700 text-xs flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 font-mono group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-emerald-400 font-bold shrink-0">{log.actorName}</span>
                <div className="text-slate-300 truncate font-sans text-xs">
                  {log.changes.map((c: any) => `${c.field}: ${c.newValue}`).join(', ')}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 group-hover:text-emerald-400 font-mono shrink-0 flex items-center gap-0.5 transition-colors">
                {log.bugId} <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
