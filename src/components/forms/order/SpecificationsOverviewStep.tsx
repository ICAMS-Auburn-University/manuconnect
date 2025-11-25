'use client';

import { CheckCircle, CircleAlert } from 'lucide-react';

import type { AssemblyClientModel } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpecificationsOverviewStepProps {
  assemblies: AssemblyClientModel[];
  onSelectAssembly: (assemblyId: string) => void;
  disableContinue: boolean;
  onContinue: () => void;
}

export function SpecificationsOverviewStep({
  assemblies,
  onSelectAssembly,
  disableContinue,
  onContinue,
}: SpecificationsOverviewStepProps) {
  const hasAssemblies = assemblies.length > 0;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Specifications Overview</h3>
          <p className="text-sm text-muted-foreground">
            Track progress for each assembly. Add specifications for all parts
            before moving on to shipping.
          </p>
        </div>

        {!hasAssemblies ? (
          <p className="text-sm text-muted-foreground">
            Create at least one assembly before defining specifications.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {assemblies.map((assembly) => {
              const complete = assembly.specifications_completed;
              return (
                <Card key={assembly.id} className="border-muted-foreground/40">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{assembly.assembly_name}</span>
                      {complete ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex cursor-help text-amber-500">
                              <CircleAlert className="h-5 w-5" />
                              <span className="sr-only">
                                Specifications missing
                              </span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Add specifications for every part in this assembly.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {assembly.partIds.length} part
                      {assembly.partIds.length === 1 ? '' : 's'} linked
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant={complete ? 'outline' : 'default'}
                      onClick={() => onSelectAssembly(assembly.id)}
                    >
                      {complete
                        ? 'Review specifications'
                        : 'Add specifications'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Continue button handled by global navigation */}
      </div>
    </TooltipProvider>
  );
}
