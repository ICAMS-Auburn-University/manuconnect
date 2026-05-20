'use server';

import { logger } from '@/lib/logger';
import {
  fetchManufacturerProfile,
  upsertManufacturerProfile,
} from '@/lib/supabase/manufacturers';
import { getCurrentUser } from '@/lib/supabase/users';

export interface ManufacturerCapabilitiesData {
  processes: string[];
  materialCategories: string[];
  certifications: string[];
}

export async function getManufacturerProfile() {
  const { user, error: userError } = await getCurrentUser();

  if (userError || !user) {
    logger.error('Manufacturer profile: failed to get user');
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await fetchManufacturerProfile(user.id);

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (new manufacturer, no profile yet)
    logger.error('Manufacturer profile: fetch failed', error.message);
    return { data: null, error: error.message };
  }

  return {
    data: data
      ? {
          processes: data.processes,
          materialCategories: data.material_categories,
          certifications: data.certifications,
        }
      : null,
    error: null,
  };
}

export async function saveManufacturerProfile(
  capabilities: ManufacturerCapabilitiesData
) {
  const { user, error: userError } = await getCurrentUser();

  if (userError || !user) {
    logger.error('Manufacturer profile: failed to get user');
    throw new Error('Not authenticated');
  }

  if (capabilities.processes.length === 0) {
    throw new Error('Select at least one process');
  }
  if (capabilities.materialCategories.length === 0) {
    throw new Error('Select at least one material category');
  }

  const { error } = await upsertManufacturerProfile({
    user_id: user.id,
    processes: capabilities.processes,
    material_categories: capabilities.materialCategories,
    certifications: capabilities.certifications,
  });

  if (error) {
    logger.error('Manufacturer profile: save failed', error.message);
    throw new Error(error.message);
  }

  logger.info('Manufacturer profile: saved successfully');
}
