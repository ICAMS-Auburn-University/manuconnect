'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, CircleDashed, Copy } from 'lucide-react';

import type { PartSummary } from '@/domain/cad/types';
import type {
  AssemblyClientModel,
  PartSpecificationState,
  SpecificationDraft,
} from './types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpecificationWizard } from './SpecificationWizard';
import { PartCarousel } from './PartCarousel';

interface PartSpecificationsStepProps {
  assembly: AssemblyClientModel | null;
  parts: PartSummary[];
  specifications: PartSpecificationState;
  onSavePartSpecification: (
    partId: string,
    payload: SpecificationDraft,
    quantity: number
  ) => Promise<void>;
  onMarkAssemblyComplete: () => Promise<void>;
  onBack: () => void;
  isMarkingComplete: boolean;
}

export function PartSpecificationsStep({
  assembly,
  parts,
  specifications,
  onSavePartSpecification,
  onMarkAssemblyComplete,
  onBack,
  isMarkingComplete,
}: PartSpecificationsStepProps) {
  const [wizardPartId, setWizardPartId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applySourceId, setApplySourceId] = useState<string>('');

  const resolvedParts = useMemo(() => {
    if (!assembly) {
      return [];
    }
    const byId = new Map(parts.map((part) => [part.storagePath, part]));
    return assembly.partIds
      .map((id) => byId.get(id))
      .filter((part): part is PartSummary => Boolean(part));
  }, [assembly, parts]);

  const completedPartIds = useMemo(() => {
    return resolvedParts
      .filter((part) => Boolean(specifications[part.storagePath]))
      .map((part) => part.storagePath);
  }, [resolvedParts, specifications]);

  const configuredParts = useMemo(() => {
    return resolvedParts.filter((p) => Boolean(specifications[p.storagePath]));
  }, [resolvedParts, specifications]);

  const unconfiguredParts = useMemo(() => {
    return resolvedParts.filter((p) => !specifications[p.storagePath]);
  }, [resolvedParts, specifications]);

  const allCompleted =
    assembly && completedPartIds.length === assembly.partIds.length;

  const currentWizardPart = wizardPartId
    ? (resolvedParts.find((part) => part.storagePath === wizardPartId) ?? null)
    : null;

  const currentSpecDraft: SpecificationDraft | null = currentWizardPart
    ? ((specifications[currentWizardPart.storagePath]
        ?.specifications as SpecificationDraft) ?? null)
    : null;
  const currentQuantity =
    currentWizardPart && specifications[currentWizardPart.storagePath]
      ? specifications[currentWizardPart.storagePath].quantity
      : 1;

  const handleSave = async (
    payload: SpecificationDraft & { quantity: number }
  ) => {
    if (!assembly || !currentWizardPart) {
      return;
    }
    await onSavePartSpecification(
      currentWizardPart.storagePath,
      payload,
      payload.quantity
    );
  };

  const openWizard = (partId: string) => {
    setWizardPartId(partId);
    setWizardOpen(true);
  };

  const handleApplyToAll = async () => {
    const sourceSpec = specifications[applySourceId];
    if (!sourceSpec || !assembly) return;

    setIsApplyingAll(true);
    try {
      const targets = unconfiguredParts;
      for (const part of targets) {
        await onSavePartSpecification(
          part.storagePath,
          sourceSpec.specifications,
          sourceSpec.quantity
        );
      }
      toast.success(`Specifications applied to ${targets.length} parts.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to apply specifications';
      toast.error(message);
    } finally {
      setIsApplyingAll(false);
    }
  };

  if (!assembly) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select an assembly from the overview to configure specifications.
        </p>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to overview
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{assembly.assembly_name}</h3>
          <p className="text-sm text-muted-foreground">
            Configure each part before marking this assembly as complete.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to overview
        </Button>
      </div>

      {resolvedParts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No parts linked to this assembly yet.
        </p>
      ) : (
        <PartCarousel
          parts={resolvedParts}
          specifications={specifications}
          onConfigure={openWizard}
        />
      )}

      {configuredParts.length > 0 && unconfiguredParts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
          <Copy className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
          <p className="w-full text-sm font-medium sm:w-auto sm:flex-1">
            Apply specifications to all {unconfiguredParts.length} unconfigured
            part{unconfiguredParts.length === 1 ? '' : 's'}
          </p>
          <Select value={applySourceId} onValueChange={setApplySourceId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Copy from…" />
            </SelectTrigger>
            <SelectContent>
              {configuredParts.map((part) => (
                <SelectItem key={part.storagePath} value={part.storagePath}>
                  {part.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={handleApplyToAll}
            disabled={!applySourceId || isApplyingAll}
          >
            {isApplyingAll
              ? 'Applying…'
              : `Apply to ${unconfiguredParts.length} parts`}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completedPartIds.length} of {assembly.partIds.length} parts completed
        </p>
        <Button
          type="button"
          onClick={async () => {
            if (!allCompleted) {
              toast.error('Complete all parts before marking assembly done.');
              return;
            }
            await onMarkAssemblyComplete();
          }}
          disabled={!allCompleted || isMarkingComplete}
        >
          {isMarkingComplete ? 'Saving…' : 'Mark assembly complete'}
        </Button>
      </div>

      <SpecificationWizard
        open={wizardOpen}
        part={currentWizardPart}
        quantity={currentQuantity}
        defaultValue={currentSpecDraft}
        configuredParts={configuredParts
          .filter((p) => p.storagePath !== wizardPartId)
          .map((p) => ({
            name: p.name,
            storagePath: p.storagePath,
            spec: specifications[p.storagePath]!.specifications,
            quantity: specifications[p.storagePath]!.quantity,
          }))}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
