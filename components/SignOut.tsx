'use client';

import React, { useTransition } from 'react';
import { Button } from './ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface SignOutProps {
  className?: string;
}

const SignOut = ({ className }: SignOutProps) => {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error('Error signing out:', error);
      return;
    }

    startTransition(() => {
      router.push('/');
      router.refresh();
    });
  }

  return (
    <div>
      <Button
        className={className}
        disabled={isPending}
        onClick={handleSignOut}
      >
        {isPending ? 'Signing Out' : 'Sign Out'}
      </Button>
    </div>
  );
};

export default SignOut;
