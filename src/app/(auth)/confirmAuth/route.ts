import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/onboarding';

  if (token_hash && type) {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or onboarding page
      redirect(next);
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error');
}
