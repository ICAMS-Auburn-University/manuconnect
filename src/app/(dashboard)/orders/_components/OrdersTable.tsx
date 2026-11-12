'use client';

import { useState } from 'react';
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
import { abbreviateUUID } from '@/lib/utils/transforms';
import { formatFullDate, formatRelativeDate } from '@/lib/utils/dates';

interface OrdersTableProps {
  Orders: OrdersSchema[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ Orders }) => {
  const [orders, setOrders] = useState(Orders);

  const handleArchive = (orderId: string) => {
    // Handles the archive button click
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, isArchived: true } : order
      )
    );
  };

  // TODO: Add a archived orders table
  return (
    <Table className="body-1 mb-16">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Order Number</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[100px]">Title</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders
          .filter((order) => !order.isArchived)
          .map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{abbreviateUUID(order.id)}</TableCell>
              <TableCell className="font-medium text-wrap">
                {order.status}
              </TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell title={formatFullDate(order.last_update)}>
                {formatRelativeDate(order.last_update)}
              </TableCell>
              <TableCell title={formatFullDate(order.created_at)}>
                {formatRelativeDate(order.created_at)}
              </TableCell>
              <TableCell>{order.manufacturer_name || 'Unassigned'}</TableCell>
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

export default OrdersTable;
