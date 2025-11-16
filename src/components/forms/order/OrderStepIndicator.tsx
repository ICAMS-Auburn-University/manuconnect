import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface OrderStepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function OrderStepIndicator({
  steps,
  currentStep,
}: OrderStepIndicatorProps) {
  return (
    <ol className="flex items-center gap-3 text-sm font-medium text-gray-500">
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1 transition',
                isActive && 'border-blue-500 bg-blue-50 text-blue-600',
                isComplete && 'border-green-500 bg-green-50 text-green-700',
                !isActive && !isComplete && 'border-gray-200 bg-white'
              )}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
                {index + 1}
              </span>
              <span>{label}</span>
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
