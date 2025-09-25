'use client';
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from './ui/button';
import { Order } from '@/lib/definitions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

import ArchiveButton from './ArchiveButton';
import { HandCoins } from 'lucide-react';
import { Badge } from './ui/badge';
import ViewOffers from './ViewOffers';
import { getUserById } from '@/utils/adminUtils';

interface ManufacturerOrdersTableProps {
  Orders: Order[];
}

const ManufacturerOrdersTable: React.FC<ManufacturerOrdersTableProps> = ({
  Orders,
}) => {
  const [orders, setOrders] = useState(Orders);
  const [loading, setLoading] = useState(false);

  const handleArchive = (orderId: number) => {
    // Handles the archive button click
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, isArchived: true } : order
      )
    );
  };

  // TODO: Add a archived orders table
  return (
    <>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
        </div>
      ) : (
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
            {orders
              .filter((order) => !order.isArchived)
              .map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    #
                    {order.id.toLocaleString('en-US', {
                      minimumIntegerDigits: 6,
                      useGrouping: false,
                    })}
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
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default ManufacturerOrdersTable;
