'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ManufacturerCapabilitiesStep from '@/components/onboarding/ManufacturerCapabilitiesStep';
import { saveManufacturerProfile } from '@/domain/manufacturing/profile';
import { CheckCircle2, Circle, Factory } from 'lucide-react';

interface ManufacturerProfileEditorProps {
  initialData: {
    processes: string[];
    materialCategories: string[];
    certifications: string[];
  };
}

export default function ManufacturerProfileEditor({
  initialData,
}: ManufacturerProfileEditorProps) {
  const [processes, setProcesses] = useState<string[]>(initialData.processes);
  const [materialCategories, setMaterialCategories] = useState<string[]>(
    initialData.materialCategories
  );
  const [certifications, setCertifications] = useState<string[]>(
    initialData.certifications
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasProfile =
    initialData.processes.length > 0 &&
    initialData.materialCategories.length > 0;

  const hasChanges =
    JSON.stringify(processes) !== JSON.stringify(initialData.processes) ||
    JSON.stringify(materialCategories) !==
      JSON.stringify(initialData.materialCategories) ||
    JSON.stringify(certifications) !==
      JSON.stringify(initialData.certifications);

  const checklist = [
    {
      label: 'Manufacturing processes added',
      done: processes.length > 0,
      required: true,
    },
    {
      label: 'Material categories added',
      done: materialCategories.length > 0,
      required: true,
    },
    {
      label: 'Quality certifications added',
      done: certifications.length > 0,
      required: false,
    },
  ];
  const requiredDone = checklist.filter((c) => c.required && c.done).length;
  const requiredTotal = checklist.filter((c) => c.required).length;
  const completionPercent = Math.round((requiredDone / requiredTotal) * 100);
  const isComplete = requiredDone === requiredTotal;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await saveManufacturerProfile({
        processes,
        materialCategories,
        certifications,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/95 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Capability Completion
              </h3>
              <p className="text-sm text-muted-foreground">
                {isComplete
                  ? 'Your shop is set up to be matched with orders.'
                  : 'Finish the required steps to appear in order matching.'}
              </p>
            </div>
          </div>
          <Badge variant={isComplete ? 'secondary' : 'outline'}>
            {completionPercent}% complete
          </Badge>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {checklist.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className={item.done ? 'text-foreground' : ''}>
                {item.label}
              </span>
              {!item.required && (
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {hasProfile && (
        <div className="rounded-xl border border-border/70 bg-background/70 p-4 space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">
            Current Capabilities
          </h3>
          <div className="flex flex-wrap gap-2">
            {processes.map((p) => (
              <Badge key={p} variant="secondary">
                {p}
              </Badge>
            ))}
            {materialCategories.map((m) => (
              <Badge key={m} variant="outline">
                {m}
              </Badge>
            ))}
            {certifications.map((c) => (
              <Badge key={c} variant="default">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ManufacturerCapabilitiesStep
        processes={processes}
        materialCategories={materialCategories}
        certifications={certifications}
        onProcessesChange={setProcesses}
        onMaterialCategoriesChange={setMaterialCategories}
        onCertificationsChange={setCertifications}
        errors={
          error
            ? {
                processes: processes.length === 0 ? error : undefined,
                materialCategories:
                  materialCategories.length === 0 ? error : undefined,
              }
            : undefined
        }
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm">Profile saved successfully.</p>
      )}

      <Button
        className="bg-[#e87722] text-white w-full rounded-full"
        onClick={handleSave}
        disabled={isSaving || (!hasChanges && hasProfile)}
      >
        {isSaving
          ? 'Saving...'
          : hasProfile
            ? 'Update Profile'
            : 'Save Profile'}
      </Button>
    </div>
  );
}

