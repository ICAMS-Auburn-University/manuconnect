'use client';

import { ChangeEvent } from 'react';
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
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500">
                  <UploadCloud className="h-8 w-8 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {field.value instanceof File
                      ? field.value.name
                      : 'Drop your .step or .iges file here, or click to select'}
                  </span>
                  <input
                    type="file"
                    accept=".step,.stp,.iges,.igs"
                    className="hidden"
                    onChange={handleChange}
                  />
                </label>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onProcessFile}
          disabled={isProcessing || !(form.getValues().cadFile instanceof File)}
        >
          {isProcessing ? 'Processing assembly…' : 'Process assembly'}
        </Button>
        <p className="text-sm text-gray-500">
          We store the original file and its parts in Supabase for you.
        </p>
      </div>

      {isProcessing && (
        <p className="text-sm text-muted-foreground">
          Splitting file into parts...
        </p>
      )}

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {splitResult && <CadSplitViewer splitResult={splitResult} />}
    </div>
  );
}
