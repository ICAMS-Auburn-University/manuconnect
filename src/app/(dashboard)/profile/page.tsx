import { redirect } from 'next/navigation';
import { Metadata } from 'next';

import { getAccountType } from '@/domain/users/service';
import { getManufacturerProfile } from '@/domain/manufacturing/profile';
import ManufacturerProfileEditor from '@/components/forms/ManufacturerProfileEditor';

export const metadata: Metadata = {
  title: 'Shop Profile | ManuConnect',
};

export default async function ProfilePage() {
  const accountType = await getAccountType();

  if (accountType !== 'manufacturer' && accountType !== 'admin') {
    redirect('/');
  }

  const { data: profile } = await getManufacturerProfile();

  return (
    <main className="flex flex-col items-center justify-items-center p-8 pb-20 gap-8 sm:p-20 w-full">
      <div className="w-full max-w-4xl">
        <h1 className="h1 mb-2">Shop Profile</h1>
        <p className="text-muted-foreground mb-8">
          Manage your manufacturing capabilities. This helps us match you with
          the right orders.
        </p>
        <ManufacturerProfileEditor
          initialData={
            profile ?? {
              processes: [],
              materialCategories: [],
              certifications: [],
            }
          }
        />
      </div>
    </main>
  );
}
