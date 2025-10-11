import ViewOrderPageWrapper from '@/app/(dashboard)/orders/_components/ViewOrderPageWrapper';
import { getAccountType } from '@/domain/users/service';
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
