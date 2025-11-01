import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import BrowseOrdersCard from '@/components/dashboard/BrowseOrdersCard';
import { getAccountType } from '@/domain/users/service';

export const metadata: Metadata = {
  title: 'Browsing Orders',
};

const BrowsePage = async () => {
  // Check if the user is a creator
  const accountType = await getAccountType();

  if (accountType === 'creator') {
    redirect('/orders');
  }

  return (
    <div className="min-w-full h-full">
      <div className="mt-12">
        <h1 className="h1">Browse Orders</h1>
      </div>
      <BrowseOrdersCard />
    </div>
  );
};

export default BrowsePage;
