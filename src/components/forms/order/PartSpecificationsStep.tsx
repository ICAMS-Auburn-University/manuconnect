'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, CircleDashed } from 'lucide-react';

import type { PartSummary } from '@/domain/cad/types';
import type {
  AssemblyClientModel,
  PartSpecificationState,
  SpecificationDraft,
} from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpecificationWizard } from './SpecificationWizard';
import { formatPartLocation } from '@/domain/cad/format';

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
        <div className="space-y-3">
          {resolvedParts.map((part) => {
            const specRecord = specifications[part.storagePath];
            const isComplete = Boolean(specRecord);
            return (
              <Card key={part.storagePath}>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="break-words min-w-0 truncate">
                      {part.name}
                    </span>
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <CircleDashed className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {isComplete ? (
                    <p className="text-xs text-muted-foreground">
                      {specRecord.specifications.material.material} |{' '}
                      {specRecord.specifications.process.type}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Not configured
                    </p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant={isComplete ? 'outline' : 'default'}
                    onClick={() => openWizard(part.storagePath)}
                  >
                    {isComplete
                      ? 'Edit specifications'
                      : 'Configure specifications'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
        onClose={() => setWizardOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
