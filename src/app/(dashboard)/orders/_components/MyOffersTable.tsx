'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HandCoins, Loader2, Search } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMyOffers, withdrawOffer } from '@/domain/offers/service';
import { SELECTED_ORDER_STORAGE_KEY } from '@/components/dashboard/BrowseOrdersCard';
import type { MyOfferEntry, MyOfferStatus } from '@/domain/offers/types';
import { cn } from '@/lib/utils';
import { TONE, type Tone } from '@/lib/utils/tones';
import { abbreviateUUID } from '@/lib/utils/transforms';
import { formatFullDate, formatRelativeDate } from '@/lib/utils/dates';

type OfferFilter = 'all' | 'pending' | 'accepted' | 'closed';

const STATUS_META: Record<MyOfferStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting decision', tone: 'amber' },
  accepted: { label: 'Accepted', tone: 'green' },
  declined: { label: 'Declined', tone: 'red' },
  not_selected: { label: 'Another shop selected', tone: 'neutral' },
  order_closed: { label: 'Order closed', tone: 'neutral' },
};

const FILTER_LABELS: Record<OfferFilter, string> = {
  all: 'All',
  pending: 'Awaiting decision',
  accepted: 'Accepted',
  closed: 'Closed',
};

function matchesFilter(status: MyOfferStatus, filter: OfferFilter) {
  if (filter === 'all') return true;
  if (filter === 'closed') {
    return (
      status === 'declined' ||
      status === 'not_selected' ||
      status === 'order_closed'
    );
  }
  return status === filter;
}

const currency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function MyOffersTable({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const [entries, setEntries] = useState<MyOfferEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OfferFilter>(pendingOnly ? 'pending' : 'all');
  const [query, setQuery] = useState('');
  const [toWithdraw, setToWithdraw] = useState<MyOfferEntry | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    setFilter(pendingOnly ? 'pending' : 'all');
  }, [pendingOnly]);

  const load = useCallback(async () => {
    setLoading(true);
    setEntries(await getMyOffers());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<OfferFilter, number> = {
      all: entries.length,
      pending: 0,
      accepted: 0,
      closed: 0,
    };
    entries.forEach((entry) => {
      (['pending', 'accepted', 'closed'] as const).forEach((key) => {
        if (matchesFilter(entry.status, key)) result[key] += 1;
      });
    });
    return result;
  }, [entries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!matchesFilter(entry.status, filter)) return false;
      if (!q) return true;
      return (
        (entry.order?.title ?? '').toLowerCase().includes(q) ||
        entry.offer.order_id.toLowerCase().includes(q) ||
        (entry.order?.creator_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, filter, query]);

  const confirmWithdraw = async () => {
    if (!toWithdraw) return;
    setWithdrawing(true);
    try {
      const result = await withdrawOffer(toWithdraw.offer.id);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to withdraw offer');
        return;
      }
      toast.success('Offer withdrawn');
      setEntries((prev) =>
        prev.filter((entry) => entry.offer.id !== toWithdraw.offer.id)
      );
      setToWithdraw(null);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <HandCoins className="h-8 w-8 text-muted-foreground/50" />
        <div>
          <p className="font-medium">You haven&apos;t sent any offers yet</p>
          <p className="text-sm text-muted-foreground">
            Offers you submit appear here so you can track the creator&apos;s
            decision.
          </p>
        </div>
        <Button asChild className="bg-brand text-white hover:bg-brand-100">
          <Link href="/orders/browse">Browse orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABELS) as OfferFilter[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? 'default' : 'outline'}
            className={cn(
              'h-8',
              filter === key && 'bg-[#0c2340] text-white hover:bg-[#0c2340]/90 dark:bg-brand dark:hover:bg-brand-100'
            )}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]}
            <span className="ml-1.5 text-xs opacity-80">{counts[key]}</span>
          </Button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by order or creator…"
            className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No offers match this view.
        </p>
      ) : (
        <Table className="body-1 mb-8">
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Your quote</TableHead>
              <TableHead>Lead time</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(({ offer, order, status }) => {
              const meta = STATUS_META[status];
              const total =
                parseFloat(offer.unit_cost) * parseInt(offer.projected_units, 10) +
                parseFloat(offer.shipping_cost);
              const scope = offer.part_ids?.length
                ? `${offer.part_ids.length} part${offer.part_ids.length === 1 ? '' : 's'}`
                : 'Full order';

              return (
                <TableRow key={offer.id}>
                  <TableCell>
                    <p className="font-medium">
                      {order?.title ?? 'Order unavailable'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{abbreviateUUID(offer.order_id)}
                      {order?.creator_name ? ` · ${order.creator_name}` : ''}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(TONE[meta.tone])}>
                      {meta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-medium">
                      {Number.isFinite(total) ? currency(total) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parseInt(offer.projected_units, 10).toLocaleString()} units ·{' '}
                      {scope}
                    </p>
                  </TableCell>
                  <TableCell>{offer.lead_time} mo</TableCell>
                  <TableCell title={formatFullDate(offer.created_at)}>
                    {formatRelativeDate(offer.created_at)}
                  </TableCell>
                  <TableCell>
                    {order?.due_date
                      ? new Date(order.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {status === 'accepted' && order && (
                        <Button
                          asChild
                          size="sm"
                          className="bg-brand text-white hover:bg-brand-100"
                        >
                          <Link href={`/orders/${order.id}`}>Open job</Link>
                        </Button>
                      )}
                      {status === 'pending' && (
                        <>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href="/orders/browse"
                              onClick={() =>
                                window.localStorage.setItem(
                                  SELECTED_ORDER_STORAGE_KEY,
                                  offer.order_id
                                )
                              }
                            >
                              View order
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setToWithdraw({ offer, order, status })
                            }
                          >
                            Withdraw
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={toWithdraw !== null}
        onOpenChange={(open) => !open && !withdrawing && setToWithdraw(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw this offer?</DialogTitle>
            <DialogDescription>
              The creator will no longer see your quote for &ldquo;
              {toWithdraw?.order?.title ?? 'this order'}&rdquo;. You can submit a
              new offer from Browse Orders at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToWithdraw(null)}
              disabled={withdrawing}
            >
              Keep offer
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmWithdraw()}
              disabled={withdrawing}
            >
              {withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
