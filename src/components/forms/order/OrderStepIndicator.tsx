import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface OrderStepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function OrderStepIndicator({
  steps,
  currentStep,
}: OrderStepIndicatorProps) {
  const total = steps.length;
  const progressPercent = total > 1 ? (currentStep / (total - 1)) * 100 : 0;

  return (
    <div className="w-full space-y-4">
      {/* Progress bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Current step label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {currentStep + 1}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {steps[currentStep]}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {total}
        </span>
      </div>

      {/* Step dots */}
      <ol className="flex items-center justify-center gap-2">
        {steps.map((label, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <li key={label} className="group relative flex flex-col items-center">
              <div
                className={cn(
                  'rounded-full transition-all duration-300',
                  isActive && 'h-3 w-8 bg-primary',
                  isComplete && 'h-3 w-3 bg-emerald-500',
                  !isActive && !isComplete && 'h-3 w-3 bg-muted-foreground/30'
                )}
              />
              {/* Tooltip */}
              <span className="pointer-events-none absolute -bottom-8 z-10 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {isComplete && (
                  <Check className="mr-1 inline h-3 w-3 text-green-400" />
                )}
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
