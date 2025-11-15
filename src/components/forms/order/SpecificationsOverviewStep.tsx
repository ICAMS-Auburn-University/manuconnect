'use client';

import { CheckCircle, CircleAlert } from 'lucide-react';

import type { AssemblyClientModel } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                      <CircleAlert className="h-5 w-5 text-amber-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    {complete ? 'Review specifications' : 'Add specifications'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={onContinue} disabled={disableContinue}>
          Continue to shipping
        </Button>
      </div>
    </div>
  );
}
