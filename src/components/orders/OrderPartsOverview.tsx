'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrderPartsBreakdown } from '@/domain/manufacturing/browse';
import type { OrderPartsBreakdown } from '@/domain/manufacturing/browse';
import { cn } from '@/lib/utils';
import { TONE } from '@/lib/utils/tones';
import { CapabilityMatchLabels } from './CapabilityMatchLabels';

interface OrderPartsOverviewProps {
  orderId: string;
  /** Show the "fits your shop" column (manufacturer view). */
  showMatch?: boolean;
}

export default function OrderPartsOverview({
  orderId,
  showMatch = false,
}: OrderPartsOverviewProps) {
  const [breakdown, setBreakdown] = useState<OrderPartsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrderPartsBreakdown(orderId)
      .then((data) => {
        if (!cancelled) setBreakdown(data);
      })
      .catch((error) => {
        console.error('Failed to load parts overview', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading parts…
      </div>
    );
  }

  if (!breakdown || breakdown.totalParts === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No parts have been uploaded for this order yet.
      </p>
    );
  }

  const withSpecs = breakdown.parts.filter(
    (part) => part.material || part.processType
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {breakdown.totalParts} part{breakdown.totalParts === 1 ? '' : 's'}
        </span>
        <span aria-hidden>·</span>
        <span>
          {withSpecs} with specifications
          {withSpecs < breakdown.totalParts &&
            ` (${breakdown.totalParts - withSpecs} missing)`}
        </span>
        {showMatch && breakdown.hasProfile && breakdown.matchingParts > 0 && (
          <Badge variant="outline" className={cn('ml-auto', TONE.emerald)}>
            {breakdown.matchingParts} match process and material
          </Badge>
        )}
      </div>

      <div className="max-h-96 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part</TableHead>
              <TableHead>Assembly</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Process</TableHead>
              {showMatch && breakdown.hasProfile && (
                <TableHead className="text-right">Fit</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.parts.map((part) => (
              <TableRow key={part.partId}>
                <TableCell className="font-medium">{part.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {part.assemblyName ?? 'Individual part'}
                </TableCell>
                <TableCell>
                  {part.material ?? (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                  {part.materialCategory && (
                    <span className="block text-xs text-muted-foreground">
                      {part.materialCategory}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {part.processType ?? (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                  {part.operations.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {part.operations.join(', ')}
                    </span>
                  )}
                </TableCell>
                {showMatch && breakdown.hasProfile && (
                  <TableCell className="text-right">
                    <CapabilityMatchLabels process={part.processMatch} material={part.materialMatch} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
