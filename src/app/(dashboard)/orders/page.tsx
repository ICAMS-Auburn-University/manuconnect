import ViewOrderPageWrapper from '@/app/(dashboard)/orders/_components/ViewOrderPageWrapper';
import { getAccountType, getUserData } from '@/domain/users/service';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders',
};

const OrdersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) => {
  const [accountType, userData, { tab, filter }] = await Promise.all([
    getAccountType(),
    getUserData(),
    searchParams,
  ]);

  if (!accountType) {
    return <div>Something went wrong. Please try again later.</div>;
  }

  return (
    <ViewOrderPageWrapper
      accountType={accountType}
      userId={userData?.id}
      initialTab={tab === 'offers' ? 'offers' : 'jobs'}
      pendingOffers={filter === 'pending'}
    />
  );
};

export default OrdersPage;
