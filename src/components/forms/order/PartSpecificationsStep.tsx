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

interface PartGroup {
  id: string;
  parts: PartSummary[];
  representative: PartSummary;
  count: number;
}

const getSimilarityKey = (part: PartSummary): string | null => {
  const metadata = part.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const value = metadata.similarity_key;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const buildPartGroups = (parts: PartSummary[]): PartGroup[] => {
  const groups = new Map<string, PartGroup>();

  parts.forEach((part) => {
    const groupId = getSimilarityKey(part) ?? part.storagePath;
    const existing = groups.get(groupId);
    if (existing) {
      existing.parts.push(part);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      parts: [part],
      representative: part,
      count: 1,
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    count: group.parts.length,
  }));
};

const totalGroupQuantity = (
  group: PartGroup,
  specifications: PartSpecificationState
) => {
  const savedTotal = group.parts.reduce(
    (sum, part) => sum + (specifications[part.storagePath]?.quantity ?? 0),
    0
  );

  return savedTotal > 0 ? savedTotal : group.count;
};

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

  const groupedParts = useMemo(
    () => buildPartGroups(resolvedParts),
    [resolvedParts]
  );

  const groupByRepresentativeId = useMemo(
    () =>
      new Map(
        groupedParts.map((group) => [group.representative.storagePath, group])
      ),
    [groupedParts]
  );

  const completedGroupIds = useMemo(() => {
    return groupedParts
      .filter((group) =>
        group.parts.every((part) => Boolean(specifications[part.storagePath]))
      )
      .map((group) => group.id);
  }, [groupedParts, specifications]);

  const configuredParts = useMemo(() => {
    return groupedParts.filter((group) =>
      group.parts.every((part) => Boolean(specifications[part.storagePath]))
    );
  }, [groupedParts, specifications]);

  const unconfiguredParts = useMemo(() => {
    return groupedParts.filter((group) =>
      group.parts.some((part) => !specifications[part.storagePath])
    );
  }, [groupedParts, specifications]);

  const allCompleted =
    assembly && completedGroupIds.length === groupedParts.length;

  const currentWizardPart = wizardPartId
    ? (groupByRepresentativeId.get(wizardPartId)?.representative ?? null)
    : null;

  const currentWizardGroup = currentWizardPart
    ? (groupByRepresentativeId.get(currentWizardPart.storagePath) ?? null)
    : null;

  const currentSpecDraft: SpecificationDraft | null = currentWizardPart
    ? ((currentWizardGroup?.parts
        .map((part) => specifications[part.storagePath]?.specifications)
        .find(Boolean) as SpecificationDraft | undefined) ?? null)
    : null;
  const currentQuantity =
    currentWizardGroup
      ? totalGroupQuantity(currentWizardGroup, specifications)
      : 1;

  const handleSave = async (
    payload: SpecificationDraft & { quantity: number }
  ) => {
    if (!assembly || !currentWizardPart || !currentWizardGroup) {
      return;
    }

    const groupSize = currentWizardGroup.parts.length;
    const normalizedTotal = Math.max(payload.quantity, groupSize);
    const baseQuantity = Math.floor(normalizedTotal / groupSize);
    const remainder = normalizedTotal % groupSize;

    for (const [index, part] of currentWizardGroup.parts.entries()) {
      const distributedQuantity =
        baseQuantity + (index < remainder ? 1 : 0);
      await onSavePartSpecification(
        part.storagePath,
        payload,
        distributedQuantity
      );
    }
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
      for (const group of targets) {
        const totalQuantity = Math.max(sourceSpec.quantity, group.count);
        const baseQuantity = Math.floor(totalQuantity / group.count);
        const remainder = totalQuantity % group.count;

        for (const [index, part] of group.parts.entries()) {
          await onSavePartSpecification(
            part.storagePath,
            sourceSpec.specifications,
            baseQuantity + (index < remainder ? 1 : 0)
          );
        }
      }
      toast.success(`Specifications applied to ${targets.length} part groups.`);
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

      {groupedParts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No parts linked to this assembly yet.
        </p>
      ) : (
        <PartCarousel
          parts={groupedParts.map((group) => ({
            ...group.representative,
            name:
              group.count > 1
                ? `${group.representative.name} x ${group.count}`
                : group.representative.name,
          }))}
          specifications={specifications}
          onConfigure={openWizard}
        />
      )}

      {configuredParts.length > 0 && unconfiguredParts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
          <Copy className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
          <p className="w-full text-sm font-medium sm:w-auto sm:flex-1">
            Apply specifications to all {unconfiguredParts.length} unconfigured
            part group{unconfiguredParts.length === 1 ? '' : 's'}
          </p>
          <Select value={applySourceId} onValueChange={setApplySourceId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Copy from…" />
            </SelectTrigger>
            <SelectContent>
              {configuredParts.map((group) => (
                <SelectItem
                  key={group.representative.storagePath}
                  value={group.representative.storagePath}
                >
                  {group.count > 1
                    ? `${group.representative.name} x ${group.count}`
                    : group.representative.name}
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
              : `Apply to ${unconfiguredParts.length} groups`}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completedGroupIds.length} of {groupedParts.length} part groups completed
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
          .filter((group) => group.representative.storagePath !== wizardPartId)
          .map((group) => ({
            name:
              group.count > 1
                ? `${group.representative.name} x ${group.count}`
                : group.representative.name,
            storagePath: group.representative.storagePath,
            spec:
              specifications[group.representative.storagePath]!.specifications,
            quantity: totalGroupQuantity(group, specifications),
          }))}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
