import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import type { EventsSchema } from '@/types/schemas';

export async function fetchEventsByUser(
  userId: string,
  limit: number
): Promise<EventsSchema[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<EventsSchema[], { merge: false }>();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertEvent(
  event_type: string,
  description: string,
  user_id: string,
  order_id: string
): Promise<EventsSchema> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Events')
    .insert([{ event_type, description, user_id, order_id }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to insert event: No data returned');
  }

  return data;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}
