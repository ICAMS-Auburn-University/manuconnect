'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, FolderTree, Layers3 } from 'lucide-react';

import { buildPartTree, PartTreeNode } from '@/domain/cad/tree';
import type { PartSummary } from '@/domain/cad/types';
import type { AssemblyClientModel } from './types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PartPreview } from '@/components/cad/STEPViewer/PartPreview';
import { cn } from '@/lib/utils';

interface AssemblySelectionStepProps {
  parts: PartSummary[];
  assemblies: AssemblyClientModel[];
  assignedPartIds: Set<string>;
  onCreateAssembly: (payload: {
    name: string;
    partIds: string[];
  }) => Promise<void>;
  isSaving: boolean;
}

interface SimilarPartGroup {
  id: string;
  representative: PartSummary;
  parts: PartSummary[];
  availablePartIds: string[];
  count: number;
}

type SelectionView = 'tree' | 'grouped';

const getSimilarityKey = (part: PartSummary): string | null => {
  const metadata = part.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const value = metadata.similarity_key;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const buildSimilarPartGroups = (
  parts: PartSummary[],
  assignedPartIds: Set<string>
): SimilarPartGroup[] => {
  const groups = new Map<string, SimilarPartGroup>();

  parts.forEach((part) => {
    const groupId = getSimilarityKey(part) ?? part.storagePath;
    const existing = groups.get(groupId);
    if (existing) {
      existing.parts.push(part);
      if (!assignedPartIds.has(part.storagePath)) {
        existing.availablePartIds.push(part.storagePath);
      }
      return;
    }

    groups.set(groupId, {
      id: groupId,
      representative: part,
      parts: [part],
      availablePartIds: assignedPartIds.has(part.storagePath)
        ? []
        : [part.storagePath],
      count: 1,
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      count: group.parts.length,
    }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }
      return left.representative.name.localeCompare(right.representative.name);
    });
};

const Node = ({
  node,
  selectedPartIds,
  disabledPartIds,
  previewPartId,
  onToggle,
  onPreview,
}: {
  node: PartTreeNode;
  selectedPartIds: Set<string>;
  disabledPartIds: Set<string>;
  previewPartId: string | null;
  onToggle: (partId: string) => void;
  onPreview: (partId: string) => void;
}) => {
  if (!node.part) {
    return (
      <div className="space-y-2 rounded border border-dashed border-muted-foreground/30 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          {node.label}
        </div>
        <div className="ml-4 space-y-2 border-l border-muted-foreground/40 pl-4">
          {node.children.map((child) => (
            <Node
              key={child.id}
              node={child}
              selectedPartIds={selectedPartIds}
              disabledPartIds={disabledPartIds}
              previewPartId={previewPartId}
              onToggle={onToggle}
              onPreview={onPreview}
            />
          ))}
        </div>
      </div>
    );
  }

  const partId = node.part!.storagePath;
  const selected = selectedPartIds.has(partId);
  const disabled = disabledPartIds.has(partId);
  const isPreviewed = previewPartId === partId;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition-colors',
        isPreviewed
          ? 'border-primary/60 bg-primary/5'
          : 'border-muted-foreground/20'
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          disabled={disabled}
          onCheckedChange={() => onToggle(partId)}
        />
        <div className="min-w-0 flex flex-col">
          <button
            type="button"
            onClick={() => onPreview(partId)}
            className="truncate text-left font-medium text-foreground hover:text-primary"
            title={node.part.name}
          >
            {node.part.name}
          </button>
          {node.part.hierarchy.length > 0 && (
            <span className="truncate text-xs text-muted-foreground">
              {node.part.hierarchy.join(' / ')}
            </span>
          )}
          <span className="line-clamp-2 break-all text-xs text-muted-foreground">
            {node.part.storagePath}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={isPreviewed ? 'default' : 'outline'}
          onClick={() => onPreview(partId)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        {disabled && (
          <Badge variant="secondary" className="text-xs">
            Assigned
          </Badge>
        )}
      </div>
    </div>
  );
};

const SimilarGroupCard = ({
  group,
  selectedPartIds,
  previewPartId,
  onToggle,
  onPreview,
}: {
  group: SimilarPartGroup;
  selectedPartIds: Set<string>;
  previewPartId: string | null;
  onToggle: (partIds: string[]) => void;
  onPreview: (partId: string) => void;
}) => {
  const selectedCount = group.availablePartIds.filter((partId) =>
    selectedPartIds.has(partId)
  ).length;
  const isSelected =
    group.availablePartIds.length > 0 &&
    selectedCount === group.availablePartIds.length;
  const isPartiallySelected =
    selectedCount > 0 && selectedCount < group.availablePartIds.length;
  const isPreviewed = previewPartId === group.representative.storagePath;
  const unavailableCount = group.parts.length - group.availablePartIds.length;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-sm transition-colors',
        isPreviewed
          ? 'border-primary/60 bg-primary/5'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox
            checked={isSelected || isPartiallySelected}
            disabled={group.availablePartIds.length === 0}
            onCheckedChange={() => onToggle(group.availablePartIds)}
          />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPreview(group.representative.storagePath)}
                className="truncate text-left text-base font-semibold text-foreground hover:text-primary"
                title={group.representative.name}
              >
                {group.representative.name}
              </button>
              {group.count > 1 && (
                <Badge variant="secondary" className="gap-1">
                  <Layers3 className="h-3 w-3" />x {group.count}
                </Badge>
              )}
              {unavailableCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {unavailableCount} assigned
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                {group.availablePartIds.length} selectable of {group.count} total
              </span>
              {group.representative.hierarchy.length > 0 && (
                <span className="truncate">
                  {group.representative.hierarchy.join(' / ')}
                </span>
              )}
            </div>

              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Selecting this group adds all matching components to the assembly.
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant={isPreviewed ? 'default' : 'outline'}
          onClick={() => onPreview(group.representative.storagePath)}
          className="shrink-0"
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>
    </div>
  );
};

export function AssemblySelectionStep({
  parts,
  assemblies,
  assignedPartIds,
  onCreateAssembly,
  isSaving,
}: AssemblySelectionStepProps) {
  const tree = useMemo(() => buildPartTree(parts), [parts]);
  const groupedParts = useMemo(
    () => buildSimilarPartGroups(parts, assignedPartIds),
    [parts, assignedPartIds]
  );
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(
    () => new Set()
  );
  const [previewPartId, setPreviewPartId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assemblyName, setAssemblyName] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [selectionView, setSelectionView] = useState<SelectionView>('tree');
  const [showDuplicateGroupsOnly, setShowDuplicateGroupsOnly] =
    useState(false);

  const selectablePartIds = useMemo(
    () => parts.filter((p) => !assignedPartIds.has(p.storagePath)).map((p) => p.storagePath),
    [parts, assignedPartIds]
  );

  const selectableGroups = useMemo(
    () => groupedParts.filter((group) => group.availablePartIds.length > 0),
    [groupedParts]
  );

  const visibleGroups = useMemo(
    () =>
      showDuplicateGroupsOnly
        ? groupedParts.filter((group) => group.count > 1)
        : groupedParts,
    [groupedParts, showDuplicateGroupsOnly]
  );

  const assemblySummaryById = useMemo(() => {
    const partById = new Map(parts.map((part) => [part.storagePath, part]));

    return new Map(
      assemblies.map((assembly) => {
        const resolvedAssemblyParts = assembly.partIds
          .map((partId) => partById.get(partId))
          .filter((part): part is PartSummary => Boolean(part));
        const uniqueGroupCount = buildSimilarPartGroups(
          resolvedAssemblyParts,
          new Set<string>()
        ).length;

        return [
          assembly.id,
          {
            totalParts: assembly.partIds.length,
            groupedCount: uniqueGroupCount,
          },
        ] as const;
      })
    );
  }, [assemblies, parts]);

  const selectedGroupCount = useMemo(
    () =>
      selectableGroups.filter((group) =>
        group.availablePartIds.every((partId) => selectedPartIds.has(partId))
      ).length,
    [selectableGroups, selectedPartIds]
  );

  const allSelected =
    selectablePartIds.length > 0 &&
    selectablePartIds.every((id) => selectedPartIds.has(id));

  const previewPart = useMemo(
    () => parts.find((part) => part.storagePath === previewPartId) ?? null,
    [parts, previewPartId]
  );

  useEffect(() => {
    if (previewPart) {
      return;
    }

    const nextPreview =
      parts.find((part) => !assignedPartIds.has(part.storagePath)) ?? parts[0] ?? null;
    setPreviewPartId(nextPreview?.storagePath ?? null);
  }, [assignedPartIds, parts, previewPart]);

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPartIds(new Set());
    } else {
      setSelectedPartIds(new Set(selectablePartIds));
    }
  };

  const togglePart = (partId: string) => {
    if (assignedPartIds.has(partId)) {
      return;
    }
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

  const togglePartGroup = (partIds: string[]) => {
    if (partIds.length === 0) {
      return;
    }

    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      const allGroupPartsSelected = partIds.every((partId) => next.has(partId));

      partIds.forEach((partId) => {
        if (allGroupPartsSelected) {
          next.delete(partId);
        } else {
          next.add(partId);
        }
      });

      return next;
    });
  };

  const handleOpenDialog = () => {
    if (selectedPartIds.size === 0) {
      toast.error('Select at least one part to create an assembly.');
      return;
    }
    setAssemblyName('');
    setDialogError(null);
    setIsDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!assemblyName.trim()) {
      setDialogError('Assembly name is required.');
      return;
    }

    try {
      await onCreateAssembly({
        name: assemblyName.trim(),
        partIds: Array.from(selectedPartIds),
      });
      setSelectedPartIds(() => new Set());
      setIsDialogOpen(false);
      toast.success(`Assembly "${assemblyName}" created.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create assembly';
      setDialogError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Select Parts for Assemblies</h3>
        <p className="text-sm text-muted-foreground">
          Choose individual parts from the folder tree, or collapse similar
          components into grouped selections before creating an assembly.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {selectedPartIds.size} of {selectablePartIds.length} available part
            {selectablePartIds.length === 1 ? '' : 's'} selected
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedGroupCount} grouped selection
            {selectedGroupCount === 1 ? '' : 's'} fully selected across{' '}
            {selectableGroups.length} similar-part group
            {selectableGroups.length === 1 ? '' : 's'}.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setSelectionView('tree')}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                selectionView === 'tree'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Folder view
            </button>
            <button
              type="button"
              onClick={() => setSelectionView('grouped')}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                selectionView === 'grouped'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Similar groups
            </button>
          </div>

          {selectablePartIds.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
        <ScrollArea className="h-[560px] rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {selectionView === 'grouped' ? 'Similar component groups' : 'Part hierarchy'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {selectionView === 'grouped'
                  ? 'Select one group to include every matching component in the assembly.'
                  : 'Browse the CAD hierarchy and pick exact parts manually.'}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {selectionView === 'grouped' ? `${visibleGroups.length} groups` : `${parts.length} parts`}
            </Badge>
          </div>

          {selectionView === 'grouped' && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Focus on repeated components first
                </p>
                <p className="text-xs text-muted-foreground">
                  Show only duplicate groups like ball x 3 or screw x 9.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">
                  Duplicates only
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant={showDuplicateGroupsOnly ? 'default' : 'outline'}
                  onClick={() =>
                    setShowDuplicateGroupsOnly((current) => !current)
                  }
                >
                  {showDuplicateGroupsOnly ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {selectionView === 'grouped' ? (
              visibleGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {groupedParts.length === 0
                    ? 'Upload and split a CAD file to start selecting parts.'
                    : 'No duplicate groups match the current filter.'}
                </p>
              ) : (
                visibleGroups.map((group) => (
                  <SimilarGroupCard
                    key={group.id}
                    group={group}
                    selectedPartIds={selectedPartIds}
                    previewPartId={previewPartId}
                    onToggle={togglePartGroup}
                    onPreview={setPreviewPartId}
                  />
                ))
              )
            ) : tree.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Upload and split a CAD file to start selecting parts.
              </p>
            ) : (
              tree.map((node) => (
                <Node
                  key={node.id}
                  node={node}
                  selectedPartIds={selectedPartIds}
                  disabledPartIds={assignedPartIds}
                  previewPartId={previewPartId}
                  onToggle={togglePart}
                  onPreview={setPreviewPartId}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="space-y-4">
          {previewPart ? (
            <>
              <PartPreview
                storagePath={previewPart.storagePath}
                name={previewPart.name}
                hierarchy={previewPart.hierarchy}
              />
              <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-sm">
                <h4 className="font-semibold text-card-foreground">Previewed part</h4>
                <dl className="mt-3 space-y-3">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Name</dt>
                    <dd className="font-medium text-card-foreground">{previewPart.name}</dd>
                  </div>
                  {groupedParts.find(
                    (group) => group.representative.storagePath === previewPart.storagePath
                  )?.count &&
                    groupedParts.find(
                      (group) => group.representative.storagePath === previewPart.storagePath
                    )!.count > 1 && (
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">
                          Similar components
                        </dt>
                        <dd className="text-card-foreground">
                          {
                            groupedParts.find(
                              (group) =>
                                group.representative.storagePath === previewPart.storagePath
                            )!.count
                          } matching parts available for grouped selection
                        </dd>
                      </div>
                    )}
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Hierarchy</dt>
                    <dd className="text-card-foreground">
                      {previewPart.hierarchy.length > 0
                        ? previewPart.hierarchy.join(' / ')
                        : 'Top level part'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Storage path</dt>
                    <dd className="break-all font-mono text-xs text-muted-foreground">
                      {previewPart.storagePath}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
              Select a part to inspect its 3D model before assigning it to an assembly.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4">
        <Button type="button" onClick={handleOpenDialog}>
          Create Assembly
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Existing assemblies</h4>
        {assemblies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assemblies created yet.
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {assemblies.map((assembly) => (
              <li
                key={assembly.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{assembly.assembly_name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {assemblySummaryById.get(assembly.id)?.totalParts ??
                        assembly.partIds.length}{' '}
                      part
                      {(assemblySummaryById.get(assembly.id)?.totalParts ??
                        assembly.partIds.length) === 1
                        ? ''
                        : 's'}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {assemblySummaryById.get(assembly.id)?.groupedCount ??
                        assembly.partIds.length}{' '}
                      grouped item
                      {(assemblySummaryById.get(assembly.id)?.groupedCount ??
                        assembly.partIds.length) === 1
                        ? ''
                        : 's'}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    assembly.specifications_completed ? 'default' : 'outline'
                  }
                >
                  {assembly.specifications_completed ? 'Ready' : 'Pending'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Name this assembly</DialogTitle>
            <DialogDescription>
              Provide a label that reflects the group of parts you selected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="assembly-name">Assembly name</Label>
            <Input
              id="assembly-name"
              value={assemblyName}
              onChange={(event) => setAssemblyName(event.target.value)}
              autoFocus
            />
            {dialogError && (
              <p className="text-sm text-destructive">{dialogError}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Creating…' : 'Create assembly'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
