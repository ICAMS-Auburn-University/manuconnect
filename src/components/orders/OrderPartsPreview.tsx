'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TONE } from '@/lib/utils/tones';
import { getOrderPartsBreakdown } from '@/domain/manufacturing/browse';
import type {
  OrderPartSummary,
  OrderPartsBreakdown,
} from '@/domain/manufacturing/browse';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Wrench,
  Layers,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CapabilityMatchLabels } from './CapabilityMatchLabels';

interface OrderPartsPreviewProps {
  orderId: string;
  selectedPartIds: string[];
  onSelectionChange: (partIds: string[]) => void;
  onBreakdownChange?: (breakdown: OrderPartsBreakdown | null) => void;
}

export default function OrderPartsPreview({
  orderId,
  selectedPartIds,
  onSelectionChange,
  onBreakdownChange,
}: OrderPartsPreviewProps) {
  const [breakdown, setBreakdown] = useState<OrderPartsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [expandedAssemblies, setExpandedAssemblies] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setBreakdown(null);
    onBreakdownChange?.(null);
    getOrderPartsBreakdown(orderId).then((data) => {
      if (!cancelled) {
        setBreakdown(data);
        onBreakdownChange?.(data);
        setLoading(false);
        // Expand all assemblies by default
        const assemblyIds = new Set(
          data.parts
            .map((p) => p.assemblyId)
            .filter((id): id is string => id !== null)
        );
        setExpandedAssemblies(assemblyIds);
      }
    }).catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, onBreakdownChange, retry]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading parts...</span>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="flex items-center gap-3 text-sm text-destructive">
      Could not load part requirements.
      <Button type="button" size="sm" variant="outline" onClick={() => setRetry((value) => value + 1)}>Retry</Button>
    </div>;
  }

  if (!breakdown || breakdown.totalParts === 0) {
    return (
      <div className="text-sm text-muted-foreground py-3">
        No parts have been uploaded for this order yet.
      </div>
    );
  }

  const toggleAssembly = (id: string) => {
    setExpandedAssemblies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePart = (partId: string) => {
    if (selectedPartIds.includes(partId)) {
      onSelectionChange(selectedPartIds.filter((id) => id !== partId));
    } else {
      onSelectionChange([...selectedPartIds, partId]);
    }
  };

  const selectAllMatching = () => {
    const matchingIds = breakdown.parts
      .filter((p) => p.matchesCapabilities)
      .map((p) => p.partId);
    onSelectionChange(matchingIds);
  };

  const selectAll = () => {
    onSelectionChange(breakdown.parts.map((p) => p.partId));
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  // Group parts by assembly
  const unassigned = breakdown.parts.filter((p) => !p.assemblyId);
  const assemblyGroups = new Map<string, OrderPartSummary[]>();
  for (const part of breakdown.parts) {
    if (part.assemblyId) {
      const group = assemblyGroups.get(part.assemblyId) ?? [];
      group.push(part);
      assemblyGroups.set(part.assemblyId, group);
    }
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {breakdown.totalParts} part
            {breakdown.totalParts !== 1 ? 's' : ''}
          </span>
          {breakdown.hasProfile && breakdown.matchingParts > 0 && (
            <Badge variant="outline" className={cn('ml-1', TONE.green)}>
              {breakdown.matchingParts} match process and material
            </Badge>
          )}
        </div>
        <div className="flex gap-2 text-xs">
          {breakdown.hasProfile && breakdown.matchingParts > 0 && (
            <button
              onClick={selectAllMatching}
              className="text-brand hover:underline"
            >
              Select matching
            </button>
          )}
          <button onClick={selectAll} className="text-brand hover:underline">
            All
          </button>
          {selectedPartIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-muted-foreground hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!breakdown.hasProfile && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-md border p-2.5',
            TONE.amber
          )}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            <Link href="/profile" className="font-medium hover:underline">
              Complete your Shop Profile
            </Link>{' '}
            to see which parts match your capabilities.
          </p>
        </div>
      )}

      {/* Assembly groups */}
      {Array.from(assemblyGroups.entries()).map(([assemblyId, parts]) => {
        const isExpanded = expandedAssemblies.has(assemblyId);
        const assemblyName = parts[0]?.assemblyName ?? 'Assembly';
        const matchCount = parts.filter((p) => p.matchesCapabilities).length;
        const selectedCount = parts.filter((p) =>
          selectedPartIds.includes(p.partId)
        ).length;

        return (
          <div key={assemblyId} className="border rounded-md overflow-hidden">
            <button
              onClick={() => toggleAssembly(assemblyId)}
              className="flex items-center justify-between w-full px-3 py-2 bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{assemblyName}</span>
                <span className="text-xs text-muted-foreground">
                  {parts.length} part{parts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCount} selected
                  </Badge>
                )}
                {breakdown.hasProfile && matchCount > 0 && (
                  <Badge
                    variant="outline"
                    className={cn('text-xs', TONE.green)}
                  >
                    {matchCount} match
                  </Badge>
                )}
              </div>
            </button>
            {isExpanded && (
              <div className="divide-y">
                {parts.map((part) => (
                  <PartRow
                    key={part.partId}
                    part={part}
                    isSelected={selectedPartIds.includes(part.partId)}
                    onToggle={() => togglePart(part.partId)}
                    showMatch={breakdown.hasProfile}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned parts */}
      {unassigned.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          {assemblyGroups.size > 0 && (
            <div className="px-3 py-2 bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">
                Individual Parts
              </span>
            </div>
          )}
          <div className="divide-y">
            {unassigned.map((part) => (
              <PartRow
                key={part.partId}
                part={part}
                isSelected={selectedPartIds.includes(part.partId)}
                onToggle={() => togglePart(part.partId)}
                showMatch={breakdown.hasProfile}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPartIds.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {selectedPartIds.length} part
          {selectedPartIds.length !== 1 ? 's' : ''} selected for your offer
        </div>
      )}
    </div>
  );
}

function PartRow({
  part,
  isSelected,
  onToggle,
  showMatch,
}: {
  part: OrderPartSummary;
  isSelected: boolean;
  onToggle: () => void;
  showMatch: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/30'
          : part.matchesCapabilities && showMatch
            ? 'bg-green-50/50 dark:bg-green-950/20'
            : 'hover:bg-muted/50'
      }`}
      onClick={onToggle}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onToggle} aria-label={`Select ${part.name}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{part.name}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {part.processType && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {part.processType}
            </Badge>
          )}
          {part.material && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {part.material}
            </Badge>
          )}
          {part.materialCategory && !part.material && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {part.materialCategory}
            </Badge>
          )}
        </div>
      </div>
      {showMatch && <CapabilityMatchLabels process={part.processMatch} material={part.materialMatch} />}
    </div>
  );
}
