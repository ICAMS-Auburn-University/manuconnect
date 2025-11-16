import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import type {
  AssembliesSchema,
  AssemblyPartsSchema,
  PartSpecificationsSchema,
  ShippingAddressesSchema,
  SplitPartsSchema,
} from '@/types/schemas';

type AssemblyInsertPayload = Pick<
  AssembliesSchema,
  'order_id' | 'assembly_name' | 'build_order' | 'specifications_completed'
>;

export async function fetchAssemblies(orderId: string) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('assemblies')
    .select('*')
    .eq('order_id', orderId)
    .order('build_order', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });

  return {
    data: (data as AssembliesSchema[]) ?? [],
    error,
  };
}

export async function insertAssembly(payload: AssemblyInsertPayload) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('assemblies')
    .insert(payload)
    .select('*')
    .single();

  return {
    data: data as AssembliesSchema | null,
    error,
  };
}

export async function insertAssemblyParts(
  assemblyId: string,
  partIds: string[]
) {
  if (partIds.length === 0) {
    return { data: [] as AssemblyPartsSchema[], error: null };
  }

  const supabase = await createSupabaseServiceRoleClient();
  const rows = partIds.map((partId) => ({
    assembly_id: assemblyId,
    part_id: partId,
  }));

  const { data, error } = await supabase
    .from('assembly_parts')
    .insert(rows)
    .select('*');

  return {
    data: (data as AssemblyPartsSchema[]) ?? [],
    error,
  };
}

export async function fetchAssemblyParts(assemblyIds: string[]) {
  if (assemblyIds.length === 0) {
    return { data: [] as AssemblyPartsSchema[], error: null };
  }

  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('assembly_parts')
    .select('*')
    .in('assembly_id', assemblyIds);

  return {
    data: (data as AssemblyPartsSchema[]) ?? [],
    error,
  };
}

export async function fetchSplitPartsByStoragePath(
  orderId: string,
  storagePaths: string[]
) {
  if (storagePaths.length === 0) {
    return { data: [] as SplitPartsSchema[], error: null };
  }

  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('split_parts')
    .select('*')
    .eq('order_id', orderId)
    .in('storage_path', storagePaths);

  return {
    data: (data as SplitPartsSchema[]) ?? [],
    error,
  };
}

export async function updateAssemblyBuildOrders(
  buildOrders: { id: string; build_order: number }[]
) {
  if (buildOrders.length === 0) {
    return { error: null };
  }

  const supabase = await createSupabaseServiceRoleClient();
  for (const entry of buildOrders) {
    const { error } = await supabase
      .from('assemblies')
      .update({ build_order: entry.build_order })
      .eq('id', entry.id);
    if (error) {
      return { error };
    }
  }

  return { error: null };
}

export async function markAssemblySpecificationsCompleted(
  assemblyId: string,
  completed: boolean
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('assemblies')
    .update({ specifications_completed: completed })
    .eq('id', assemblyId)
    .select('*')
    .single();

  return {
    data: data as AssembliesSchema | null,
    error,
  };
}

export async function upsertPartSpecification(
  payload: Pick<
    PartSpecificationsSchema,
    'order_id' | 'assembly_id' | 'part_id' | 'quantity' | 'specifications'
  >
) {
  const supabase = await createSupabaseServiceRoleClient();

  const { data: existing, error: lookupError } = await supabase
    .from('part_specifications')
    .select('id')
    .eq('order_id', payload.order_id)
    .eq('assembly_id', payload.assembly_id)
    .eq('part_id', payload.part_id)
    .maybeSingle();

  if (lookupError) {
    return { data: null, error: lookupError };
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from('part_specifications')
      .update({
        quantity: payload.quantity,
        specifications: payload.specifications,
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    return {
      data: data as PartSpecificationsSchema | null,
      error,
    };
  }

  const { data, error } = await supabase
    .from('part_specifications')
    .insert(payload)
    .select('*')
    .single();

  return {
    data: data as PartSpecificationsSchema | null,
    error,
  };
}

export async function fetchPartSpecificationsByAssembly(assemblyId: string) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('part_specifications')
    .select('*')
    .eq('assembly_id', assemblyId);

  return {
    data: (data as PartSpecificationsSchema[]) ?? [],
    error,
  };
}

export async function fetchShippingAddress(orderId: string) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  return {
    data: (data as ShippingAddressesSchema | null) ?? null,
    error,
  };
}

export async function upsertShippingAddress(
  payload: Pick<
    ShippingAddressesSchema,
    | 'order_id'
    | 'recipient_name'
    | 'company_name'
    | 'street1'
    | 'street2'
    | 'city'
    | 'state'
    | 'postal_code'
    | 'country'
    | 'phone_number'
  >
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('shipping_addresses')
    .upsert(payload, {
      onConflict: 'order_id',
      ignoreDuplicates: false,
    })
    .select('*')
    .single();

  return {
    data: data as ShippingAddressesSchema | null,
    error,
  };
}
