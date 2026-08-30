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
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
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
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto p-6 space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Milestones & Releases
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Track release targets, burndown velocity, and blocker clearance.
          </p>
        </div>
      </div>

      {/* Product Milestones Cards */}
      <div className="space-y-6">
        {activeProducts.map(product => (
          <div key={product.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-900">{product.name}</h3>
              <span className="text-[11px] text-slate-400 font-mono">({product.milestones.length} milestones)</span>
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
                    className="p-4 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 font-mono">{m.name}</h4>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium uppercase ${
                              m.status === 'open'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{m.targetDate}</span>
                        </div>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-500 mb-2 font-normal">{m.description}</p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Completion</span>
                          <span className="text-slate-900 font-semibold">
                            {closedBugs.length} / {milestoneBugs.length} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-md border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-sans">Open</span>
                          <span className="font-semibold text-slate-900">
                            {milestoneBugs.length - closedBugs.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-sans">Blockers</span>
                          <span className={`font-semibold ${blockerBugs.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {blockerBugs.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-sans">Remaining</span>
                          <span className="font-semibold text-slate-900">
                            {remainingHours}h / {totalHours}h
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Linked Bugs */}
                    {milestoneBugs.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="text-[10px] uppercase font-mono font-medium text-slate-400">
                          Issues ({milestoneBugs.length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {milestoneBugs.map(bug => (
                            <button
                              type="button"
                              key={bug.id}
                              onClick={() => setSelectedBugId(bug.id)}
                              className="w-full text-left p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-xs flex items-center justify-between cursor-pointer transition-colors border border-slate-100"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-slate-900 text-[11px]">
                                  #{bug.bugNumber}
                                </span>
                                <span className="text-slate-700 truncate font-sans">{bug.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <SeverityBadge severity={bug.severity} size="sm" />
                                <StatusBadge status={bug.status} size="sm" />
                              </div>
                            </button>
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
