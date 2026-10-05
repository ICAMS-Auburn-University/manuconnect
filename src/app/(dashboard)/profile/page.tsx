import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { Factory } from 'lucide-react';

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
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Factory className="h-5 w-5" />
          </div>
          <h1 className="h1">Shop Profile</h1>
        </div>
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
