"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import OrdersList from "./OrdersList";
import OrderDetails from "./OrderDetails";
import { useEffect, useState } from "react";
import { getOrderById, getUnclaimedOrders } from "@/utils/supabase/orders";
import { Order } from "@/lib/definitions";
import OrderSearchBar from "./OrderSearchBar";
import { Skeleton } from "./ui/skeleton";

const BrowseOrdersCard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const orders = await getUnclaimedOrders();
      setOrders(orders || []);
      if (!orders) {
        setLoading(false);
        return;
      }
      setSelectedOrder(orders[0]);
      setLoading(false);
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
