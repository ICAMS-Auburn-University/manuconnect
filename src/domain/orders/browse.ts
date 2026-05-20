'use server';

import { fetchUnclaimedOrders } from '@/lib/supabase/orders';
import { fetchOfferOrderIdsByOfferer, fetchOfferCountsByOrderIds } from '@/lib/supabase/offers';
import { fetchManufacturerProfile } from '@/lib/supabase/manufacturers';
import { getCurrentUser } from '@/lib/supabase/users';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import { logger } from '@/lib/logger';
import type { OrdersSchema } from '@/types/schemas';

// Maps order-level process tags to profile-level specific processes
const PROCESS_TAG_TO_PROCESSES: Record<string, string[]> = {
  cnc_machining: [
    'CNC Milling (3-axis)',
    'CNC Milling (4-axis)',
    'CNC Milling (5-axis)',
    'CNC Turning (Lathe)',
    'Swiss Screw Machining',
    'Grinding (Surface)',
    'Grinding (Cylindrical)',
    'Grinding (Centerless)',
    'EDM (Wire)',
    'EDM (Sinker)',
  ],
  '3d_printing': ['3D Printing (Metal)', '3D Printing (Plastic)'],
  injection_molding: ['Injection Molding'],
  sheet_metal_fabrication: [
    'Stamping',
    'Laser Cutting',
    'Waterjet Cutting',
  ],
  casting: [
    'Casting (Sand)',
    'Casting (Investment/Lost wax)',
    'Casting (Die casting)',
  ],
  forging: ['Forging (Hot)', 'Forging (Cold)'],
  laser_cutting: ['Laser Cutting'],
  waterjet_cutting: ['Waterjet Cutting'],
  extrusion: ['Extrusion'],
};

const MATERIAL_TAG_TO_CATEGORIES: Record<string, string[]> = {
  metal: ['Metals-Ferrous', 'Metals-Non-Ferrous'],
  plastic: ['Plastics-Thermoplastic', 'Plastics-Thermoset'],
  composite: ['Composites'],
  carbon_fiber: ['Composites'],
};

export type DueUrgency = 'urgent' | 'soon' | 'normal';

export interface BrowseOrderData {
  order: OrdersSchema;
  offerCount: number;
  userHasOffered: boolean;
  dueUrgency: DueUrgency;
  daysUntilDue: number;
  isNew: boolean;
  tagMatchesProfile: boolean;
}

function computeDueUrgency(dueDate: string): {
  urgency: DueUrgency;
  daysUntilDue: number;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntilDue <= 14) return { urgency: 'urgent', daysUntilDue };
  if (daysUntilDue <= 30) return { urgency: 'soon', daysUntilDue };
  return { urgency: 'normal', daysUntilDue };
}

function computeIsNew(createdAt: string): boolean {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const daysSinceCreated = diffMs / (1000 * 60 * 60 * 24);
  return daysSinceCreated <= 3;
}

function checkTagMatch(
  orderTags: string[],
  profileProcesses: Set<string>,
  profileMaterialCategories: Set<string>
): boolean {
  for (const tag of orderTags) {
    // Check process tag match
    const mappedProcesses = PROCESS_TAG_TO_PROCESSES[tag];
    if (mappedProcesses) {
      const hasMatch = mappedProcesses.some((p) =>
        profileProcesses.has(p.toLowerCase())
      );
      if (hasMatch) return true;
    }

    // Check material tag match
    const mappedCategories = MATERIAL_TAG_TO_CATEGORIES[tag];
    if (mappedCategories) {
      const hasMatch = mappedCategories.some((c) =>
        profileMaterialCategories.has(c.toLowerCase())
      );
      if (hasMatch) return true;
    }
  }
  return false;
}

export async function getEnrichedBrowseOrders(): Promise<BrowseOrderData[]> {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    logger.error(userError, 'browse:getEnrichedBrowseOrders:getUser');
    return [];
  }

  const [ordersResult, userOfferOrderIds, profileResult] = await Promise.all([
    fetchUnclaimedOrders(),
    fetchOfferOrderIdsByOfferer(user.id).catch(() => [] as string[]),
    fetchManufacturerProfile(user.id),
  ]);

  const orders = ordersResult.data ?? [];
  const profile = profileResult.data;
  const offeredOrderIds = new Set(userOfferOrderIds);

  // Fetch real offer counts from Offers table
  const orderIds = orders.map((o) => o.id);
  const offerCounts = await fetchOfferCountsByOrderIds(orderIds).catch(
    () => ({} as Record<string, number>)
  );

  const profileProcesses = new Set(
    (profile?.processes ?? []).map((p) => p.toLowerCase())
  );
  const profileMaterialCategories = new Set(
    (profile?.material_categories ?? []).map((m) => m.toLowerCase())
  );
  const hasProfile =
    profileProcesses.size > 0 || profileMaterialCategories.size > 0;

  // Enrich orders with creator names + metadata
  const enriched = await Promise.all(
    orders.map(async (order) => {
      let creatorName = order.creator_name || 'Unknown';
      try {
        const creator = await getUserById(order.creator);
        creatorName =
          creator.user.user_metadata.display_name || creatorName;
      } catch {
        // keep default
      }

      const offerCount = offerCounts[order.id] ?? 0;
      const userHasOffered = offeredOrderIds.has(order.id);
      const { urgency, daysUntilDue } = computeDueUrgency(order.due_date);
      const isNew = computeIsNew(order.created_at);
      const tagMatchesProfile = hasProfile
        ? checkTagMatch(
            order.tags ?? [],
            profileProcesses,
            profileMaterialCategories
          )
        : false;

      return {
        order: { ...order, creator_name: creatorName },
        offerCount,
        userHasOffered,
        dueUrgency: urgency,
        daysUntilDue,
        isNew,
        tagMatchesProfile,
      };
    })
  );

  return enriched;
}
