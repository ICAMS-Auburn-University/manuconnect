'use server';

import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';

export const getServerSession = async () => {
  const supabase = await createSupabaseServiceRoleClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session ?? null;
};
