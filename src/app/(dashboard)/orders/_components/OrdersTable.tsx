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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ArchiveButton from '@/components/feedback/ArchiveButton';
import { abbreviateUUID } from '@/lib/utils/transforms';

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
          <TableHead className="w-[100px]">OrdersSchema Number</TableHead>
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
              <TableCell>
                #
                {abbreviateUUID(order.id)}
              </TableCell>
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
              <TableCell>{order.manufacturer_name || 'Unassigned'}</TableCell>
              <TableCell className="flex flex-row gap-2">
                <Link href={'/orders/' + order.id}>
                  <Button
                    className="bg-brand hover:bg-brand-100 transition text-white "
                    size={'sm'}
                  >
                    View OrdersSchema
                  </Button>
                </Link>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <ArchiveButton
                          order={order}
                          onArchive={handleArchive}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="font-medium">
                      Archive. This cannot be undone.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default OrdersTable;
