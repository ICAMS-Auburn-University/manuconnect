'use client';

import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { createClient } from '@/services/supabase/client';
import { AccountType } from '@/types/enums';
import CreatorOnboarding from '@/components/onboarding/CreatorOnboarding';
import ManufacturerOnboarding from '@/components/onboarding/ManufacturerOnboarding';

export default function OnboardingPage() {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUserData() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (!data?.user) {
          throw new Error('Not authenticated');
        }

        console.log('User metadata:', data.user.user_metadata);

        const userAccountType = data.user.user_metadata
          ?.account_type as AccountType;
        if (!userAccountType) {
          throw new Error('Account type not found');
        }

        setAccountType(userAccountType);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    getUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-center mb-6">{error}</p>
        <a
          href="/sign-in"
          className="px-4 py-2 bg-[#e87722] text-white rounded-full"
        >
          Back to Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {accountType === AccountType.Creator ? (
        <CreatorOnboarding />
      ) : accountType === AccountType.Manufacturer ? (
        <ManufacturerOnboarding />
      ) : (
        <div className="text-center">
          <h1 className="text-xl font-semibold">Invalid account type</h1>
          <p>Please contact support.</p>
        </div>
      )}
    </div>
  );
}
