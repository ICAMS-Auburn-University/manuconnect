'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, CalendarClock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getCreatorOrders,
  getManufacturerOrders,
} from '@/domain/orders/service';
import { OrdersSchema } from '@/types/schemas';
import { AccountType, OrderStatus } from '@/types/enums';
import { abbreviateUUID } from '@/lib/utils/transforms';

const STATUS_STYLE: Record<string, { dot: string; badge: string }> = {
  [OrderStatus.OrderCreated]: {
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  [OrderStatus.ManufacturerOffer]: {
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  [OrderStatus.OrderAccepted]: {
    dot: 'bg-blue-400',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  [OrderStatus.MachineSetup]: {
    dot: 'bg-indigo-400',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  [OrderStatus.StartedManufacturing]: {
    dot: 'bg-[#e87722]',
    badge: 'bg-orange-50 text-[#e87722] border-orange-200',
  },
  [OrderStatus.QualityCheck]: {
    dot: 'bg-purple-400',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  [OrderStatus.Shipped]: {
    dot: 'bg-teal-400',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  [OrderStatus.Completed]: {
    dot: 'bg-green-400',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
};

function formatDueDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (diffDays < 0) return { label: `${formatted} (overdue)`, overdue: true };
  if (diffDays === 0) return { label: 'Due today', overdue: true };
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, overdue: false };
  return { label: `Due ${formatted}`, overdue: false };
}

type ActiveOrdersProps = {
  accountType: AccountType | string;
};

const ActiveOrders = ({ accountType }: ActiveOrdersProps) => {
  const [orders, setOrders] = useState<OrdersSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      const fetchOrders =
        accountType === AccountType.Manufacturer
          ? getManufacturerOrders
          : getCreatorOrders;

      const data = await fetchOrders();
      const active = (data ?? []).filter(
        (order) => !order.isArchived && order.status !== OrderStatus.Completed
      );
      setOrders(active);
      setLoading(false);
    };

    void loadOrders();
  }, [accountType]);

  const emptyHref =
    accountType === AccountType.Manufacturer ? '/orders/browse' : '/orders/new';
  const emptyLabel =
    accountType === AccountType.Manufacturer
      ? 'Browse available orders'
      : 'Create a new order';

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Package className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No active orders</p>
        <Link href={emptyHref}>
          <Button
            size="sm"
            variant="outline"
            className="mt-1 text-[#e87722] border-[#e87722]/40 hover:bg-orange-50"
          >
            {emptyLabel}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const style = STATUS_STYLE[order.status] ?? STATUS_STYLE[OrderStatus.OrderCreated];
        const due = formatDueDate(order.due_date);
        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 group"
          >
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', style.dot)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {order.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.creator_name ?? 'Unknown'} · #{abbreviateUUID(order.id)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn('text-[11px] px-2 py-0 h-5', style.badge)}
              >
                {order.status}
              </Badge>
              <div
                className={cn(
                  'flex items-center gap-1 text-[11px]',
                  due.overdue ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {due.label}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        );
      })}
      <div className="pt-1">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            View all orders →
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ActiveOrders;

