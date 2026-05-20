import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ActiveOrders from '@/components/dashboard/ActiveOrders';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import { getManufacturerProfile } from '@/domain/manufacturing/profile';
import { AccountType } from '@/types/enums';

export const metadata: Metadata = {
  title: 'Home | ManuConnect',
};

export default async function Home() {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/sign-in');
  }

  const userData = data.user.user_metadata;
  console.log('User metadata:', userData);

  const isManufacturer =
    userData.account_type === AccountType.Manufacturer;
  let profileIncomplete = false;

  if (isManufacturer) {
    const { data: profile } = await getManufacturerProfile();
    profileIncomplete = !profile || profile.processes.length === 0;
  }

  return (
    <main className="flex flex-col items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 w-full">
      <div className="w-full">
        <h1 className="h1">
          Welcome Back, {userData.first_name}{' '}
          {userData.last_name.substring(0, 1)}.
        </h1>
        <p className="text-muted-foreground">{userData.company_name || ''}</p>

        {profileIncomplete && (
          <Link href="/profile">
            <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100">
              <div>
                <p className="font-medium text-amber-900">
                  Complete your Shop Profile
                </p>
                <p className="text-sm text-amber-700">
                  Add your manufacturing capabilities so we can match you with
                  the right orders.
                </p>
              </div>
              <span className="text-amber-600 text-sm font-medium whitespace-nowrap ml-4">
                Set up →
              </span>
            </div>
          </Link>
        )}
        <div className="grid grid-cols-3 gap-4 mt-8 w-full">
          <Card className="w-full col-span-2">
            <CardHeader className="h2">Active Orders</CardHeader>
            <CardContent>
              <ActiveOrders accountType={userData.account_type} />
            </CardContent>
          </Card>
          <RecentEvents
            title="Recent Events"
            description="Latest Activity For You"
            limit={10}
          />
        </div>
      </div>
    </main>
  );
}
