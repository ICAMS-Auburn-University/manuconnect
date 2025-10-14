import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { User } from '@supabase/supabase-js';

export async function getCurrentUser(): Promise<{
  user: User | null;
  error: Error | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error: error || null };
}

export async function getUserMetadata() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return { metadata: null, error };
  }

  return {
    metadata: data.user.user_metadata,
    error: null,
  };
}

export async function updateUserMetadata(metadata: Record<string, any>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  return { user: data?.user || null, error };
}
