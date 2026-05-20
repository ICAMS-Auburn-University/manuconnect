'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { SPECIFICATIONS } from '@/lib/specifications';

interface ManufacturerCapabilitiesStepProps {
  processes: string[];
  materialCategories: string[];
  certifications: string[];
  onProcessesChange: (processes: string[]) => void;
  onMaterialCategoriesChange: (categories: string[]) => void;
  onCertificationsChange: (certifications: string[]) => void;
  errors?: {
    processes?: string;
    materialCategories?: string;
    certifications?: string;
  };
}

const PROCESS_OPTIONS = SPECIFICATIONS.PROCESSES;
const MATERIAL_CATEGORY_OPTIONS = Object.keys(SPECIFICATIONS.MATERIALS);
const CERTIFICATION_OPTIONS = SPECIFICATIONS.QUALITY_STANDARDS;

function toggleItem(list: string[], item: string): string[] {
  return list.includes(item)
    ? list.filter((i) => i !== item)
    : [...list, item];
}

export default function ManufacturerCapabilitiesStep({
  processes,
  materialCategories,
  certifications,
  onProcessesChange,
  onMaterialCategoriesChange,
  onCertificationsChange,
  errors,
}: ManufacturerCapabilitiesStepProps) {
  return (
    <div className="space-y-8">
      {/* Processes */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-medium text-base">
            Manufacturing Processes <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Select all processes your shop can perform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROCESS_OPTIONS.map((process) => (
            <label
              key={process}
              className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={processes.includes(process)}
                onCheckedChange={() =>
                  onProcessesChange(toggleItem(processes, process))
                }
              />
              <span className="text-sm">{process}</span>
            </label>
          ))}
        </div>
        {errors?.processes && (
          <p className="text-sm text-red-500">{errors.processes}</p>
        )}
      </div>

      {/* Material Categories */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-medium text-base">
            Material Categories <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Select the material categories you work with.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MATERIAL_CATEGORY_OPTIONS.map((category) => (
            <label
              key={category}
              className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={materialCategories.includes(category)}
                onCheckedChange={() =>
                  onMaterialCategoriesChange(
                    toggleItem(materialCategories, category)
                  )
                }
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
        {errors?.materialCategories && (
          <p className="text-sm text-red-500">{errors.materialCategories}</p>
        )}
      </div>

      {/* Certifications */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-medium text-base">Certifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select any quality certifications your shop holds. (Optional)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CERTIFICATION_OPTIONS.map((cert) => (
            <label
              key={cert}
              className="flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={certifications.includes(cert)}
                onCheckedChange={() =>
                  onCertificationsChange(toggleItem(certifications, cert))
                }
              />
              <span className="text-sm">{cert}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
