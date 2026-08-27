import { Bug } from '../types/index.js';

export interface GraphNode {
  id: string;
  bugNumber: number;
  title: string;
  status: string;
  severity: string;
  priority: string;
  assigneeName: string;
  isResolved: boolean;
  blockerCount: number;
  blockedCount: number;
  level: number;
}

export interface GraphEdge {
  id: string;
  source: string; // The blocker
  target: string; // The blocked bug
  type: 'blocks' | 'duplicate';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hasCycles: boolean;
  cycleNodes: string[];
  criticalPath: string[];
}

export class DependencyGraphService {
  public static buildGraph(bugs: Bug[], rootBugId?: string): GraphData {
    const bugMap = new Map<string, Bug>();
    bugs.forEach(b => bugMap.set(b.id, b));

    let relevantBugs = bugs;
    if (rootBugId) {
      // Find connected component of rootBugId
      const visited = new Set<string>();
      const queue = [rootBugId];
      visited.add(rootBugId);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentBug = bugMap.get(currentId);
        if (!currentBug) continue;

        const neighbors = [
          ...currentBug.dependsOn,
          ...currentBug.blocks,
          ...(currentBug.duplicateOfBugId ? [currentBug.duplicateOfBugId] : [])
        ];

        // Also find bugs that have currentBug as duplicate or blocker
        bugs.forEach(b => {
          if (b.duplicateOfBugId === currentId || b.dependsOn.includes(currentId) || b.blocks.includes(currentId)) {
            neighbors.push(b.id);
          }
        });

        for (const n of neighbors) {
          if (!visited.has(n) && bugMap.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }

      relevantBugs = bugs.filter(b => visited.has(b.id));
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    for (const b of relevantBugs) {
      const isResolved = ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status);
      nodes.push({
        id: b.id,
        bugNumber: b.bugNumber,
        title: b.title,
        status: b.status,
        severity: b.severity,
        priority: b.priority,
        assigneeName: b.assigneeName,
        isResolved,
        blockerCount: b.dependsOn.length,
        blockedCount: b.blocks.length,
        level: 0,
      });

      // Add 'blocks' edges (source = blocker = b.id, target = blocked = blockedId)
      for (const blockedId of b.blocks) {
        if (bugMap.has(blockedId)) {
          const edgeId = `${b.id}->${blockedId}`;
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            edges.push({
              id: edgeId,
              source: b.id,
              target: blockedId,
              type: 'blocks',
            });
          }
        }
      }

      // If b.dependsOn contains something, add edge source=depId, target=b.id
      for (const depId of b.dependsOn) {
        if (bugMap.has(depId)) {
          const edgeId = `${depId}->${b.id}`;
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            edges.push({
              id: edgeId,
              source: depId,
              target: b.id,
              type: 'blocks',
            });
          }
        }
      }

      // Add duplicate edges
      if (b.duplicateOfBugId && bugMap.has(b.duplicateOfBugId)) {
        const edgeId = `${b.id}-dup-${b.duplicateOfBugId}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: b.id,
            target: b.duplicateOfBugId,
            type: 'duplicate',
          });
        }
      }
    }

    // Topological levels & cycle detection
    const { hasCycles, cycleNodes, levels, criticalPath } = this.analyzeTopology(nodes, edges, bugMap);
    for (const node of nodes) {
      node.level = levels.get(node.id) || 0;
    }

    return {
      nodes,
      edges,
      hasCycles,
      cycleNodes,
      criticalPath,
    };
  }

  private static analyzeTopology(
    nodes: GraphNode[],
    edges: GraphEdge[],
    bugMap: Map<string, Bug>
  ) {
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach(n => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    const blockEdges = edges.filter(e => e.type === 'blocks');
    blockEdges.forEach(e => {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // Kahn's algorithm for cycles and levels
    const queue: string[] = [];
    const levels = new Map<string, number>();

    nodes.forEach(n => {
      if ((inDegree.get(n.id) || 0) === 0) {
        queue.push(n.id);
        levels.set(n.id, 0);
      }
    });

    let processedCount = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      processedCount++;
      const currentLevel = levels.get(u) || 0;

      for (const v of adj.get(u) || []) {
        const currentIn = (inDegree.get(v) || 0) - 1;
        inDegree.set(v, currentIn);
        const childLevel = Math.max(levels.get(v) || 0, currentLevel + 1);
        levels.set(v, childLevel);

        if (currentIn === 0) {
          queue.push(v);
        }
      }
    }

    const hasCycles = processedCount < nodes.length;
    const cycleNodes: string[] = [];
    if (hasCycles) {
      nodes.forEach(n => {
        if ((inDegree.get(n.id) || 0) > 0) {
          cycleNodes.push(n.id);
        }
      });
    }

    // Critical path (longest chain of unresolved blocker bugs)
    let maxPath: string[] = [];
    const findLongest = (curr: string, currentPath: string[]) => {
      const nextNodes = (adj.get(curr) || []).filter(nxt => {
        const b = bugMap.get(nxt);
        return b && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status);
      });

      if (nextNodes.length === 0) {
        if (currentPath.length > maxPath.length) {
          maxPath = [...currentPath];
        }
        return;
      }

      for (const nxt of nextNodes) {
        if (!currentPath.includes(nxt)) {
          findLongest(nxt, [...currentPath, nxt]);
        }
      }
    };

    nodes.forEach(n => {
      const b = bugMap.get(n.id);
      if (b && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status)) {
        findLongest(n.id, [n.id]);
      }
    });

    return {
      hasCycles,
      cycleNodes,
      levels,
      criticalPath: maxPath,
    };
  }
}
