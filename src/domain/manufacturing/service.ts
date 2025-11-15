'use server';

import {
  fetchAssemblies,
  fetchAssemblyParts,
  fetchPartSpecificationsByAssembly,
  fetchShippingAddress,
  fetchSplitPartsByStoragePath,
  insertAssembly,
  insertAssemblyParts,
  markAssemblySpecificationsCompleted,
  updateAssemblyBuildOrders,
  upsertPartSpecification,
  upsertShippingAddress,
} from '@/lib/supabase/manufacturing';
import { getCurrentUser } from '@/lib/supabase/users';
import type {
  AssemblyWithParts,
  PartSpecificationContent,
  PartSpecificationRecord,
} from './types';

const requireAuth = async () => {
  const { user, error } = await getCurrentUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return user;
};

export async function listAssembliesWithParts(
  orderId: string
): Promise<AssemblyWithParts[]> {
  await requireAuth();
  const { data, error } = await fetchAssemblies(orderId);
  if (error) {
    throw error;
  }

  const assemblyIds = data.map((row) => row.id);
  const { data: parts, error: partsError } =
    await fetchAssemblyParts(assemblyIds);
  if (partsError) {
    throw partsError;
  }

  return data.map((assembly) => ({
    ...assembly,
    partIds: parts
      .filter((row) => row.assembly_id === assembly.id)
      .map((row) => row.part_id),
  }));
}

export async function createAssemblyWithParts({
  orderId,
  assemblyName,
  partIds,
  parts,
}: {
  orderId: string;
  assemblyName: string;
  partIds: string[];
  parts: {
    storagePath: string;
    name: string;
    hierarchy: string[];
  }[];
}): Promise<AssemblyWithParts> {
  await requireAuth();
  console.log('[service:createAssemblyWithParts] start', {
    orderId,
    assemblyName,
    partCount: parts.length,
  });
  const assemblyPayload = {
    order_id: orderId,
    assembly_name: sanitizeLabel(assemblyName),
    build_order: null,
    specifications_completed: false,
  } as const;

  const { data: existingParts } = await fetchSplitPartsByStoragePath(
    orderId,
    parts.map((part) => part.storagePath)
  );
  const existingByPath = new Map(
    existingParts.map((part) => [part.storage_path, part])
  );
  console.log('[service:createAssemblyWithParts] existing parts match', {
    orderId,
    requested: parts.length,
    existing: existingParts.length,
  });

  const resolvedPartIds: string[] = [];
  const missingPaths: string[] = [];

  parts.forEach((part) => {
    const existing = existingByPath.get(part.storagePath);
    if (existing) {
      resolvedPartIds.push(existing.id);
    } else {
      missingPaths.push(part.storagePath);
    }
  });

  if (missingPaths.length > 0) {
    console.error(
      '[service:createAssemblyWithParts] missing split parts in storage',
      {
        orderId,
        missingPaths,
      }
    );
    throw new Error(
      `Unable to locate ${missingPaths.length} split part(s) for this order. Ensure the CAD split service uploaded the parts before creating assemblies.`
    );
  }

  const { data, error } = await insertAssembly(assemblyPayload);
  if (error || !data) {
    console.error('[service:createAssemblyWithParts] insertAssembly failed', {
      orderId,
      error,
    });
    throw error ?? new Error('Failed to create assembly');
  }

  const dbPartIds = resolvedPartIds;

  const { error: linkError } = await insertAssemblyParts(data.id, dbPartIds);
  if (linkError) {
    console.error(
      '[service:createAssemblyWithParts] insertAssemblyParts failed',
      {
        orderId,
        assemblyId: data.id,
        error: linkError,
      }
    );
    throw linkError;
  }

  console.log('[service:createAssemblyWithParts] success', {
    orderId,
    assemblyId: data.id,
    linkedParts: dbPartIds.length,
  });
  return {
    ...data,
    partIds,
  };
}

export async function reorderAssemblies(orderId: string, orderedIds: string[]) {
  await requireAuth();
  const buildOrders = orderedIds.map((id, index) => ({
    id,
    order_id: orderId,
    build_order: index + 1,
  }));
  const { error } = await updateAssemblyBuildOrders(buildOrders);
  if (error) {
    throw error;
  }
}

export async function savePartSpecification({
  orderId,
  assemblyId,
  partId,
  quantity,
  specifications,
}: {
  orderId: string;
  assemblyId: string;
  partId: string;
  quantity: number;
  specifications: PartSpecificationContent;
}): Promise<PartSpecificationRecord> {
  await requireAuth();
  const { data: splitPartRecords, error: splitPartError } =
    await fetchSplitPartsByStoragePath(orderId, [partId]);
  if (splitPartError) {
    throw splitPartError;
  }

  const splitPart = splitPartRecords[0];
  if (!splitPart) {
    throw new Error(
      'Unable to locate the selected part for specifications. Please refresh the CAD data and try again.'
    );
  }

  const payload = {
    order_id: orderId,
    assembly_id: assemblyId,
    part_id: splitPart.id,
    quantity,
    specifications,
  } as const;

  const { data, error } = await upsertPartSpecification(payload);
  if (error || !data) {
    throw error ?? new Error('Failed to save part specifications');
  }

  return {
    ...data,
    specifications: data.specifications as PartSpecificationContent,
  };
}

export async function listPartSpecifications(assemblyId: string) {
  await requireAuth();
  const { data, error } = await fetchPartSpecificationsByAssembly(assemblyId);
  if (error) {
    throw error;
  }

  return data.map((row) => ({
    ...row,
    specifications: row.specifications as PartSpecificationContent,
  })) as PartSpecificationRecord[];
}

export async function updateAssemblySpecificationStatus(
  assemblyId: string,
  completed: boolean
) {
  await requireAuth();
  const { data, error } = await markAssemblySpecificationsCompleted(
    assemblyId,
    completed
  );
  if (error || !data) {
    throw error ?? new Error('Failed to update assembly status');
  }
  return data;
}

export async function saveShippingDetails({
  orderId,
  recipientName,
  companyName,
  street1,
  street2,
  city,
  state,
  postalCode,
  country,
  phoneNumber,
}: {
  orderId: string;
  recipientName: string;
  companyName?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}) {
  await requireAuth();
  const { data, error } = await upsertShippingAddress({
    order_id: orderId,
    recipient_name: recipientName,
    company_name: companyName ?? null,
    street1,
    street2: street2 ?? '',
    city,
    state,
    postal_code: postalCode,
    country,
    phone_number: phoneNumber,
  });
  if (error || !data) {
    throw error ?? new Error('Failed to save shipping address');
  }
  return data;
}

export async function fetchShippingDetails(orderId: string) {
  await requireAuth();
  const { data, error } = await fetchShippingAddress(orderId);
  if (error) {
    throw error;
  }
  return data;
}
const sanitizeLabel = (value: string): string => {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || 'Part';
};
