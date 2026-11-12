'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import {
  fetchManufacturerProfile,
  fetchManufacturerProfilesByUserIds,
  upsertManufacturerProfile,
  upsertManufacturerShopDetails,
} from '@/lib/supabase/manufacturers';
import { getCurrentUser } from '@/lib/supabase/users';
import { updateUserMetadataServer } from '@/lib/supabase/auth';
import { fetchOrderById } from '@/lib/supabase/orders';
import { fetchOffersByOrder } from '@/lib/supabase/offers';
import { addressSchema } from '@/domain/auth/zod';
import { AccountType, CompanyType } from '@/types/enums';
import type { ManufacturerProfilesSchema } from '@/types/schemas';
import type { Address } from '@/types/shared';

export interface ManufacturerCapabilitiesData {
  processes: string[];
  materialCategories: string[];
  certifications: string[];
}

export interface ManufacturerShopDetails {
  description: string;
  website: string;
  location: string;
  typicalLeadTimeWeeks: number | null;
  minOrderQuantity: number | null;
}

export interface ManufacturerCompanyInfo {
  companyName: string;
  companyType: string;
  stateOfFormation: string;
  representativeRole: string;
  companyAddress: Address;
}

export type ShopCardData = ManufacturerCapabilitiesData &
  ManufacturerShopDetails;

const MIGRATION_HINT =
  'Shop details need a one-time database update. Run supabase/migrations/005_manufacturer_shop_details.sql and try again.';

function toShopDetails(
  row: ManufacturerProfilesSchema | null
): ManufacturerShopDetails {
  return {
    description: row?.description ?? '',
    website: row?.website ?? '',
    location: row?.location ?? '',
    typicalLeadTimeWeeks: row?.typical_lead_time_weeks ?? null,
    minOrderQuantity: row?.min_order_quantity ?? null,
  };
}

async function requireShopOwner() {
  const { user, error } = await getCurrentUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }

  const accountType = user.user_metadata?.account_type;
  if (
    accountType !== AccountType.Manufacturer &&
    accountType !== AccountType.Admin
  ) {
    throw new Error('Only manufacturer accounts can edit a shop profile');
  }

  return user;
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
          shop: toShopDetails(data),
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

const normalizeWebsite = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isHttpUrl = (value: string) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname.includes('.')
    );
  } catch {
    return false;
  }
};

const shopDetailsSchema = z.object({
  description: z
    .string()
    .trim()
    .max(600, 'Description must be 600 characters or fewer'),
  location: z.string().trim().max(120, 'Location must be 120 characters or fewer'),
  website: z
    .string()
    .max(200, 'Website must be 200 characters or fewer')
    .transform(normalizeWebsite)
    .refine(isHttpUrl, 'Enter a valid website, e.g. https://example.com'),
  typicalLeadTimeWeeks: z
    .number()
    .int('Lead time must be a whole number of weeks')
    .min(0, 'Lead time cannot be negative')
    .max(520, 'Lead time must be 520 weeks or fewer')
    .nullable(),
  minOrderQuantity: z
    .number()
    .int('Minimum order must be a whole number')
    .min(1, 'Minimum order must be at least 1')
    .max(1_000_000, 'Minimum order is too large')
    .nullable(),
});

export async function saveManufacturerShopDetails(
  details: ManufacturerShopDetails
) {
  const user = await requireShopOwner();

  const parsed = shopDetailsSchema.safeParse(details);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid shop details');
  }

  const { description, location, website, typicalLeadTimeWeeks, minOrderQuantity } =
    parsed.data;

  const { error } = await upsertManufacturerShopDetails(user.id, {
    description: description || null,
    location: location || null,
    website: website || null,
    typical_lead_time_weeks: typicalLeadTimeWeeks,
    min_order_quantity: minOrderQuantity,
  });

  if (error) {
    logger.error('Manufacturer profile: shop details save failed', error.message);
    // PGRST204 = column missing from the schema cache (migration 005 not applied)
    throw new Error(error.code === 'PGRST204' ? MIGRATION_HINT : error.message);
  }

  logger.info('Manufacturer profile: shop details saved');
  return parsed.data;
}

const companyInfoSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(120, 'Company name must be 120 characters or fewer'),
  companyType: z.nativeEnum(CompanyType),
  stateOfFormation: z.string().min(1, 'State of formation is required'),
  representativeRole: z
    .string()
    .trim()
    .min(1, 'Your role is required')
    .max(80, 'Role must be 80 characters or fewer'),
  companyAddress: addressSchema,
});

export async function getManufacturerCompanyInfo(): Promise<ManufacturerCompanyInfo | null> {
  const { user, error } = await getCurrentUser();
  if (error || !user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};
  const address = (metadata.company_address ?? {}) as Partial<Address>;

  return {
    companyName: metadata.company_name ?? '',
    companyType: metadata.company_type ?? CompanyType.LLC,
    stateOfFormation: metadata.state_of_formation ?? '',
    representativeRole: metadata.representative_role ?? '',
    companyAddress: {
      street1: address.street1 ?? '',
      street2: address.street2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      postal_code: address.postal_code ?? '',
      country: address.country ?? 'United States',
    },
  };
}

export async function saveManufacturerCompanyInfo(
  info: ManufacturerCompanyInfo
) {
  await requireShopOwner();

  const parsed = companyInfoSchema.safeParse(info);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid company info');
  }

  const { error } = await updateUserMetadataServer({
    company_name: parsed.data.companyName,
    company_type: parsed.data.companyType,
    state_of_formation: parsed.data.stateOfFormation,
    representative_role: parsed.data.representativeRole,
    company_address: parsed.data.companyAddress,
  });

  if (error) {
    logger.error('Manufacturer profile: company info save failed', error.message);
    throw new Error(error.message);
  }

  // Navbar and dashboard read company_name from the session metadata.
  revalidatePath('/', 'layout');
  logger.info('Manufacturer profile: company info saved');
}

/**
 * Shop cards for every manufacturer that has an offer on this order. Only the
 * order's creator (or an admin) can read them.
 */
export async function getShopCardsForOrder(
  orderId: string
): Promise<Record<string, ShopCardData>> {
  const { user } = await getCurrentUser();
  if (!user) {
    return {};
  }

  const { data: order } = await fetchOrderById(orderId);
  const isAdmin = user.user_metadata?.account_type === AccountType.Admin;
  if (!order || (order.creator !== user.id && !isAdmin)) {
    return {};
  }

  const offers = await fetchOffersByOrder(orderId);
  const offererIds = Array.from(new Set(offers.map((offer) => offer.offerer)));
  const { data: rows, error } =
    await fetchManufacturerProfilesByUserIds(offererIds);

  if (error) {
    logger.error(error, 'manufacturing:getShopCardsForOrder');
    return {};
  }

  return Object.fromEntries(
    rows.map((row) => [
      row.user_id,
      {
        processes: row.processes ?? [],
        materialCategories: row.material_categories ?? [],
        certifications: row.certifications ?? [],
        ...toShopDetails(row),
      },
    ])
  );
}
