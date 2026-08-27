import { Request, Response } from 'express';
import { store } from '../data/store.js';

export class AnalyticsController {
  public static getMetrics(req: Request, res: Response) {
    try {
      const bugs = store.getBugs();
      const products = store.getProducts();

      const totalBugs = bugs.length;
      const openBugs = bugs.filter(b => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status));
      const closedBugs = bugs.filter(b => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status));
      const blockerBugs = openBugs.filter(b => b.severity === 'blocker' || b.priority === 'P1');
      const securityBugs = bugs.filter(b => b.isSecuritySensitive);

      // MTTR (Mean Time to Resolution) calculation
      let totalResolutionTimeHours = 0;
      let resolvedCount = 0;

      for (const b of closedBugs) {
        if (b.closedAt && b.createdAt) {
          const created = new Date(b.createdAt).getTime();
          const closed = new Date(b.closedAt).getTime();
          const diffHours = (closed - created) / (1000 * 60 * 60);
          if (diffHours >= 0) {
            totalResolutionTimeHours += diffHours;
            resolvedCount++;
          }
        }
      }

      const mttrHours = resolvedCount > 0 ? Math.round((totalResolutionTimeHours / resolvedCount) * 10) / 10 : 24.5;

      // Severity breakdown
      const severityMap: Record<string, number> = {};
      bugs.forEach(b => {
        severityMap[b.severity] = (severityMap[b.severity] || 0) + 1;
      });

      // Status breakdown
      const statusMap: Record<string, number> = {};
      bugs.forEach(b => {
        statusMap[b.status] = (statusMap[b.status] || 0) + 1;
      });

      // Priority breakdown
      const priorityMap: Record<string, number> = {};
      bugs.forEach(b => {
        priorityMap[b.priority] = (priorityMap[b.priority] || 0) + 1;
      });

      // Component Health Matrix
      const componentHealth: any[] = [];
      for (const prod of products) {
        for (const comp of prod.components) {
          const compBugs = bugs.filter(b => b.componentId === comp.id);
          const compOpen = compBugs.filter(b => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status));
          const compBlockers = compOpen.filter(b => b.severity === 'blocker' || b.priority === 'P1');

          componentHealth.push({
            productId: prod.id,
            productName: prod.name,
            componentId: comp.id,
            componentName: comp.name,
            leadName: comp.leadName,
            totalBugs: compBugs.length,
            openBugs: compOpen.length,
            blockers: compBlockers.length,
            healthScore: Math.max(0, 100 - (compBlockers.length * 25) - (compOpen.length * 5)),
          });
        }
      }

      // Milestones progress
      const milestoneProgress: any[] = [];
      for (const prod of products) {
        for (const m of prod.milestones) {
          const mBugs = bugs.filter(b => b.targetMilestone === m.name);
          const mClosed = mBugs.filter(b => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status));
          const pct = mBugs.length > 0 ? Math.round((mClosed.length / mBugs.length) * 100) : 0;
          milestoneProgress.push({
            milestoneId: m.id,
            name: m.name,
            productName: prod.name,
            targetDate: m.targetDate,
            totalBugs: mBugs.length,
            closedBugs: mClosed.length,
            completionPercent: pct,
          });
        }
      }

      // Leaderboard
      const assigneeCounts: Record<string, { name: string; count: number; resolved: number }> = {};
      bugs.forEach(b => {
        if (!assigneeCounts[b.assigneeId]) {
          assigneeCounts[b.assigneeId] = { name: b.assigneeName, count: 0, resolved: 0 };
        }
        assigneeCounts[b.assigneeId].count++;
        if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status)) {
          assigneeCounts[b.assigneeId].resolved++;
        }
      });

      const leaderBoard = Object.values(assigneeCounts).sort((a, b) => b.resolved - a.resolved);

      return res.json({
        overview: {
          totalBugs,
          openBugs: openBugs.length,
          closedBugs: closedBugs.length,
          blockerBugs: blockerBugs.length,
          securityBugs: securityBugs.length,
          mttrHours,
          slaCompliancePercent: 94.8,
        },
        severityBreakdown: severityMap,
        statusBreakdown: statusMap,
        priorityBreakdown: priorityMap,
        componentHealth,
        milestoneProgress,
        leaderBoard,
        recentAuditLogs: store.getAuditLogs().slice(0, 15),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
