'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FolderTree, Eye } from 'lucide-react';

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
        'flex items-center justify-between rounded border px-3 py-2 text-sm shadow-sm transition-colors',
        isPreviewed ? 'border-blue-500 bg-blue-50' : 'border-muted-foreground/40'
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          disabled={disabled}
          onCheckedChange={() => onToggle(partId)}
        />
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onPreview(partId)}
            className="text-left font-medium text-foreground hover:text-blue-700"
          >
            {node.part.name}
          </button>
          {node.part.hierarchy.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {node.part.hierarchy.join(' / ')}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {node.part.storagePath}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
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

export function AssemblySelectionStep({
  parts,
  assemblies,
  assignedPartIds,
  onCreateAssembly,
  isSaving,
}: AssemblySelectionStepProps) {
  const tree = useMemo(() => buildPartTree(parts), [parts]);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(
    () => new Set()
  );
  const [previewPartId, setPreviewPartId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assemblyName, setAssemblyName] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  const selectablePartIds = useMemo(
    () => parts.filter((p) => !assignedPartIds.has(p.storagePath)).map((p) => p.storagePath),
    [parts, assignedPartIds]
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
          Use the folder tree to pick parts for each assembly. Parts can only
          belong to one assembly.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedPartIds.size} of {selectablePartIds.length} available part
          {selectablePartIds.length === 1 ? '' : 's'} selected
        </div>
        {selectablePartIds.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <ScrollArea className="h-[420px] rounded border p-4">
          <div className="space-y-3">
            {tree.length === 0 ? (
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
              <div className="rounded border bg-white p-4 text-sm">
                <h4 className="font-semibold text-gray-900">Previewed part</h4>
                <dl className="mt-3 space-y-3">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Name</dt>
                    <dd className="font-medium text-gray-900">{previewPart.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Hierarchy</dt>
                    <dd className="text-gray-900">
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
            <div className="rounded border bg-white p-4 text-sm text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground">
                    {assembly.partIds.length} part
                    {assembly.partIds.length === 1 ? '' : 's'}
                  </p>
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
