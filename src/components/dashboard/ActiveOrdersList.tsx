'use client';

import Link from 'next/link';
import { useState } from 'react';

import ArchiveButton from '@/components/feedback/ArchiveButton';
import { cn } from '@/lib/utils';
import { abbreviateUUID } from '@/lib/utils/transforms';
import type {
  ActiveOrderSummary,
  DerivedOrderStatus,
} from './active-orders.types';

interface ActiveOrdersListProps {
  orders: ActiveOrderSummary[];
}

const statusStyles: Record<DerivedOrderStatus, string> = {
  Draft: 'bg-slate-100 text-slate-800 border border-slate-200',
  'Finding Manufacturers':
    'bg-amber-100 text-amber-900 border border-amber-200',
  'Building In Progress': 'bg-blue-100 text-blue-900 border border-blue-200',
  'Quality Check': 'bg-indigo-100 text-indigo-900 border border-indigo-200',
  Shipping: 'bg-purple-100 text-purple-900 border border-purple-200',
  Completed: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
};

const ActiveOrdersList = ({ orders }: ActiveOrdersListProps) => {
  const [entries, setEntries] = useState(orders);

  const handleArchive = (orderId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.order.id !== orderId));
  };

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No active orders yet. Create an order to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const orderUrl = `/orders/${entry.order.id}`;
        return (
          <div
            key={entry.order.id}
            className="rounded-xl border border-muted-foreground/30 bg-muted/50 transition hover:border-orange-200 hover:bg-orange-50 focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2"
          >
            <Link
              href={orderUrl}
              className="block px-4 py-4 focus:outline-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Order #{abbreviateUUID(entry.order.id)}
                  </p>
                  <h4 className="text-base font-semibold">
                    {entry.order.title}
                  </h4>
                </div>
                <div
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    statusStyles[entry.status]
                  )}
                >
                  {entry.status}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {entry.awaitingManufacturers > 0
                    ? `Awaiting manufacturers for ${entry.awaitingManufacturers} assembly${
                        entry.awaitingManufacturers === 1 ? '' : 'ies'
                      }.`
                    : 'All manufacturers assigned.'}
                </span>
                <span className="text-xs">
                  Updated{' '}
                  {new Date(entry.order.last_update).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Assemblies: {entry.totalAssemblies || 0}</span>
                <span>
                  Completed: {entry.completedAssemblies}/
                  {entry.totalAssemblies || 0}
                </span>
                <span>
                  Due {new Date(entry.order.due_date).toLocaleDateString()}
                </span>
              </div>
            </Link>

            {entry.status === 'Completed' && (
              <div className="border-t border-muted-foreground/20 px-4 py-3 flex justify-end">
                <ArchiveButton order={entry.order} onArchive={handleArchive} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ActiveOrdersList;
