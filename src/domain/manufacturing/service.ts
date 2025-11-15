'use server';

import {
  fetchAssemblies,
  fetchAssemblyParts,
  fetchPartSpecificationsByAssembly,
  fetchShippingAddress,
  insertAssembly,
  insertAssemblyParts,
  markAssemblySpecificationsCompleted,
  updateAssemblyBuildOrders,
  upsertPartSpecification,
  upsertShippingAddress,
  upsertSplitParts,
} from '@/lib/supabase/manufacturing';
import { getCurrentUser } from '@/lib/supabase/users';
import type {
  AssemblyWithParts,
  PartSpecificationContent,
  PartSpecificationRecord,
} from './types';
import { createHash } from 'crypto';

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
  const assemblyPayload = {
    order_id: orderId,
    assembly_name: sanitizeLabel(assemblyName),
    build_order: null,
    specifications_completed: false,
  } as const;

  const partRecords = parts.map((part) => ({
    id: derivePartId(orderId, part.storagePath),
    order_id: orderId,
    name: sanitizeLabel(part.name),
    storage_path: part.storagePath,
    hierarchy: part.hierarchy.map(sanitizeLabel),
  }));

  if (partRecords.length > 0) {
    await upsertSplitParts(partRecords);
  }

  const { data, error } = await insertAssembly(assemblyPayload);
  if (error || !data) {
    throw error ?? new Error('Failed to create assembly');
  }

  const dbPartIds =
    partRecords.length > 0
      ? partRecords.map((record) => record.id)
      : partIds.map((path) => derivePartId(orderId, path));

  const { error: linkError } = await insertAssemblyParts(data.id, dbPartIds);
  if (linkError) {
    throw linkError;
  }

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
  const payload = {
    order_id: orderId,
    assembly_id: assemblyId,
    part_id: partId,
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

const derivePartId = (orderId: string, storagePath: string): string => {
  const hash = createHash('sha1')
    .update(`${orderId}:${storagePath}`)
    .digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
};
