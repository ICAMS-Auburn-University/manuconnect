'use client';
import { Card, CardContent } from '@/components/ui/card';
import OrdersList from '@/app/(dashboard)/orders/_components/OrdersList';
import OrderDetails from '@/app/(dashboard)/orders/_components/OrderDetails';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getEnrichedBrowseOrders } from '@/domain/orders/browse';
import type { BrowseOrderData } from '@/domain/orders/browse';
import type { OrdersSchema } from '@/types/schemas';
import { AlertTriangle, Package2, Wrench } from 'lucide-react';

export type SortOption = 'newest' | 'due-date' | 'fewest-offers' | 'most-offers';

export type QuickFilter = 'all' | 'no-offers' | 'matching' | 'not-offered';

const SELECTED_ORDER_STORAGE_KEY = 'manufacturer-browse-selected-order';

const BrowseOrdersCard = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [browseData, setBrowseData] = useState<BrowseOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  const persistSelectedOrderId = useCallback((orderId: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!orderId) {
      window.localStorage.removeItem(SELECTED_ORDER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SELECTED_ORDER_STORAGE_KEY, orderId);
  }, []);

  const resolvePreferredOrderId = useCallback(
    (data: BrowseOrderData[], preferredId?: string | null) => {
      if (preferredId && data.some((entry) => entry.order.id === preferredId)) {
        return preferredId;
      }

      return data[0]?.order.id ?? null;
    },
    []
  );

  const handleOrderSelect = useCallback((order: OrdersSchema) => {
    setSelectedOrderId(order.id);
    persistSelectedOrderId(order.id);
  }, [persistSelectedOrderId]);

  const handleOfferCreated = useCallback(async () => {
    const data = await getEnrichedBrowseOrders();
    setBrowseData(data);

    setSelectedOrderId((currentId) => {
      const nextId = resolvePreferredOrderId(data, currentId);
      persistSelectedOrderId(nextId);
      return nextId;
    });
  }, [persistSelectedOrderId, resolvePreferredOrderId]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const data = await getEnrichedBrowseOrders();
      setBrowseData(data);

      const storedSelection =
        typeof window === 'undefined'
          ? null
          : window.localStorage.getItem(SELECTED_ORDER_STORAGE_KEY);
      const nextId = resolvePreferredOrderId(data, storedSelection);
      setSelectedOrderId(nextId);
      persistSelectedOrderId(nextId);
      setLoading(false);
    };
    fetchOrders();
  }, [persistSelectedOrderId, resolvePreferredOrderId]);

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

  const selectedEntry = useMemo(
    () =>
      browseData.find((entry) => entry.order.id === selectedOrderId) ??
      filteredAndSorted[0] ??
      browseData[0] ??
      null,
    [browseData, filteredAndSorted, selectedOrderId]
  );

  const selectedOrder = selectedEntry?.order ?? null;

  const stats = useMemo(() => {
    const matching = browseData.filter((d) => d.tagMatchesProfile).length;
    const urgent = browseData.filter((d) => d.dueUrgency === 'urgent').length;
    return { total: browseData.length, matching, urgent };
  }, [browseData]);

  return (
    <div className="space-y-4">
      {!loading && browseData.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:max-w-xl">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Package2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold leading-none">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Open orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Wrench className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold leading-none">{stats.matching}</p>
              <p className="text-xs text-muted-foreground">Match your shop</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-semibold leading-none">{stats.urgent}</p>
              <p className="text-xs text-muted-foreground">Due soon</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,42rem)]">
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
              selectedOrderId={selectedOrderId}
              totalCount={browseData.length}
            />
          </CardContent>
        </Card>
      </div>
      <div className="flex items-start xl:sticky xl:top-6 xl:self-start">
        <OrderDetails
          order={selectedOrder}
          browseEntry={selectedEntry}
          onOfferCreated={handleOfferCreated}
        />
      </div>
      </div>
    </div>
  );
};

export default BrowseOrdersCard;
