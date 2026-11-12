import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ActiveOrders from '@/components/dashboard/ActiveOrders';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
import { ManufacturerStatsRow } from '@/components/dashboard/ManufacturerStatsRow';
import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import { getManufacturerProfile } from '@/domain/manufacturing/profile';
import { getManufacturerDashboardStats } from '@/domain/manufacturing/dashboard';
import { AccountType } from '@/types/enums';
import { TONE } from '@/lib/utils/tones';
import { cn } from '@/lib/utils';

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

  const isManufacturer =
    userData.account_type === AccountType.Manufacturer;
  let profileIncomplete = false;
  let stats = null;

  if (isManufacturer) {
    const [{ data: profile }, dashboardStats] = await Promise.all([
      getManufacturerProfile(),
      getManufacturerDashboardStats(),
    ]);
    stats = dashboardStats;
    profileIncomplete =
      !profile ||
      profile.processes.length === 0 ||
      profile.materialCategories.length === 0;
  }

  return (
    <main className="flex flex-col items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 w-full">
      <div className="w-full">
        <h1 className="h1">
          Welcome Back, {userData.first_name}{' '}
          {(userData.last_name ?? '').substring(0, 1)}.
        </h1>
        <p className="text-muted-foreground">{userData.company_name || ''}</p>

        {profileIncomplete && (
          <Link href="/profile">
            <div
              className={cn(
                'mt-4 flex items-center justify-between rounded-lg border p-4 transition hover:opacity-90',
                TONE.amber
              )}
            >
              <div>
                <p className="font-medium">Complete your Shop Profile</p>
                <p className="text-sm opacity-90">
                  Add your manufacturing capabilities so we can match you with
                  the right orders.
                </p>
              </div>
              <span className="text-sm font-medium whitespace-nowrap ml-4">
                Set up →
              </span>
            </div>
          </Link>
        )}

        {stats && <ManufacturerStatsRow stats={stats} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8 w-full">
          <Card className="w-full lg:col-span-2">
            <CardHeader className="h2">
              {isManufacturer ? 'Active Jobs' : 'Active Orders'}
            </CardHeader>
            <CardContent>
              <ActiveOrders
                accountType={userData.account_type}
                currentUserId={data.user.id}
              />
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
