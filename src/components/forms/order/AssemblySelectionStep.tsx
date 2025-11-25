'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FolderTree } from 'lucide-react';

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
import { formatPartLocation } from '@/domain/cad/format';

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
  onToggle,
}: {
  node: PartTreeNode;
  selectedPartIds: Set<string>;
  disabledPartIds: Set<string>;
  onToggle: (partId: string) => void;
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
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    );
  }

  const partId = node.part!.storagePath;
  const selected = selectedPartIds.has(partId);
  const disabled = disabledPartIds.has(partId);
  const locationLabel = formatPartLocation(node.part);

  return (
    <label className="flex items-center justify-between rounded border border-muted-foreground/40 px-3 py-2 text-sm shadow-sm">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          disabled={disabled}
          onCheckedChange={() => onToggle(partId)}
        />
        <div className="flex flex-col">
          <span className="font-medium">{node.part.name}</span>
        </div>
      </div>
      {disabled && (
        <Badge
          variant="secondary"
          className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
        >
          Assigned
        </Badge>
      )}
    </label>
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
  const totalParts = parts.length;
  const assignedCount = assignedPartIds.size;
  const remainingCount = Math.max(totalParts - assignedCount, 0);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assemblyName, setAssemblyName] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

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

      <ScrollArea className="h-[360px] rounded border p-4">
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
                onToggle={togglePart}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {selectedPartIds.size} part
          {selectedPartIds.size === 1 ? '' : 's'} selected
        </div>
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
                    assembly.specifications_completed ? 'default' : 'secondary'
                  }
                  className={
                    assembly.specifications_completed
                      ? undefined
                      : 'border-sky-200 bg-sky-50 text-sky-700'
                  }
                >
                  {assembly.specifications_completed ? 'Ready' : 'Next: Specs'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={`rounded border px-4 py-3 text-sm ${
          totalParts === 0
            ? 'border-muted-foreground/40 bg-muted-foreground/10 text-muted-foreground'
            : remainingCount > 0
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
        }`}
      >
        {totalParts === 0 ? (
          <p>Upload and split a CAD file to start assigning parts.</p>
        ) : remainingCount > 0 ? (
          <p>
            {remainingCount} of {totalParts} part
            {totalParts === 1 ? '' : 's'} still need assignment before you can
            continue.
          </p>
        ) : (
          <p>All parts assigned. You can continue to specifications.</p>
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
