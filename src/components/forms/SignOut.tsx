'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';

interface SignOutProps {
  className?: string;
}

const SignOut = ({ className }: SignOutProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    const supabase = await createSupabaseBrowserClient();
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
