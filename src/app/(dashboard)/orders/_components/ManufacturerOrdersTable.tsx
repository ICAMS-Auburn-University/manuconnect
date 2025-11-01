'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrdersSchema } from '@/types/schemas';
import ArchiveButton from '@/components/feedback/ArchiveButton';
import { useMemo, useState } from 'react';
import { abbreviateUUID } from '@/lib/utils/transforms';

interface ManufacturerOrdersTableProps {
  Orders: OrdersSchema[];
}

const ManufacturerOrdersTable: React.FC<ManufacturerOrdersTableProps> = ({
  Orders,
}) => {
  const [orders, setOrders] = useState(Orders);

  const visibleOrders = useMemo(
    () => orders.filter((order) => !order.isArchived),
    [orders]
  );

  const handleArchive = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, isArchived: true } : order
      )
    );
  };

  return (
    <Table className="body-1 mb-16">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Order Number</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[100px]">Title</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Creator</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleOrders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>#{abbreviateUUID(order.id)}</TableCell>
            <TableCell className="font-medium text-wrap">
              {order.status}
            </TableCell>
            <TableCell>{order.title}</TableCell>
            <TableCell>
              {new Date(order.last_update).toLocaleString('en-us')}
            </TableCell>
            <TableCell>
              {new Date(order.created_at).toLocaleString('en-us', {
                timeZone: 'America/Chicago',
              })}
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
              <ArchiveButton order={order} onArchive={handleArchive} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ManufacturerOrdersTable;
