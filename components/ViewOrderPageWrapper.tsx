"use client";

import OrdersTable from "./OrdersTable";
import ManufacturerOrdersTable from "./ManufacturerOrdersTable";
import { useEffect, useState } from "react";
import {
  getCreatorOrders,
  getManufacturerOrders,
} from "@/utils/supabase/orders";
import { Order } from "@/lib/definitions";
import { Loader } from "lucide-react";

interface ViewOrderPageWrapperProps {
  accountType: string;
}

const ViewOrderPageWrapper = ({ accountType }: ViewOrderPageWrapperProps) => {
  const [creatorOrders, setCreatorOrders] = useState<Order[]>([]);
  const [manufacturerOrders, setManufacturerOrders] = useState<Order[]>([]);
  const [loading, setIsLoading] = useState(true); // Add loading state

  const fetchOrders = async () => {
    try {
      const creatorOrders = await getCreatorOrders();
      const manufacturerOrders = await getManufacturerOrders();
      setCreatorOrders(creatorOrders || []);
      setManufacturerOrders(manufacturerOrders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
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

  return (
    <div className="w-full">
      <div className="mt-12">
        <h1 className="h1">Your Orders</h1>
      </div>
      <div className="mt-8">
        {(accountType === "creator" || accountType === "admin") && (
          <OrdersTable Orders={creatorOrders} />
        )}
        {(accountType === "manufacturer" || accountType === "admin") && (
          <ManufacturerOrdersTable Orders={manufacturerOrders} />
        )}
      </div>
    </div>
  );
};

export default ViewOrderPageWrapper;
