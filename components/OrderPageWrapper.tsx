"use client";
import { useEffect, useState } from "react";
import OrderPage from "./OrderPage";
import { getOrderById } from "@/utils/supabase/orders";
import { getUserData } from "@/utils/supabase/utils";
import { Order } from "@/lib/definitions";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Loader } from "lucide-react";
import { getUserById } from "@/utils/adminUtils";

type OrderPageProps = {
  orderId: string;
};

const OrderPageWrapper = ({ orderId }: OrderPageProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [userData, setUserData] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [manufacturerData, setManufacturerData] = useState<SupabaseUser | null>(
    null
  );
  const [creatorData, setCreatorData] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (orderId) {
        const orderData = await getOrderById(orderId as string);
        const userData = await getUserData();

        console.log(userData?.id, orderData);

        // Check authorization
        if (
          userData?.id === orderData?.creator ||
          userData?.id === orderData?.manufacturer ||
          userData?.user_metadata.account_type === "admin"
        ) {
          setIsAuthorized(true);
        }

        // Fetch manufacturer and creator data
        const manufacturer = orderData?.manufacturer
          ? (await getUserById(orderData?.manufacturer)).user
          : null;
        const creator = orderData?.creator
          ? (await getUserById(orderData?.creator)).user
          : null;

        // Set all state at once
        setOrder(orderData);
        setUserData(userData);
        setManufacturerData(manufacturer || null);
        setCreatorData(creator || null);

        // Set loading to false after all state is set
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!order || !isAuthorized) {
    return <div>Order not found</div>;
  }

  return <OrderPage order={order} userData={userData} manufacturerData={manufacturerData} creatorData={creatorData} />;
};

export default OrderPageWrapper;
