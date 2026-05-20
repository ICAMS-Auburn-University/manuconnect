'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ManufacturerCapabilitiesStep from '@/components/onboarding/ManufacturerCapabilitiesStep';
import { saveManufacturerProfile } from '@/domain/manufacturing/profile';

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

  const hasProfile = initialData.processes.length > 0;

  const hasChanges =
    JSON.stringify(processes) !== JSON.stringify(initialData.processes) ||
    JSON.stringify(materialCategories) !==
      JSON.stringify(initialData.materialCategories) ||
    JSON.stringify(certifications) !==
      JSON.stringify(initialData.certifications);

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
      {!hasProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm font-medium">
            Your shop profile is incomplete. Select your capabilities below so
            we can match you with relevant orders.
          </p>
        </div>
      )}

      {hasProfile && (
        <div className="border rounded-lg p-4 space-y-3">
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
