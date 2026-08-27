import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { Milestone, Calendar, Milestone as MilestoneIcon } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.js';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { EmptyState } from '../common/EmptyState.js';

export const MilestoneView: React.FC = () => {
  const { products, bugs, setSelectedBugId, activeProductId, setIsCreateModalOpen } = useApp();

  const activeProducts = activeProductId
    ? products.filter(p => p.id === activeProductId)
    : products;

  if (activeProducts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
        <EmptyState
          icon={MilestoneIcon}
          title="No milestones found"
          description="No active products or delivery milestones are configured in this scope."
          actionLabel="Create Bug"
          onAction={() => setIsCreateModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto p-6 space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Milestone className="w-5 h-5 text-emerald-400" />
            <span>Milestone Roadmaps & Release Burndown</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            Track point releases, security patch targets, and blocker clearance.
          </p>
        </div>
      </div>

      {/* Product Milestones Cards */}
      <div className="space-y-8">
        {activeProducts.map(product => (
          <div key={product.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="font-bold text-sm text-slate-200">{product.name}</h3>
              <span className="text-[11px] text-slate-500 font-mono">({product.milestones.length} milestones)</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {product.milestones.map(m => {
                const milestoneBugs = bugs.filter(
                  b => b.productId === product.id && b.targetMilestone === m.name
                );
                const closedBugs = milestoneBugs.filter(b =>
                  ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status)
                );
                const blockerBugs = milestoneBugs.filter(
                  b => (b.severity === 'blocker' || b.priority === 'P1') && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status)
                );
                const totalHours = milestoneBugs.reduce((sum, b) => sum + b.estimatedHours, 0);
                const remainingHours = milestoneBugs.reduce((sum, b) => sum + b.remainingHours, 0);

                const percent =
                  milestoneBugs.length > 0
                    ? Math.round((closedBugs.length / milestoneBugs.length) * 100)
                    : 0;

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 shadow-lg flex flex-col justify-between space-y-4 transition-all duration-150"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-100 font-mono">{m.name}</h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              m.status === 'open'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Target: {m.targetDate}</span>
                        </div>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-400 mb-3 font-normal leading-relaxed">{m.description}</p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 font-sans">Completion Velocity</span>
                          <span className="text-emerald-400 font-bold">
                            {closedBugs.length} / {milestoneBugs.length} issues ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-850 shadow-inner">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-sans">Open Issues</span>
                          <span className="font-bold text-slate-200">
                            {milestoneBugs.length - closedBugs.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-sans">Active Blockers</span>
                          <span className={`font-bold ${blockerBugs.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {blockerBugs.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-sans">Remaining Work</span>
                          <span className="font-bold text-amber-300">
                            {remainingHours}h / {totalHours}h
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Linked Bugs */}
                    {milestoneBugs.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-500">
                          Target Bugs ({milestoneBugs.length})
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {milestoneBugs.map(bug => (
                            <div
                              key={bug.id}
                              onClick={() => setSelectedBugId(bug.id)}
                              className="p-2 bg-slate-850/80 hover:bg-slate-800 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors duration-150"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                                  #{bug.bugNumber}
                                </span>
                                <span className="text-slate-200 truncate font-sans">{bug.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <SeverityBadge severity={bug.severity} size="sm" />
                                <StatusBadge status={bug.status} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
