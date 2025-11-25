'use client';

import { ChangeEvent, useId, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { OrderFormValues } from './schema';
import { SplitAssemblyResult } from '@/domain/cad/types';
import { CadSplitViewer } from '@/components/cad/CadSplitViewer';

interface CadProcessingStepProps {
  splitResult: SplitAssemblyResult | null;
  onProcessFile: () => Promise<void>;
  onFileSelected: (file: File | null) => void;
  isProcessing: boolean;
  errorMessage: string | null;
}

export function CadProcessingStep({
  splitResult,
  onProcessFile,
  onFileSelected,
  isProcessing,
  errorMessage,
}: CadProcessingStepProps) {
  const form = useFormContext<OrderFormValues>();
  const hasSelectedFile = form.watch('cadFile') instanceof File;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="cadFile"
        render={({ field }) => {
          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0] ?? null;
            field.onChange(file);
            onFileSelected(file);
          };
          const hasFile = field.value instanceof File;
          const currentFile =
            field.value instanceof File ? (field.value as File) : null;

          return (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                CAD Assembly File
              </FormLabel>
              <FormDescription>
                Upload a STEP or IGES assembly. We will split this into
                individual part files and auto-populate metadata where possible.
              </FormDescription>
              <FormControl>
                <input
                  id={fileInputId}
                  ref={(node) => {
                    fileInputRef.current = node;
                  }}
                  type="file"
                  accept=".step,.stp,.iges,.igs"
                  className="hidden"
                  onChange={handleChange}
                />
              </FormControl>
              {hasFile && currentFile ? (
                <div className="flex flex-col gap-3 rounded border border-gray-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {currentFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace file
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Uploading a new file will replace the existing CAD parts.
                  </p>
                </div>
              ) : (
                <label
                  htmlFor={fileInputId}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500"
                >
                  <UploadCloud className="h-8 w-8 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    Drop your .step or .iges file here, or click to select
                  </span>
                </label>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <div className="text-sm text-gray-500">
        {isProcessing
          ? 'Processing assembly… this may take a moment.'
          : hasSelectedFile
            ? 'Assembly ready. Replace the file if you need to reprocess.'
            : 'Upload a CAD file to split parts automatically.'}
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {splitResult && <CadSplitViewer splitResult={splitResult} />}
    </div>
  );
}
