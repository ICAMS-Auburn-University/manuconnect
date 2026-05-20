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
