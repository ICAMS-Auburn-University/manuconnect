import ManufacturerOrdersTable from '@/components/ManufacturerOrdersTable';
import OrdersTable from '@/components/OrdersTable';
import ViewOrderPageWrapper from '@/components/ViewOrderPageWrapper';
import {
  getCreatorOrders,
  getManufacturerOrders,
} from '@/utils/supabase/orders';
import { getAccountType } from '@/utils/supabase/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders',
};

const OrdersPage = async () => {
  const accountType = await getAccountType();

  if (!accountType) {
    return <div>Something went wrong. Please try again later.</div>;
  }

  return <ViewOrderPageWrapper accountType={accountType} />;
};

export default OrdersPage;
