'use server';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';

export const getServerSession = async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session ?? null;
};
