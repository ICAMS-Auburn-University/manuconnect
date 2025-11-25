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
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Step {currentStep + 1} of {steps.length}
      </p>
      <ol className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
        {steps.map((label, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  'order-step-pill',
                  isActive && 'order-step-pill--active',
                  isComplete && 'order-step-pill--complete',
                  !isActive && !isComplete && 'order-step-pill--pending'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="order-step-pill__index inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
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
    </div>
  );
}
