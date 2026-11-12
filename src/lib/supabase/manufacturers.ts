import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import type { ManufacturerProfilesSchema } from '@/types/schemas';

interface ManufacturerProfilePayload {
  user_id: string;
  processes: string[];
  material_categories: string[];
  certifications: string[];
}

export async function insertManufacturerProfile(
  payload: ManufacturerProfilePayload
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .insert(payload)
    .select('*')
    .single();

  return {
    data: data as ManufacturerProfilesSchema | null,
    error,
  };
}

export async function upsertManufacturerProfile(
  payload: ManufacturerProfilePayload
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  return {
    data: data as ManufacturerProfilesSchema | null,
    error,
  };
}

export async function fetchManufacturerProfile(userId: string) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    data: data as ManufacturerProfilesSchema | null,
    error,
  };
}

interface ManufacturerShopDetailsPayload {
  description: string | null;
  website: string | null;
  location: string | null;
  typical_lead_time_weeks: number | null;
  min_order_quantity: number | null;
}

// Separate from upsertManufacturerProfile so a missing migration-005 column can
// never break saving capabilities.
export async function upsertManufacturerShopDetails(
  userId: string,
  details: ManufacturerShopDetailsPayload
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from('manufacturer_profiles')
    .upsert(
      { user_id: userId, ...details, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  return { error };
}

export async function fetchManufacturerProfilesByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return { data: [] as ManufacturerProfilesSchema[], error: null };
  }

  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .select('*')
    .in('user_id', userIds);

  return { data: (data ?? []) as ManufacturerProfilesSchema[], error };
}
