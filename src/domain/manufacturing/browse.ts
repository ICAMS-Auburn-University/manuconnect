'use server';

import {
  fetchSplitPartsByOrder,
  fetchPartSpecificationsByOrder,
  fetchAssemblies,
  fetchAssemblyParts,
} from '@/lib/supabase/manufacturing';
import { fetchManufacturerProfile } from '@/lib/supabase/manufacturers';
import { getCurrentUser } from '@/lib/supabase/users';
import { SPECIFICATIONS } from '@/lib/specifications';
import type { PartSpecificationContent } from '@/domain/manufacturing/types';

export interface OrderPartSummary {
  partId: string;
  name: string;
  assemblyName: string | null;
  assemblyId: string | null;
  material: string | null;
  materialCategory: string | null;
  processType: string | null;
  operations: string[];
  matchesCapabilities: boolean;
  matchReasons: string[];
}

export interface OrderPartsBreakdown {
  parts: OrderPartSummary[];
  totalParts: number;
  matchingParts: number;
  hasProfile: boolean;
}

export async function getOrderPartsBreakdown(
  orderId: string
): Promise<OrderPartsBreakdown> {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { parts: [], totalParts: 0, matchingParts: 0, hasProfile: false };
  }

  // Fetch parts, specs, assemblies in parallel
  const [partsResult, specsResult, assembliesResult, profileResult] =
    await Promise.all([
      fetchSplitPartsByOrder(orderId),
      fetchPartSpecificationsByOrder(orderId),
      fetchAssemblies(orderId),
      fetchManufacturerProfile(user.id),
    ]);

  const parts = partsResult.data;
  const specs = specsResult.data;
  const assemblies = assembliesResult.data;
  const profile = profileResult.data;

  // Build assembly parts mapping
  const assemblyIds = assemblies.map((a) => a.id);
  let assemblyPartsMap = new Map<string, string>();
  let assemblyNameMap = new Map<string, string>();

  if (assemblyIds.length > 0) {
    const { data: assemblyParts } = await fetchAssemblyParts(assemblyIds);
    for (const ap of assemblyParts) {
      assemblyPartsMap.set(ap.part_id, ap.assembly_id);
    }
  }
  for (const a of assemblies) {
    assemblyNameMap.set(a.id, a.assembly_name);
  }

  // Map specs by part_id
  const specsByPart = new Map<string, PartSpecificationContent>();
  for (const spec of specs) {
    specsByPart.set(
      spec.part_id,
      spec.specifications as unknown as PartSpecificationContent
    );
  }

  const hasProfile =
    !!profile && (profile.processes.length > 0 || profile.material_categories.length > 0);

  // Normalize profile data for matching
  const profileProcessesLower = new Set(
    (profile?.processes ?? []).map((p) => p.toLowerCase())
  );
  const profileMaterials = new Set(
    (profile?.material_categories ?? []).map((m) => m.toLowerCase())
  );

  // Build a set of process types the manufacturer can handle
  // by reverse-mapping their specific processes to high-level types
  const profileProcessTypes = new Set<string>();
  for (const [processType, specificProcesses] of Object.entries(
    SPECIFICATIONS.PROCESS_TYPE_TO_PROCESSES
  )) {
    const hasAny = specificProcesses.some((sp) =>
      profileProcessesLower.has(sp.toLowerCase())
    );
    if (hasAny) {
      profileProcessTypes.add(processType.toLowerCase());
    }
  }

  const partSummaries: OrderPartSummary[] = parts.map((part) => {
    const spec = specsByPart.get(part.id);
    const assemblyId = assemblyPartsMap.get(part.id) ?? null;
    const assemblyName = assemblyId
      ? assemblyNameMap.get(assemblyId) ?? null
      : null;

    const material = spec?.material?.material ?? null;
    const materialCategory = spec?.material?.category ?? null;
    const processType = spec?.process?.type ?? null;
    const operations = spec?.process?.operations ?? [];

    // Match capabilities
    const matchReasons: string[] = [];
    let matchesProcess = false;
    let matchesMaterial = false;

    if (!hasProfile) {
      // Can't match without a profile
      return {
        partId: part.id,
        name: part.name,
        assemblyName,
        assemblyId,
        material,
        materialCategory,
        processType,
        operations,
        matchesCapabilities: false,
        matchReasons: [],
      };
    }

    // Check process match via process type mapping
    if (processType) {
      matchesProcess = profileProcessTypes.has(processType.toLowerCase());
    }

    // Check material match (direct category comparison)
    if (materialCategory) {
      matchesMaterial = profileMaterials.has(materialCategory.toLowerCase());
    }

    if (matchesProcess) matchReasons.push('Process match');
    if (matchesMaterial) matchReasons.push('Material match');

    // If no specs defined, we can't determine match
    const hasSpecs = processType || materialCategory;
    const matchesCapabilities = hasSpecs
      ? matchesProcess || matchesMaterial
      : false;

    return {
      partId: part.id,
      name: part.name,
      assemblyName,
      assemblyId,
      material,
      materialCategory,
      processType,
      operations,
      matchesCapabilities,
      matchReasons,
    };
  });

  // Sort: matching parts first
  partSummaries.sort((a, b) => {
    if (a.matchesCapabilities && !b.matchesCapabilities) return -1;
    if (!a.matchesCapabilities && b.matchesCapabilities) return 1;
    return 0;
  });

  return {
    parts: partSummaries,
    totalParts: partSummaries.length,
    matchingParts: partSummaries.filter((p) => p.matchesCapabilities).length,
    hasProfile,
  };
}
