'use client';
import { Card, CardContent } from '@/components/ui/card';
import OrdersList from '@/app/(dashboard)/orders/_components/OrdersList';
import OrderDetails from '@/app/(dashboard)/orders/_components/OrderDetails';
import { useEffect, useState } from 'react';
import { getUnclaimedOrders } from '@/domain/orders/service';
import { Order } from '@/domain/orders/types';

const BrowseOrdersCard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const orders = await getUnclaimedOrders();
      setOrders(orders || []);
      if (!orders) {
        return;
      }
      setSelectedOrder(orders[0]);
    };
    fetchOrders();
  }, []);

  return (
    <div className="grid md:grid-cols-2 min-w-full gap-4 justify-center  ">
      <div>
        <Card className="w-full my-10 h-[30rem]">
          <CardContent className="mt-5">
            <OrdersList
              onOrderSelect={handleOrderSelect}
              unclaimedOrders={orders}
            />
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-center items-center">
        <OrderDetails order={selectedOrder} />
      </div>
    </div>
  );
};

export default BrowseOrdersCard;
