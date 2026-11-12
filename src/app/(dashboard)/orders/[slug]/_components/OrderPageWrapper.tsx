'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getOrderById } from '@/domain/orders/service';
import { getUserData } from '@/domain/users/service';
import { OrdersSchema } from '@/types/schemas';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import { getSubcontractedOrders } from '@/domain/collaboration/service';
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
  const [manufacturerData, setManufacturerData] = useState<UserProfile | null>(
    null
  );
  const [creatorData, setCreatorData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (orderId) {
        try {
          const orderData = await getOrderById(orderId);
          const userData = await getUserData();

          // Check authorization
          if (
            userData?.id === orderData?.creator ||
            userData?.id === orderData?.manufacturer ||
            userData?.accountType === 'admin'
          ) {
            setIsAuthorized(true);
          } else if (userData?.id) {
            // Check if user is a subcontractor on this order
            const subOrderIds = await getSubcontractedOrders(userData.id);
            if (subOrderIds.includes(orderId)) {
              setIsAuthorized(true);
            }
          }

          // Fetch manufacturer and creator data
          let manufacturerProfile: UserProfile | null = null;
          let creatorProfile: UserProfile | null = null;

          if (orderData?.manufacturer) {
            const manufacturerResult = await getUserById(
              orderData.manufacturer
            );
            if (manufacturerResult?.user) {
              // Convert to UserProfile format
              manufacturerProfile = {
                id: manufacturerResult.user.id,
                email: manufacturerResult.user.email || '',
                firstName:
                  manufacturerResult.user.user_metadata?.first_name || '',
                lastName:
                  manufacturerResult.user.user_metadata?.last_name || '',
                displayName:
                  manufacturerResult.user.user_metadata?.display_name || '',
                accountType:
                  manufacturerResult.user.user_metadata?.account_type ||
                  'manufacturer',
                companyName:
                  manufacturerResult.user.user_metadata?.company_name || '',
                profilePicture:
                  manufacturerResult.user.user_metadata?.profile_picture || '',
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
                displayName:
                  creatorResult.user.user_metadata?.display_name || '',
                accountType:
                  creatorResult.user.user_metadata?.account_type || 'creator',
                companyName:
                  creatorResult.user.user_metadata?.company_name || '',
                profilePicture:
                  creatorResult.user.user_metadata?.profile_picture || '',
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
    const isManufacturer = userData?.accountType === 'manufacturer';
    return (
      <div className="mx-auto mt-24 max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">Order unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This order doesn&apos;t exist, or your account doesn&apos;t have
                access to it.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link href="/orders">
                  {isManufacturer ? 'Back to jobs' : 'Back to orders'}
                </Link>
              </Button>
              {isManufacturer && (
                <Button
                  asChild
                  className="bg-brand text-white hover:bg-brand-100"
                >
                  <Link href="/orders/browse">Browse orders</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
