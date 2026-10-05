'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Loader2,
  Package,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { OrdersSchema, SplitPartsSchema } from '@/types/schemas';
import type { UserProfile } from '@/domain/users/types';
import type { PartAssignmentWithPart } from '@/domain/collaboration/service';
import { SubcontractorAssignDialog } from './SubcontractorAssignDialog';

const STATUS_COLORS: Record<
  string,
  { border: string; bg: string; text: string; dot: string }
> = {
  'Not Started': {
    border: 'border-gray-300',
    bg: 'bg-gray-50 dark:bg-gray-950/40',
    text: 'text-gray-600 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  'In Progress': {
    border: 'border-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  Completed: {
    border: 'border-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
  Shipped: {
    border: 'border-[#e87722]',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-[#e87722] dark:text-orange-300',
    dot: 'bg-[#e87722]',
  },
  Delivered: {
    border: 'border-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
};

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

interface PartNodeData {
  label: string;
  status: string;
  manufacturerName?: string;
  hierarchy: string[];
  partId: string;
  assignmentId?: string;
  storagePath?: string;
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

interface ManufacturerGroup {
  id: string;
  label: string;
  manufacturerId: string | null;
  parts: Array<{
    part: SplitPartsSchema;
    assignment?: PartAssignmentWithPart;
  }>;
  isUnassigned: boolean;
}

interface TreeBranchNode {
  type: 'branch';
  id: string;
  label: string;
  kind: 'manufacturer' | 'folder';
  children: CollaborationTreeNode[];
  descendantPartIds: string[];
  totalCount: number;
  completedCount: number;
  assignedCount: number;
  manufacturerName?: string;
  isUnassigned?: boolean;
}

interface TreeLeafNode {
  type: 'leaf';
  id: string;
  part: SplitPartsSchema;
  assignment?: PartAssignmentWithPart;
  data: PartNodeData;
}

type CollaborationTreeNode = TreeBranchNode | TreeLeafNode;

function buildManufacturerGroups(
  splitParts: SplitPartsSchema[],
  assignments: PartAssignmentWithPart[]
): ManufacturerGroup[] {
  const assignmentByPartId = new Map<string, PartAssignmentWithPart>();
  assignments.forEach((assignment) => {
    assignmentByPartId.set(assignment.part_id, assignment);
  });

  const groups = new Map<string, ManufacturerGroup>();

  splitParts.forEach((part) => {
    const assignment = assignmentByPartId.get(part.id);
    const key = assignment?.assigned_manufacturer ?? 'unassigned';
    const label = assignment?.manufacturer_name?.trim() || 'Unassigned';
    const isUnassigned = !assignment?.assigned_manufacturer;

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        label,
        manufacturerId: assignment?.assigned_manufacturer ?? null,
        parts: [],
        isUnassigned,
      });
    }

    groups.get(key)?.parts.push({ part, assignment });
  });

  return Array.from(groups.values()).sort((left, right) => {
    if (left.isUnassigned !== right.isUnassigned) {
      return left.isUnassigned ? 1 : -1;
    }
    return left.label.localeCompare(right.label);
  });
}

function finalizeBranch(branch: TreeBranchNode): TreeBranchNode {
  const nextChildren = branch.children.map((child) =>
    child.type === 'branch' ? finalizeBranch(child) : child
  );

  const descendantPartIds = nextChildren.flatMap((child) =>
    child.type === 'branch' ? child.descendantPartIds : [child.part.id]
  );
  const completedCount = nextChildren.reduce((total, child) => {
    if (child.type === 'branch') {
      return total + child.completedCount;
    }

    return child.data.status === 'Completed' || child.data.status === 'Shipped'
      ? total + 1
      : total;
  }, 0);
  const assignedCount = nextChildren.reduce((total, child) => {
    if (child.type === 'branch') {
      return total + child.assignedCount;
    }

    return child.assignment ? total + 1 : total;
  }, 0);

  return {
    ...branch,
    children: nextChildren,
    descendantPartIds,
    totalCount: descendantPartIds.length,
    completedCount,
    assignedCount,
  };
}

function buildCollaborationTree(groups: ManufacturerGroup[]): TreeBranchNode[] {
  return groups.map((group) => {
    const root: TreeBranchNode = {
      type: 'branch',
      id: `manufacturer:${group.id}`,
      label: group.label,
      kind: 'manufacturer',
      children: [],
      descendantPartIds: [],
      totalCount: 0,
      completedCount: 0,
      assignedCount: 0,
      manufacturerName: group.label,
      isUnassigned: group.isUnassigned,
    };

    group.parts.forEach(({ part, assignment }) => {
      const hierarchy = Array.isArray(part.hierarchy) ? part.hierarchy : [];
      let currentBranch = root;
      let path = root.id;

      hierarchy.forEach((segment) => {
        path = `${path}/${segment}`;
        let childBranch = currentBranch.children.find(
          (child): child is TreeBranchNode =>
            child.type === 'branch' && child.id === path
        );

        if (!childBranch) {
          childBranch = {
            type: 'branch',
            id: path,
            label: segment,
            kind: 'folder',
            children: [],
            descendantPartIds: [],
            totalCount: 0,
            completedCount: 0,
            assignedCount: 0,
            manufacturerName: group.label,
            isUnassigned: group.isUnassigned,
          };
          currentBranch.children.push(childBranch);
        }

        currentBranch = childBranch;
      });

      currentBranch.children.push({
        type: 'leaf',
        id: part.id,
        part,
        assignment,
        data: {
          label: part.name,
          status: assignment?.status ?? 'Not Started',
          manufacturerName: assignment?.manufacturer_name ?? undefined,
          hierarchy,
          partId: part.id,
          assignmentId: assignment?.id,
          storagePath: part.storage_path,
        },
      });
    });

    root.children.sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === 'branch' ? -1 : 1;
      }
      const leftLabel = left.type === 'branch' ? left.label : left.part.name;
      const rightLabel = right.type === 'branch' ? right.label : right.part.name;
      return leftLabel.localeCompare(rightLabel);
    });

    return finalizeBranch(root);
  });
}

function collectExpandedIds(branches: TreeBranchNode[]): string[] {
  const ids: string[] = [];

  const visit = (node: TreeBranchNode, depth: number) => {
    if (depth <= 1) {
      ids.push(node.id);
    }

    node.children.forEach((child) => {
      if (child.type === 'branch') {
        visit(child, depth + 1);
      }
    });
  };

  branches.forEach((branch) => visit(branch, 0));
  return ids;
}

function collectAllBranchIds(branches: TreeBranchNode[]): Set<string> {
  const ids = new Set<string>();

  const visit = (node: TreeBranchNode) => {
    ids.add(node.id);
    node.children.forEach((child) => {
      if (child.type === 'branch') {
        visit(child);
      }
    });
  };

  branches.forEach((branch) => visit(branch));
  return ids;
}

function countSelected(partIds: string[], selectedPartIds: Set<string>): number {
  return partIds.filter((partId) => selectedPartIds.has(partId)).length;
}

interface AssemblyCollaborationTabProps {
  order: OrdersSchema;
  userData: UserProfile | null;
}

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
  }, [assignmentByPartId, data, selectedPartIds]);

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
  }, [canAssign, data, selectedAssignments]);

  const collaborationTree = useMemo(() => {
    if (!data) {
      return [] as TreeBranchNode[];
    }

    return buildCollaborationTree(
      buildManufacturerGroups(data.splitParts, data.assignments)
    );
  }, [data]);

  const totalPartCount = data?.splitParts.length ?? 0;
  const assignedPartCount = data?.assignments.length ?? 0;
  const unassignedPartCount = totalPartCount - assignedPartCount;

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

  useEffect(() => {
    const availableBranchIds = collectAllBranchIds(collaborationTree);
    const defaultExpandedIds = new Set(collectExpandedIds(collaborationTree));

    setExpandedIds((prev) => {
      if (prev.size === 0) {
        return defaultExpandedIds;
      }

      const next = new Set(
        Array.from(prev).filter((id) => availableBranchIds.has(id))
      );

      return next.size > 0 ? next : defaultExpandedIds;
    });
  }, [collaborationTree]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const availablePartIds = new Set(data.splitParts.map((part) => part.id));
    setSelectedPartIds((prev) => {
      const next = new Set(
        Array.from(prev).filter((partId) => availablePartIds.has(partId))
      );
      return next.size === prev.size ? prev : next;
    });
  }, [data]);

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
    void fetchData();
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
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  const toggleManyPartSelections = (partIds: string[]) => {
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      const allSelected = partIds.every((partId) => next.has(partId));

      partIds.forEach((partId) => {
        if (allSelected) {
          next.delete(partId);
        } else {
          next.add(partId);
        }
      });

      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(collectExpandedIds(collaborationTree)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set(collaborationTree.map((branch) => branch.id)));
  };

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

  const renderTreeNode = (node: CollaborationTreeNode, depth = 0) => {
    if (node.type === 'leaf') {
      const isSelected = selectedPartIds.has(node.part.id);
      const statusStyle =
        STATUS_COLORS[node.data.status] ?? STATUS_COLORS['Not Started'];
      const assignment = node.assignment;

      return (
        <div key={node.id} className="space-y-2">
          <button
            type="button"
            onClick={() => setInspectedPart(node.data)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-muted/40',
              isSelected
                ? 'border-[#e87722]/50 bg-[#e87722]/10'
                : 'border-border bg-background'
            )}
            style={{ marginLeft: `${depth * 20}px` }}
          >
            {(canAssign || canUpdateStatus) && (
              <div
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => togglePartSelection(node.part.id)}
                />
              </div>
            )}

            <div
              className={cn('h-2.5 w-2.5 rounded-full shrink-0', statusStyle.dot)}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium text-foreground">
                  {node.part.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn(statusStyle.border, statusStyle.bg, statusStyle.text)}
                >
                  {node.data.status}
                </Badge>
                {assignment?.manufacturer_name && (
                  <Badge variant="secondary">{assignment.manufacturer_name}</Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {node.data.hierarchy.length > 0
                  ? node.data.hierarchy.join(' / ')
                  : 'Top-level part'}
              </div>
            </div>

            <div className="shrink-0 text-xs text-muted-foreground">
              Inspect
            </div>
          </button>
        </div>
      );
    }

    const isExpanded = expandedIds.has(node.id);
    const selectedCount = countSelected(node.descendantPartIds, selectedPartIds);
    const allSelected =
      node.descendantPartIds.length > 0 &&
      selectedCount === node.descendantPartIds.length;
    const isPartiallySelected =
      selectedCount > 0 && selectedCount < node.descendantPartIds.length;
    const branchIcon =
      node.kind === 'manufacturer' ? (
        <Building2 className="h-4 w-4 text-[#e87722]" />
      ) : (
        <FolderTree className="h-4 w-4 text-muted-foreground" />
      );

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={cn(
            'rounded-xl border bg-card px-3 py-3 shadow-sm',
            node.kind === 'manufacturer'
              ? 'border-border/80'
              : 'border-border/60'
          )}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggleExpanded(node.id)}
              className="mt-0.5 flex shrink-0 items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {(canAssign || canUpdateStatus) && (
              <div onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={
                    allSelected
                      ? true
                      : isPartiallySelected
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={() =>
                    toggleManyPartSelections(node.descendantPartIds)
                  }
                />
              </div>
            )}

            <div className="mt-0.5 shrink-0">{branchIcon}</div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleExpanded(node.id)}
                  className="truncate text-left font-semibold text-foreground hover:text-primary"
                >
                  {node.label}
                </button>
                <Badge variant="outline">{node.totalCount} parts</Badge>
                {node.kind === 'manufacturer' && (
                  <Badge variant={node.isUnassigned ? 'outline' : 'secondary'}>
                    {node.isUnassigned ? 'Needs assignment' : 'Assigned group'}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{node.completedCount} completed or shipped</span>
                <span>{node.assignedCount} assigned</span>
                {(canAssign || canUpdateStatus) && (
                  <span>
                    {selectedCount} selected
                    {isPartiallySelected && !allSelected ? ' in this branch' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && node.children.length > 0 && (
          <div className="space-y-2">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {(canAssign || canUpdateStatus) && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Collaboration actions
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedPartIds.size} selected · {selectedAssignments.length} assigned ·{' '}
              {bulkAdvanceTargets.length} can advance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={expandAll}>
              Expand all
            </Button>
            <Button size="sm" variant="outline" onClick={collapseAll}>
              Collapse to groups
            </Button>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-border/70 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Assembly Collaboration Tree
                </h3>
                <Badge variant="outline">{totalPartCount} total parts</Badge>
                <Badge variant="secondary">{data.collaborators.length} collaborators</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse by manufacturer and CAD hierarchy, then expand folders to inspect or act on individual parts.
              </p>
            </div>

            <ScrollArea className="h-[720px] px-5 py-5">
              <div className="space-y-3">
                {collaborationTree.map((branch) => renderTreeNode(branch))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  Order collaboration summary
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  High-level progress across assignments and assembly handoff.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Assigned
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {assignedPartCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Unassigned
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {unassignedPartCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Selected
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {selectedPartIds.size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-semibold text-card-foreground">
                How this tree works
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Manufacturer groups are the top level.</p>
                <p>Folder branches follow the original CAD hierarchy.</p>
                <p>Leaf rows are individual parts with status and assignee.</p>
                <p>Use checkboxes on groups or folders to bulk-select descendants.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
  const nextStatus = getNextPartStatus(part.status);

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
          <div className="flex items-center justify-between gap-3">
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
              <div className={cn('h-2 w-2 rounded-full', statusStyle.dot)} />
              {part.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Assigned to</span>
            <span className="text-sm font-medium text-right">
              {part.manufacturerName ?? 'Unassigned'}
            </span>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
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
