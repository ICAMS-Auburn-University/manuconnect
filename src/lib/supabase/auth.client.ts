'use client';

import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';

export async function updateUserMetadata(metadata: Record<string, unknown>) {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });
  return { data, error };
}

export async function supabaseGetUser() {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}
