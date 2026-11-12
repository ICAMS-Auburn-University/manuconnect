'use client';

import Link from 'next/link';
import { Package, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrdersSchema } from '@/types/schemas';
import { OrderStatus } from '@/types/enums';
import ArchiveButton from '@/components/feedback/ArchiveButton';
import { useMemo, useState } from 'react';
import { abbreviateUUID } from '@/lib/utils/transforms';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_TONE, TONE } from '@/lib/utils/tones';
import { daysUntil, formatFullDate, formatRelativeDate } from '@/lib/utils/dates';

interface ManufacturerOrdersTableProps {
  Orders: OrdersSchema[];
  currentUserId?: string;
}

type OrderView = 'active' | 'completed' | 'archived';

const VIEW_LABELS: Record<OrderView, string> = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

function viewOf(order: OrdersSchema): OrderView {
  if (order.isArchived) return 'archived';
  if (order.status === OrderStatus.Completed) return 'completed';
  return 'active';
}

const ManufacturerOrdersTable: React.FC<ManufacturerOrdersTableProps> = ({
  Orders,
  currentUserId,
}) => {
  const [orders, setOrders] = useState(Orders);
  const [view, setView] = useState<OrderView>('active');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const result: Record<OrderView, number> = {
      active: 0,
      completed: 0,
      archived: 0,
    };
    orders.forEach((order) => {
      result[viewOf(order)] += 1;
    });
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((order) => viewOf(order) === view)
      .filter(
        (order) =>
          !q ||
          order.title.toLowerCase().includes(q) ||
          order.id.toLowerCase().includes(q) ||
          (order.creator_name ?? '').toLowerCase().includes(q)
      )
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
  }, [orders, view, query]);

  const handleArchive = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, isArchived: true } : order
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(VIEW_LABELS) as OrderView[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={view === key ? 'default' : 'outline'}
            className={cn(
              'h-8',
              view === key &&
                'bg-[#0c2340] text-white hover:bg-[#0c2340]/90 dark:bg-brand dark:hover:bg-brand-100'
            )}
            onClick={() => setView(key)}
          >
            {VIEW_LABELS[key]}
            <span className="ml-1.5 text-xs opacity-80">{counts[key]}</span>
          </Button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, # or creator…"
            className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-14 text-center">
          <Package className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">
            {query
              ? 'No orders match your search'
              : view === 'active'
                ? 'No active jobs right now'
                : `No ${view} orders`}
          </p>
          {view === 'active' && !query && (
            <Button asChild variant="outline" size="sm">
              <Link href="/orders/browse">Browse available orders</Link>
            </Button>
          )}
        </div>
      ) : (
        <Table className="body-1 mb-16">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOrders.map((order) => {
              const isSubcontract =
                !!currentUserId && order.manufacturer !== currentUserId;
              const days = daysUntil(order.due_date);
              const overdue = view === 'active' && days < 0;
              return (
                <TableRow key={order.id}>
                  <TableCell>#{abbreviateUUID(order.id)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{order.title}</span>
                      {isSubcontract && (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0', TONE.neutral)}
                        >
                          Subcontract
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        TONE[ORDER_STATUS_TONE[order.status] ?? 'neutral']
                      )}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      overdue && 'font-medium text-red-600 dark:text-red-400'
                    )}
                  >
                    {new Date(order.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {overdue && <span className="block text-xs">Overdue</span>}
                  </TableCell>
                  <TableCell title={formatFullDate(order.last_update)}>
                    {formatRelativeDate(order.last_update)}
                  </TableCell>
                  <TableCell>{order.creator_name || 'Unknown'}</TableCell>
                  <TableCell className="flex flex-row gap-2">
                    <Link href={'/orders/' + order.id}>
                      <Button
                        className="bg-brand hover:bg-brand-100 transition text-white "
                        size={'sm'}
                      >
                        View Order
                      </Button>
                    </Link>
                    {view !== 'archived' && (
                      <ArchiveButton order={order} onArchive={handleArchive} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ManufacturerOrdersTable;
