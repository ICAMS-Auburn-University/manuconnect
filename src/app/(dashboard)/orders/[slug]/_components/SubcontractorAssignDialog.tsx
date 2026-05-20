'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ManufacturerOption {
  id: string;
  companyName: string;
  email: string;
  processes: string[];
  materialCategories: string[];
  certifications: string[];
}

interface SubcontractorAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  partIds: string[];
  excludeUserId?: string;
  onAssigned: () => void;
}

export function SubcontractorAssignDialog({
  open,
  onOpenChange,
  orderId,
  partIds,
  excludeUserId,
  onAssigned,
}: SubcontractorAssignDialogProps) {
  const [manufacturers, setManufacturers] = useState<ManufacturerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchManufacturers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/collaboration/manufacturers`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as {
        manufacturers: ManufacturerOption[];
      };
      // Filter out the lead manufacturer
      const filtered = excludeUserId
        ? json.manufacturers.filter((m) => m.id !== excludeUserId)
        : json.manufacturers;
      setManufacturers(filtered);
    } catch {
      toast.error('Failed to load manufacturers');
    } finally {
      setLoading(false);
    }
  }, [orderId, excludeUserId]);

  useEffect(() => {
    if (open) {
      fetchManufacturers();
      setSelectedId(null);
      setSearch('');
    }
  }, [open, fetchManufacturers]);

  const filtered = manufacturers.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.companyName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.processes.some((p) => p.toLowerCase().includes(q)) ||
      m.materialCategories.some((c) => c.toLowerCase().includes(q))
    );
  });

  const handleAssign = async () => {
    const manufacturer = manufacturers.find((m) => m.id === selectedId);
    if (!manufacturer) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/collaboration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partIds,
          manufacturerId: manufacturer.id,
          manufacturerName: manufacturer.companyName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign');
      }

      toast.success(
        `${partIds.length} part${partIds.length === 1 ? '' : 's'} assigned to ${manufacturer.companyName}`
      );
      onAssigned();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to assign parts';
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Parts to Subcontractor</DialogTitle>
          <DialogDescription>
            Select a manufacturer to subcontract{' '}
            <span className="font-semibold text-foreground">
              {partIds.length} part{partIds.length === 1 ? '' : 's'}
            </span>{' '}
            to. They will receive these parts to manufacture and ship back to
            you for final assembly.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company, capability…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Manufacturer list */}
        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {search
                ? 'No manufacturers match your search'
                : 'No other manufacturers found on the platform'}
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    selectedId === m.id
                      ? 'border-[#e87722] bg-orange-50/50 ring-1 ring-[#e87722]/40'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-muted/40'
                  )}
                  onClick={() => setSelectedId(m.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#0c2340] flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {m.companyName}
                        </p>
                        {selectedId === m.id && (
                          <CheckCircle2 className="h-4 w-4 text-[#e87722] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.email}
                      </p>
                      {/* Capabilities */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.processes.slice(0, 4).map((proc) => (
                          <Badge
                            key={proc}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {proc}
                          </Badge>
                        ))}
                        {m.materialCategories.slice(0, 3).map((mat) => (
                          <Badge
                            key={mat}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                          >
                            {mat}
                          </Badge>
                        ))}
                        {m.processes.length + m.materialCategories.length > 7 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            +
                            {m.processes.length +
                              m.materialCategories.length -
                              7}{' '}
                            more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#e87722] hover:bg-[#d06a1e] text-white"
            disabled={!selectedId || assigning}
            onClick={handleAssign}
          >
            {assigning && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Assign {partIds.length} part{partIds.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
