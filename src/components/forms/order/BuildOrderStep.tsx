'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

import type { AssemblyClientModel } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BuildOrderStepProps {
  assemblies: AssemblyClientModel[];
  onConfirmOrder: (assemblyIds: string[]) => Promise<void>;
  isSaving: boolean;
}

export function BuildOrderStep({
  assemblies,
  onConfirmOrder,
  isSaving,
}: BuildOrderStepProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setOrderedIds(assemblies.map((assembly) => assembly.id));
    const needsSave = assemblies.some((assembly, index) => {
      if (assembly.build_order == null) {
        return true;
      }
      return assembly.build_order !== index + 1;
    });
    setIsDirty(needsSave);
  }, [assemblies]);

  const orderedAssemblies = useMemo(() => {
    const byId = new Map(assemblies.map((assembly) => [assembly.id, assembly]));
    return orderedIds
      .map((id) => byId.get(id))
      .filter((assembly): assembly is AssemblyClientModel => Boolean(assembly));
  }, [assemblies, orderedIds]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setOrderedIds((prev) => {
      const next = [...prev];
      if (direction === 'up' && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      }
      if (direction === 'down' && index < next.length - 1) {
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleConfirm = async () => {
    try {
      await onConfirmOrder(orderedIds);
      toast.success('Build order saved.');
      setIsDirty(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save build order';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Organize build sequence</h3>
        <p className="text-sm text-muted-foreground">
          Drag or nudge assemblies into the order you plan to manufacture them.
          We will save the numbering for downstream tracking.
        </p>
      </div>

      {orderedAssemblies.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create at least one assembly to define a build order.
        </p>
      ) : (
        <div className="space-y-3">
          {orderedAssemblies.map((assembly, index) => (
            <Card key={assembly.id} className="border-dashed">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold">
                    Phase {index + 1}: {assembly.assembly_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assembly.partIds.length} part
                    {assembly.partIds.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === orderedAssemblies.length - 1}
                    onClick={() => handleMove(index, 'down')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  {assembly.build_order ? (
                    <Badge variant="secondary">
                      Saved #{assembly.build_order}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        type="button"
        onClick={handleConfirm}
        disabled={orderedAssemblies.length === 0 || isSaving || !isDirty}
      >
        {isSaving ? 'Saving…' : 'Confirm build order'}
      </Button>
    </div>
  );
}
