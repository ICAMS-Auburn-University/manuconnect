'use client';

import OrdersTable from './OrdersTable';
import ManufacturerOrdersTable from './ManufacturerOrdersTable';
import MyOffersTable from './MyOffersTable';
import { useEffect, useState } from 'react';
import {
  getCreatorOrders,
  getManufacturerOrders,
} from '@/domain/orders/service';
import { OrdersSchema } from '@/types/schemas';
import { Loader } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewOrderPageWrapperProps {
  accountType: string;
  userId?: string;
  initialTab?: 'jobs' | 'offers';
  pendingOffers?: boolean;
}

const ViewOrderPageWrapper = ({
  accountType,
  userId,
  initialTab = 'jobs',
  pendingOffers = false,
}: ViewOrderPageWrapperProps) => {
  const [creatorOrders, setCreatorOrders] = useState<OrdersSchema[]>([]);
  const [manufacturerOrders, setManufacturerOrders] = useState<OrdersSchema[]>(
    []
  );
  const [loading, setIsLoading] = useState(true); // Add loading state
  const [tab, setTab] = useState<'jobs' | 'offers'>(initialTab);
  const isManufacturerOnly = accountType === 'manufacturer';

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const fetchOrders = async () => {
    try {
      const creatorOrders = await getCreatorOrders();
      const manufacturerOrders = await getManufacturerOrders();
      setCreatorOrders(creatorOrders || []);
      setManufacturerOrders(manufacturerOrders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (isManufacturerOnly) {
    return (
      <div className="w-full">
        <div className="mt-12">
          <h1 className="h1">Jobs &amp; Offers</h1>
          <p className="text-muted-foreground">
            Track the work you&apos;ve won and the offers still waiting on a
            creator.
          </p>
        </div>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'jobs' | 'offers')}
          className="mt-8"
        >
          <TabsList>
            <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
            <TabsTrigger value="offers">My Offers</TabsTrigger>
          </TabsList>
          <TabsContent value="jobs" className="mt-4">
            <ManufacturerOrdersTable
              Orders={manufacturerOrders}
              currentUserId={userId}
            />
          </TabsContent>
          <TabsContent value="offers" className="mt-4">
            <MyOffersTable pendingOnly={pendingOffers} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mt-12">
        <h1 className="h1">Your Orders</h1>
      </div>
      <div className="mt-8">
        {(accountType === 'creator' || accountType === 'admin') && (
          <OrdersTable Orders={creatorOrders} />
        )}
        {(accountType === 'manufacturer' || accountType === 'admin') && (
          <ManufacturerOrdersTable
            Orders={manufacturerOrders}
            currentUserId={userId}
          />
        )}
      </div>
    </div>
  );
};

export default ViewOrderPageWrapper;
