import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { GraphData, GraphNode } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  GitGraph,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

export const GraphView: React.FC = () => {
  const { setSelectedBugId, setIsCreateModalOpen } = useApp();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGraph();
      setGraphData(data);
    } catch (e) {
      console.error('Failed to fetch graph data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /*
   * The canvas could only be panned by dragging, so its entire content was
   * unreachable without a pointer. Arrow keys pan; Home recentres. The element
   * is a focusable group with a name, so it is announced and can be tabbed to.
   */
  const PAN_STEP = 60;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? PAN_STEP * 3 : PAN_STEP;
    const moves: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    if (e.key === 'Home') {
      e.preventDefault();
      setPan({ x: 0, y: 0 });
      return;
    }
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setPan(current => ({ x: current.x + move.x, y: current.y + move.y }));
  };

  const getNodePositions = (nodes: GraphNode[]) => {
    const levelGroups: Record<number, GraphNode[]> = {};
    nodes.forEach(n => {
      levelGroups[n.level] = levelGroups[n.level] || [];
      levelGroups[n.level].push(n);
    });

    const positions: Record<string, { x: number; y: number }> = {};
    const colWidth = 280;
    const rowHeight = 130;

    Object.entries(levelGroups).forEach(([levelStr, groupNodes]) => {
      const level = parseInt(levelStr, 10);
      groupNodes.forEach((node, idx) => {
        const x = 80 + level * colWidth;
        const y = 80 + idx * rowHeight + (level % 2 === 1 ? 30 : 0);
        positions[node.id] = { x, y };
      });
    });

    return positions;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-700 mr-2" />
        Generating interactive blocker topology...
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <EmptyState
          icon={GitGraph}
          title="No dependency links"
          description="There are currently no blocker chains or dependencies registered in this workspace."
          actionLabel="Create Bug"
          onAction={() => setIsCreateModalOpen(true)}
        />
      </div>
    );
  }

  const positions = getNodePositions(graphData.nodes);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      role="application"
      tabIndex={0}
      aria-label="Dependency graph canvas. Use the arrow keys to pan, Shift with an arrow key to pan faster, and Home to recentre."
      className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden relative select-none font-sans cursor-grab active:cursor-grabbing animate-in fade-in duration-200"
    >
      {/* Top Header & Graph Controls */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="text-slate-900 text-xs font-semibold">
            Blocker & Dependency Topology
          </span>
          {graphData.hasCycles ? (
            <span className="flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="w-3 h-3" /> Cycle Detected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid DAG
            </span>
          )}
        </div>

        {/* Legend & Zoom Toolbar */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-red-600" /> Blocker Path
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 border-t border-dashed border-slate-400" /> Duplicate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Resolved
            </span>
          </div>

          <div className="flex items-center rounded border border-slate-200 p-0.5 bg-white">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.15, 2))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.4))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 50, y: 50 });
              }}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchGraph}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
              title="Refresh Graph"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker
            id="arrow-blocks"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
          </marker>
          <marker
            id="arrow-duplicate"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Edges */}
        {graphData.edges.map(edge => {
          const sourcePos = positions[edge.source];
          const targetPos = positions[edge.target];
          if (!sourcePos || !targetPos) return null;

          const isCritical =
            graphData.criticalPath.includes(edge.source) && graphData.criticalPath.includes(edge.target);

          const startX = sourcePos.x + 200;
          const startY = sourcePos.y + 40;
          const endX = targetPos.x;
          const endY = targetPos.y + 40;

          const dx = endX - startX;
          const pathD = `M ${startX} ${startY} C ${startX + dx / 2} ${startY}, ${endX - dx / 2} ${endY}, ${endX} ${endY}`;

          return (
            <g key={edge.id}>
              <path
                d={pathD}
                fill="none"
                stroke={
                  edge.type === 'duplicate'
                    ? '#94a3b8'
                    : isCritical
                    ? '#dc2626'
                    : '#cbd5e1'
                }
                strokeWidth={isCritical ? 3 : 2}
                strokeDasharray={edge.type === 'duplicate' ? '4 4' : undefined}
                markerEnd={edge.type === 'duplicate' ? 'url(#arrow-duplicate)' : 'url(#arrow-blocks)'}
                className="transition-all"
              />
            </g>
          );
        })}

        {/* Nodes */}
        {graphData.nodes.map(node => {
          const pos = positions[node.id];
          if (!pos) return null;

          const isHovered = hoveredNodeId === node.id;
          const isCritical = graphData.criticalPath.includes(node.id);

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => setSelectedBugId(node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="cursor-pointer"
            >
              {/* Card Container */}
              <rect
                width="220"
                height="80"
                rx="12"
                fill="#ffffff"
                stroke={
                  isCritical
                    ? '#dc2626'
                    : isHovered
                    ? '#4f46e5'
                    : node.isResolved
                    ? '#16a34a'
                    : '#e2e8f0'
                }
                strokeWidth={isCritical || isHovered ? '2.5' : '1.5'}
                className="shadow-xs transition-all duration-150"
              />

              {/* Bug # and Severity */}
              <text x="14" y="24" fill="#0f172a" fontSize="12" fontWeight="bold" fontFamily="monospace">
                #{node.bugNumber}
              </text>
              <text x="75" y="24" fill="#64748b" fontSize="10" fontFamily="sans-serif">
                {node.severity.toUpperCase()} • {node.priority}
              </text>

              {/* Status Indicator circle */}
              <circle
                cx="195"
                cy="20"
                r="4"
                fill={node.isResolved ? '#16a34a' : node.status === 'IN_REVIEW' ? '#4f46e5' : '#64748b'}
              />

              {/* Title (Truncated) */}
              <text
                x="14"
                y="46"
                fill="#0f172a"
                fontSize="11"
                fontWeight="600"
                fontFamily="sans-serif"
                className="select-none"
              >
                {node.title.length > 25 ? `${node.title.substring(0, 24)}...` : node.title}
              </text>

              {/* Assignee & Blockers Count */}
              <text x="14" y="66" fill="#64748b" fontSize="10" fontFamily="monospace">
                👤 {node.assigneeName.split(' ')[0]}
              </text>

              {node.blockerCount > 0 && (
                <text x="130" y="66" fill="#dc2626" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  ⚠️ {node.blockerCount} blocker{node.blockerCount > 1 ? 's' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
