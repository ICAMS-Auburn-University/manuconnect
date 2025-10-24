import { createSupabasePublicClient } from '@/app/_internal/supabase/server-client';
import type { UsersMapSchema } from '@/types/schemas';

export async function fetchUserMapById(
  userId: string
): Promise<UsersMapSchema> {
  const supabase = await createSupabasePublicClient();
  const { data, error } = await supabase
    .from('UsersMap')
    .select('id, display_name')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data || { id: userId, display_name: '' };
}
