'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type NodeTypes,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {
  Box,
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Package,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { OrdersSchema, SplitPartsSchema } from '@/types/schemas';
import type { UserProfile } from '@/domain/users/types';
import type { PartAssignmentWithPart } from '@/domain/collaboration/service';
import { SubcontractorAssignDialog } from './SubcontractorAssignDialog';

/* ── Types ─────────────────────────────────────────────────────────── */

/* ── Status colours ────────────────────────────────────────────────── */

const STATUS_COLORS: Record<
  string,
  { border: string; bg: string; text: string; dot: string }
> = {
  'Not Started': {
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  'In Progress': {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  Completed: {
    border: 'border-green-400',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  Shipped: {
    border: 'border-[#e87722]',
    bg: 'bg-orange-50',
    text: 'text-[#e87722]',
    dot: 'bg-[#e87722]',
  },
  Delivered: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
};

const MANUFACTURER_PALETTE = [
  {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
    label: 'text-blue-800',
  },
  {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
    label: 'text-purple-800',
  },
  {
    border: 'border-teal-400',
    bg: 'bg-teal-50',
    dot: 'bg-teal-500',
    label: 'text-teal-800',
  },
  {
    border: 'border-pink-400',
    bg: 'bg-pink-50',
    dot: 'bg-pink-500',
    label: 'text-pink-800',
  },
  {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    label: 'text-amber-800',
  },
  {
    border: 'border-cyan-400',
    bg: 'bg-cyan-50',
    dot: 'bg-cyan-500',
    label: 'text-cyan-800',
  },
];

const PART_STATUSES = [
  'Not Started',
  'In Progress',
  'Completed',
  'Shipped',
] as const;

function getNextPartStatus(current: string): string | null {
  const idx = PART_STATUSES.indexOf(current as (typeof PART_STATUSES)[number]);
  return idx >= 0 && idx < PART_STATUSES.length - 1
    ? PART_STATUSES[idx + 1]
    : null;
}

/* ── Node data types ─────────────────────────────────────────────── */

interface PartNodeData {
  label: string;
  status: string;
  manufacturerName?: string;
  hierarchy: string[];
  partId: string;
  assignmentId?: string;
  [key: string]: unknown;
}

interface RootNodeData {
  label: string;
  manufacturerName: string;
  totalParts: number;
  assignedParts: number;
  [key: string]: unknown;
}

interface ManufacturerNodeData {
  label: string;
  partCount: number;
  completedCount: number;
  colorIndex: number;
  [key: string]: unknown;
}

interface UnassignedGroupData {
  label: string;
  count: number;
  [key: string]: unknown;
}

interface Collaborator {
  manufacturerId: string;
  manufacturerName: string;
  partCount: number;
  completedCount: number;
}

interface CollaborationResponse {
  assignments: PartAssignmentWithPart[];
  splitParts: SplitPartsSchema[];
  collaborators: Collaborator[];
  isLeadManufacturer: boolean;
  currentUserId: string;
}

/* ── Custom Nodes ──────────────────────────────────────────────────── */

function RootNode({ data }: { data: RootNodeData }) {
  return (
    <div className="rounded-xl border-2 border-[#e87722] bg-gradient-to-b from-orange-50 to-white px-6 py-4 shadow-lg min-w-[200px] text-center">
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#e87722] !w-3 !h-3"
      />
      <Building2 className="h-6 w-6 text-[#e87722] mx-auto mb-1" />
      <p className="font-bold text-sm text-[#0c2340]">
        {data.manufacturerName}
      </p>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
        Lead · Final Assembly
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {data.assignedParts}/{data.totalParts} parts assigned
      </p>
    </div>
  );
}

function ManufacturerNode({ data }: { data: ManufacturerNodeData }) {
  const palette =
    MANUFACTURER_PALETTE[data.colorIndex % MANUFACTURER_PALETTE.length];
  return (
    <div
      className={cn(
        'rounded-lg border-2 px-5 py-3 shadow-md min-w-[160px] text-center',
        palette.border,
        palette.bg
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2.5 !h-2.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-2.5 !h-2.5"
      />
      <p className={cn('font-semibold text-sm', palette.label)}>
        {data.label}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {data.completedCount}/{data.partCount} done
      </p>
    </div>
  );
}

function UnassignedGroupNode({ data }: { data: UnassignedGroupData }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/80 px-5 py-3 shadow-sm min-w-[140px] text-center">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-300 !w-2.5 !h-2.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-300 !w-2.5 !h-2.5"
      />
      <p className="font-semibold text-sm text-gray-500">Unassigned</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {data.count} parts
      </p>
    </div>
  );
}

function PartNode({ data }: { data: PartNodeData }) {
  const statusStyle =
    STATUS_COLORS[data.status] ?? STATUS_COLORS['Not Started'];
  return (
    <div
      className={cn(
        'rounded-lg border-2 px-4 py-2.5 shadow-sm min-w-[130px] cursor-pointer transition-shadow hover:shadow-md',
        statusStyle.border,
        statusStyle.bg
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2 !h-2"
      />
      <div className="flex items-center gap-2">
        <div
          className={cn('h-2.5 w-2.5 rounded-full shrink-0', statusStyle.dot)}
        />
        <p
          className={cn(
            'text-xs font-semibold truncate max-w-[120px]',
            statusStyle.text
          )}
        >
          {data.label}
        </p>
      </div>
      {data.manufacturerName && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {data.manufacturerName}
        </p>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  rootNode: RootNode,
  manufacturerNode: ManufacturerNode,
  unassignedGroup: UnassignedGroupNode,
  partNode: PartNode,
};

/* ── Dagre layout ──────────────────────────────────────────────────── */

function layoutTree(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    const width =
      node.type === 'rootNode' ? 220 : node.type === 'partNode' ? 160 : 180;
    const height =
      node.type === 'rootNode' ? 100 : node.type === 'partNode' ? 60 : 70;
    g.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const width =
      node.type === 'rootNode' ? 220 : node.type === 'partNode' ? 160 : 180;
    const height =
      node.type === 'rootNode' ? 100 : node.type === 'partNode' ? 60 : 70;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });
}

/* ── Props ─────────────────────────────────────────────────────────── */

interface AssemblyCollaborationTabProps {
  order: OrdersSchema;
  userData: UserProfile | null;
}

/* ── Main Component ────────────────────────────────────────────────── */

export function AssemblyCollaborationTab({
  order,
  userData,
}: AssemblyCollaborationTabProps) {
  const [data, setData] = useState<CollaborationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(
    new Set()
  );
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [inspectedPart, setInspectedPart] = useState<PartNodeData | null>(
    null
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const isLeadManufacturer = userData?.id === order.manufacturer;
  const isAdmin = userData?.accountType === 'admin';
  const isCreator = userData?.id === order.creator;
  const canAssign = isLeadManufacturer || isAdmin;
  const canUpdateStatus = !isCreator;

  const assignmentByPartId = useMemo(() => {
    const map = new Map<string, PartAssignmentWithPart>();
    if (!data) return map;
    data.assignments.forEach((assignment) => {
      map.set(assignment.part_id, assignment);
    });
    return map;
  }, [data]);

  const selectedAssignments = useMemo(() => {
    if (!data) return [] as PartAssignmentWithPart[];
    return Array.from(selectedPartIds)
      .map((partId) => assignmentByPartId.get(partId))
      .filter((assignment): assignment is PartAssignmentWithPart => Boolean(assignment));
  }, [data, selectedPartIds, assignmentByPartId]);

  const bulkAdvanceTargets = useMemo(() => {
    if (!data) return [] as Array<{ assignmentId: string; nextStatus: string }>;

    return selectedAssignments
      .filter((assignment) => {
        const canTouch =
          canAssign || assignment.assigned_manufacturer === data.currentUserId;
        return canTouch && Boolean(getNextPartStatus(assignment.status));
      })
      .map((assignment) => ({
        assignmentId: assignment.id,
        nextStatus: getNextPartStatus(assignment.status) as string,
      }));
  }, [data, selectedAssignments, canAssign]);

  /* ── Fetch collaboration data ──────────────────────────────────── */

  const fetchData = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/collaboration`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as CollaborationResponse;
      setData(json);
    } catch {
      if (!silent) {
        toast.error('Failed to load collaboration data');
      }
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      void fetchData(true);
    }, 8000);

    return () => clearInterval(timer);
  }, [fetchData]);

  /* ── Build React Flow graph ──────────────────────────────────── */

  useEffect(() => {
    if (!data) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Lookup: partId → assignment
    const assignmentByPartId = new Map<string, PartAssignmentWithPart>();
    data.assignments.forEach((a) => assignmentByPartId.set(a.part_id, a));

    // Root node
    const rootId = 'root';
    newNodes.push({
      id: rootId,
      type: 'rootNode',
      position: { x: 0, y: 0 },
      data: {
        label: order.manufacturer_name ?? 'Lead Manufacturer',
        manufacturerName: order.manufacturer_name ?? 'Lead Manufacturer',
        totalParts: data.splitParts.length,
        assignedParts: data.assignments.length,
      } satisfies RootNodeData,
    });

    // Group parts by manufacturer
    const mfgGroups = new Map<
      string,
      {
        name: string;
        parts: SplitPartsSchema[];
        assignments: PartAssignmentWithPart[];
      }
    >();
    const unassigned: SplitPartsSchema[] = [];

    data.splitParts.forEach((part) => {
      const assignment = assignmentByPartId.get(part.id);
      if (assignment?.assigned_manufacturer) {
        const key = assignment.assigned_manufacturer;
        if (!mfgGroups.has(key)) {
          mfgGroups.set(key, {
            name: assignment.manufacturer_name ?? 'Unknown',
            parts: [],
            assignments: [],
          });
        }
        mfgGroups.get(key)!.parts.push(part);
        mfgGroups.get(key)!.assignments.push(assignment);
      } else {
        unassigned.push(part);
      }
    });

    // Manufacturer group nodes + their part children
    let colorIdx = 0;
    mfgGroups.forEach((group, mfgId) => {
      const groupNodeId = `mfg-${mfgId}`;
      const completedCount = group.assignments.filter(
        (a) => a.status === 'Completed' || a.status === 'Shipped'
      ).length;

      newNodes.push({
        id: groupNodeId,
        type: 'manufacturerNode',
        position: { x: 0, y: 0 },
        data: {
          label: group.name,
          partCount: group.parts.length,
          completedCount,
          colorIndex: colorIdx,
        } satisfies ManufacturerNodeData,
      });

      newEdges.push({
        id: `e-root-${groupNodeId}`,
        source: rootId,
        target: groupNodeId,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        type: 'smoothstep',
      });

      group.parts.forEach((part) => {
        const assignment = assignmentByPartId.get(part.id);
        const partNodeId = `part-${part.id}`;
        newNodes.push({
          id: partNodeId,
          type: 'partNode',
          position: { x: 0, y: 0 },
          data: {
            label: part.name,
            status: assignment?.status ?? 'Not Started',
            manufacturerName: group.name,
            hierarchy: part.hierarchy ?? [],
            partId: part.id,
            assignmentId: assignment?.id,
          } satisfies PartNodeData,
        });

        newEdges.push({
          id: `e-${groupNodeId}-${partNodeId}`,
          source: groupNodeId,
          target: partNodeId,
          style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
          type: 'smoothstep',
        });
      });

      colorIdx++;
    });

    // Unassigned group
    if (unassigned.length > 0) {
      const unassignedId = 'unassigned';
      newNodes.push({
        id: unassignedId,
        type: 'unassignedGroup',
        position: { x: 0, y: 0 },
        data: {
          label: 'Unassigned',
          count: unassigned.length,
        } satisfies UnassignedGroupData,
      });

      newEdges.push({
        id: `e-root-${unassignedId}`,
        source: rootId,
        target: unassignedId,
        style: {
          stroke: '#d1d5db',
          strokeWidth: 2,
          strokeDasharray: '6 3',
        },
        type: 'smoothstep',
      });

      unassigned.forEach((part) => {
        const partNodeId = `part-${part.id}`;
        newNodes.push({
          id: partNodeId,
          type: 'partNode',
          position: { x: 0, y: 0 },
          data: {
            label: part.name,
            status: 'Not Started',
            hierarchy: part.hierarchy ?? [],
            partId: part.id,
          } satisfies PartNodeData,
        });

        newEdges.push({
          id: `e-${unassignedId}-${partNodeId}`,
          source: unassignedId,
          target: partNodeId,
          style: {
            stroke: '#e5e7eb',
            strokeWidth: 1.5,
            strokeDasharray: '4 2',
          },
          type: 'smoothstep',
        });
      });
    }

    const laidOut = layoutTree(newNodes, newEdges);
    setNodes(laidOut);
    setEdges(newEdges);
  }, [data, order.manufacturer_name, setNodes, setEdges]);

  /* ── Handlers ────────────────────────────────────────────────── */

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'partNode') {
        setInspectedPart(node.data as PartNodeData);
      }
    },
    []
  );

  const handleStatusChange = async (
    assignmentId: string,
    newStatus: string
  ) => {
    try {
      const res = await fetch(
        `/api/orders/${order.id}/collaboration/${assignmentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Status updated to ${newStatus}`);
      setInspectedPart(null);
      await fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      const res = await fetch(
        `/api/orders/${order.id}/collaboration/${assignmentId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to remove');
      toast.success('Part unassigned');
      setInspectedPart(null);
      await fetchData();
    } catch {
      toast.error('Failed to unassign part');
    }
  };

  const handleAssigned = () => {
    setSelectedPartIds(new Set());
    setAssignDialogOpen(false);
    fetchData();
  };

  const handleBulkAdvanceSelected = async () => {
    if (bulkAdvanceTargets.length === 0) {
      toast.info('No selected parts can be advanced right now.');
      return;
    }

    try {
      const results = await Promise.all(
        bulkAdvanceTargets.map(async (target) => {
          const res = await fetch(
            `/api/orders/${order.id}/collaboration/${target.assignmentId}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: target.nextStatus }),
            }
          );
          return res.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `Advanced ${successCount} part${successCount === 1 ? '' : 's'}.`
        );
      }
      if (failedCount > 0) {
        toast.error(
          `Failed to advance ${failedCount} part${failedCount === 1 ? '' : 's'}.`
        );
      }

      await fetchData();
    } catch {
      toast.error('Failed to apply bulk status updates.');
    }
  };

  const handleBulkUnassignSelected = async () => {
    if (!canAssign) return;

    if (selectedAssignments.length === 0) {
      toast.info('No assigned parts selected to unassign.');
      return;
    }

    try {
      const results = await Promise.all(
        selectedAssignments.map(async (assignment) => {
          const res = await fetch(
            `/api/orders/${order.id}/collaboration/${assignment.id}`,
            { method: 'DELETE' }
          );
          return res.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `Unassigned ${successCount} part${successCount === 1 ? '' : 's'}.`
        );
      }
      if (failedCount > 0) {
        toast.error(
          `Failed to unassign ${failedCount} part${failedCount === 1 ? '' : 's'}.`
        );
      }

      await fetchData();
    } catch {
      toast.error('Failed to unassign selected parts.');
    }
  };

  const togglePartSelection = (partId: string) => {
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  /* ── Loading state ──────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading collaboration data…
        </span>
      </div>
    );
  }

  if (!data || data.splitParts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Box className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No split parts available for this order yet. Upload and split a CAD
            file to enable collaboration.
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Action bar */}
      {(canAssign || canUpdateStatus) && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Select parts to run bulk actions.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedPartIds.size} selected · {selectedAssignments.length} assigned ·{' '}
              {bulkAdvanceTargets.length} can advance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkAdvanceTargets.length === 0}
              onClick={handleBulkAdvanceSelected}
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Advance Selected ({bulkAdvanceTargets.length})
            </Button>
            {canAssign && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selectedAssignments.length === 0}
                  onClick={handleBulkUnassignSelected}
                >
                  <X className="h-4 w-4 mr-1" />
                  Unassign Selected ({selectedAssignments.length})
                </Button>
                <Button
                  size="sm"
                  className="bg-[#e87722] hover:bg-[#d06a1e] text-white"
                  disabled={selectedPartIds.size === 0}
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign ({selectedPartIds.size})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* React Flow tree diagram */}
      <div className="h-[600px] rounded-xl border bg-white shadow-sm overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#f1f5f9" />
          <Controls position="bottom-left" />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            position="bottom-right"
            style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
          />

          {/* Legend */}
          <Panel position="top-right">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border shadow-sm p-3 text-xs space-y-2 max-w-[180px]">
              <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              {Object.entries(STATUS_COLORS).map(([label, style]) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={cn('h-2.5 w-2.5 rounded-full', style.dot)}
                  />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
              {data.collaborators.length > 0 && (
                <>
                  <Separator className="my-1" />
                  <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
                    Manufacturers
                  </p>
                  {data.collaborators.map((c, i) => (
                    <div
                      key={c.manufacturerId}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          MANUFACTURER_PALETTE[
                            i % MANUFACTURER_PALETTE.length
                          ].dot
                        )}
                      />
                      <span className="text-muted-foreground truncate">
                        {c.manufacturerName}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Part selection list for bulk actions */}
      {(canAssign || canUpdateStatus) && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-3">
              Select parts for bulk actions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.splitParts.map((part) => {
                const assignment = data.assignments.find(
                  (a) => a.part_id === part.id
                );
                const isSelected = selectedPartIds.has(part.id);
                const statusStyle =
                  STATUS_COLORS[assignment?.status ?? 'Not Started'] ??
                  STATUS_COLORS['Not Started'];
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => togglePartSelection(part.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-all',
                      isSelected
                        ? 'border-[#e87722] bg-[#e87722]/10 ring-1 ring-[#e87722]/30'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-[#e87722] shrink-0"
                    />
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        statusStyle.dot
                      )}
                    />
                    <span className="truncate flex-1">{part.name}</span>
                    {assignment && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        {assignment.manufacturer_name}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Part inspector dialog */}
      <PartInspectorDialog
        part={inspectedPart}
        onClose={() => setInspectedPart(null)}
        canAssign={canAssign}
        canUpdateStatus={canUpdateStatus}
        currentUserId={data.currentUserId}
        assignments={data.assignments}
        onStatusChange={handleStatusChange}
        onUnassign={handleUnassign}
        onSelect={togglePartSelection}
        selectedPartIds={selectedPartIds}
      />

      {/* Assign dialog */}
      {assignDialogOpen && (
        <SubcontractorAssignDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          orderId={order.id}
          partIds={Array.from(selectedPartIds)}
          excludeUserId={order.manufacturer ?? undefined}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}

/* ── Part Inspector Dialog ─────────────────────────────────────────── */

interface PartInspectorDialogProps {
  part: PartNodeData | null;
  onClose: () => void;
  canAssign: boolean;
  canUpdateStatus: boolean;
  currentUserId: string;
  assignments: PartAssignmentWithPart[];
  onStatusChange: (assignmentId: string, status: string) => void;
  onUnassign: (assignmentId: string) => void;
  onSelect: (partId: string) => void;
  selectedPartIds: Set<string>;
}

function PartInspectorDialog({
  part,
  onClose,
  canAssign,
  canUpdateStatus,
  currentUserId,
  assignments,
  onStatusChange,
  onUnassign,
  onSelect,
  selectedPartIds,
}: PartInspectorDialogProps) {
  if (!part) return null;

  const assignment = assignments.find((a) => a.part_id === part.partId);
  const statusStyle =
    STATUS_COLORS[part.status] ?? STATUS_COLORS['Not Started'];
  const isMyAssignment = assignment?.assigned_manufacturer === currentUserId;
  const isSelected = selectedPartIds.has(part.partId);

  const getNextStatus = (current: string): string | null => {
    const idx = PART_STATUSES.indexOf(
      current as (typeof PART_STATUSES)[number]
    );
    return idx >= 0 && idx < PART_STATUSES.length - 1
      ? PART_STATUSES[idx + 1]
      : null;
  };

  const nextStatus = getNextStatus(part.status);

  return (
    <Dialog open={!!part} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#e87722]" />
            {part.label}
          </DialogTitle>
          <DialogDescription>
            {part.hierarchy.length > 0
              ? part.hierarchy.join(' → ')
              : 'Top-level part'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5',
                statusStyle.bg,
                statusStyle.text,
                statusStyle.border
              )}
            >
              <div
                className={cn('h-2 w-2 rounded-full', statusStyle.dot)}
              />
              {part.status}
            </Badge>
          </div>

          {/* Assigned to */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Assigned to
            </span>
            <span className="text-sm font-medium">
              {part.manufacturerName ?? 'Unassigned'}
            </span>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {/* Advance status */}
            {assignment &&
              canUpdateStatus &&
              (isMyAssignment || canAssign) &&
              nextStatus && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(assignment.id, nextStatus)}
                  className="w-full justify-start"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Advance to {nextStatus}
                </Button>
              )}

            {/* Select for assignment */}
            {canAssign && (
              <Button
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onSelect(part.partId)}
                className={cn(
                  'w-full justify-start',
                  isSelected && 'bg-[#e87722] hover:bg-[#d06a1e]'
                )}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Selected for assignment
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Select for assignment
                  </>
                )}
              </Button>
            )}

            {/* Unassign */}
            {canAssign && assignment && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnassign(assignment.id)}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Unassign part
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
