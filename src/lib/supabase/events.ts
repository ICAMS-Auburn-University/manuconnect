import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import type { EventsSchema } from '@/types/schemas';

export async function fetchEventsByUser(
  userId: string,
  limit: number
): Promise<EventsSchema[]> {
  const supabase = await createSupabaseServiceRoleClient();
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

export async function insertEvent(event: EventsSchema): Promise<EventsSchema> {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('Events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.log('Error inserting event:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to insert event: No data returned');
  }
  console.log('Inserted event:', data);
  return data;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}
