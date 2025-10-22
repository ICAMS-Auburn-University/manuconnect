'use client';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

import { getOrderById } from '@/domain/orders/service';
import { getUserData } from '@/domain/users/service';
import { OrdersSchema } from '@/types/schemas';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import OrderPage from './OrderPage';
import type { UserProfile } from '@/domain/users/types';

type OrderPageProps = {
  orderId: string;
};

const OrderPageWrapper = ({ orderId }: OrderPageProps) => {
  const [order, setOrder] = useState<OrdersSchema | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [manufacturerData, setManufacturerData] = useState<UserProfile | null>(null);
  const [creatorData, setCreatorData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (orderId) {
        try {
          const orderData = await getOrderById(orderId);
          const userData = await getUserData();
          
          console.log('Fetched user data for order:', userData);
          
          // Check authorization
          if (
            userData?.id === orderData?.creator ||
            userData?.id === orderData?.manufacturer ||
            userData?.accountType === 'admin'
          ) {
            setIsAuthorized(true);
          }

          // Fetch manufacturer and creator data
          let manufacturerProfile: UserProfile | null = null;
          let creatorProfile: UserProfile | null = null;
          
          if (orderData?.manufacturer) {
            const manufacturerResult = await getUserById(orderData.manufacturer);
            if (manufacturerResult?.user) {
              // Convert to UserProfile format
              manufacturerProfile = {
                id: manufacturerResult.user.id,
                email: manufacturerResult.user.email || '',
                firstName: manufacturerResult.user.user_metadata?.first_name || '',
                lastName: manufacturerResult.user.user_metadata?.last_name || '',
                displayName: manufacturerResult.user.user_metadata?.display_name || '',
                accountType: manufacturerResult.user.user_metadata?.account_type || 'manufacturer',
                companyName: manufacturerResult.user.user_metadata?.company_name || '',
                profilePicture: manufacturerResult.user.user_metadata?.profile_picture || ''
              };
            }
          }
          
          if (orderData?.creator) {
            const creatorResult = await getUserById(orderData.creator);
            if (creatorResult?.user) {
              // Convert to UserProfile format
              creatorProfile = {
                id: creatorResult.user.id,
                email: creatorResult.user.email || '',
                firstName: creatorResult.user.user_metadata?.first_name || '',
                lastName: creatorResult.user.user_metadata?.last_name || '',
                displayName: creatorResult.user.user_metadata?.display_name || '',
                accountType: creatorResult.user.user_metadata?.account_type || 'creator',
                companyName: creatorResult.user.user_metadata?.company_name || '',
                profilePicture: creatorResult.user.user_metadata?.profile_picture || ''
              };
            }
          }

          // Set all state at once
          setOrder(orderData);
          setUserData(userData);
          setManufacturerData(manufacturerProfile);
          setCreatorData(creatorProfile);
        } catch (error) {
          console.error('Error fetching order data:', error);
        } finally {
          // Set loading to false after all state is set
          setLoading(false);
        }
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
    return <div>Order not found or you're not authorized to view it</div>;
  }

  return (
    <OrderPage
      order={order}
      userData={userData}
      manufacturerData={manufacturerData}
      creatorData={creatorData}
    />
  );
};

export default OrderPageWrapper;