'use client';
import { Card, CardContent } from '@/components/ui/card';
import OrdersList from '@/app/(dashboard)/orders/_components/OrdersList';
import OrderDetails from '@/app/(dashboard)/orders/_components/OrderDetails';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getEnrichedBrowseOrders } from '@/domain/orders/browse';
import type { BrowseOrderData } from '@/domain/orders/browse';
import type { OrdersSchema } from '@/types/schemas';

export type SortOption = 'newest' | 'due-date' | 'fewest-offers' | 'most-offers';

export type QuickFilter = 'all' | 'no-offers' | 'matching' | 'not-offered';

const BrowseOrdersCard = () => {
  const [selectedOrder, setSelectedOrder] = useState<OrdersSchema | null>(null);
  const [browseData, setBrowseData] = useState<BrowseOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  const handleOrderSelect = useCallback((order: OrdersSchema) => {
    setSelectedOrder(order);
  }, []);

  const handleOfferCreated = useCallback(async () => {
    const data = await getEnrichedBrowseOrders();
    setBrowseData(data);
    // Keep the same order selected if it still exists
    if (selectedOrder) {
      const updated = data.find((d) => d.order.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated.order);
    }
  }, [selectedOrder]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const data = await getEnrichedBrowseOrders();
      setBrowseData(data);
      if (data.length > 0) {
        setSelectedOrder(data[0].order);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...browseData];

    // Apply quick filter
    switch (quickFilter) {
      case 'no-offers':
        result = result.filter((d) => d.offerCount === 0);
        break;
      case 'matching':
        result = result.filter((d) => d.tagMatchesProfile);
        break;
      case 'not-offered':
        result = result.filter((d) => !d.userHasOffered);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.order.created_at).getTime() -
            new Date(a.order.created_at).getTime()
        );
        break;
      case 'due-date':
        result.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
        break;
      case 'fewest-offers':
        result.sort((a, b) => a.offerCount - b.offerCount);
        break;
      case 'most-offers':
        result.sort((a, b) => b.offerCount - a.offerCount);
        break;
    }

    return result;
  }, [browseData, sortBy, quickFilter]);

  return (
    <div className="grid lg:grid-cols-[1fr_minmax(0,28rem)] min-w-full gap-6 justify-center">
      <div>
        <Card className="w-full my-6">
          <CardContent className="pt-5">
            <OrdersList
              onOrderSelect={handleOrderSelect}
              browseData={filteredAndSorted}
              loading={loading}
              sortBy={sortBy}
              onSortChange={setSortBy}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
              selectedOrderId={selectedOrder?.id ?? null}
              totalCount={browseData.length}
            />
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-center items-start">
        <OrderDetails order={selectedOrder} onOfferCreated={handleOfferCreated} />
      </div>
    </div>
  );
};

export default BrowseOrdersCard;
