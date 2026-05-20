import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import type { PartAssignmentsSchema } from '@/types/schemas';

type AssignPartPayload = Pick<
  PartAssignmentsSchema,
  | 'order_id'
  | 'part_id'
  | 'assembly_id'
  | 'assigned_manufacturer'
  | 'manufacturer_name'
  | 'status'
>;

const MISSING_TABLE_MESSAGE =
  'part_assignments table is missing. Run supabase migration 001_part_assignments.sql and refresh schema cache.';

function isMissingPartAssignmentsTable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === 'PGRST205' &&
    (maybeError.message ?? '').includes('part_assignments')
  );
}

function toMissingTableError() {
  return {
    code: 'PGRST205',
    message: MISSING_TABLE_MESSAGE,
  };
}

export async function fetchPartAssignmentsByOrder(orderId: string) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('part_assignments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (isMissingPartAssignmentsTable(error)) {
    return {
      data: [] as PartAssignmentsSchema[],
      error: null,
    };
  }

  return {
    data: (data as PartAssignmentsSchema[]) ?? [],
    error,
  };
}

export async function fetchPartAssignmentsByManufacturer(
  manufacturerId: string
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('part_assignments')
    .select('*')
    .eq('assigned_manufacturer', manufacturerId)
    .order('created_at', { ascending: true });

  if (isMissingPartAssignmentsTable(error)) {
    return {
      data: [] as PartAssignmentsSchema[],
      error: null,
    };
  }

  return {
    data: (data as PartAssignmentsSchema[]) ?? [],
    error,
  };
}

export async function upsertPartAssignment(payload: AssignPartPayload) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('part_assignments')
    .upsert(payload, {
      onConflict: 'order_id,part_id',
      ignoreDuplicates: false,
    })
    .select('*')
    .single();

  if (isMissingPartAssignmentsTable(error)) {
    return {
      data: null,
      error: toMissingTableError(),
    };
  }

  return {
    data: data as PartAssignmentsSchema | null,
    error,
  };
}

export async function upsertPartAssignments(payloads: AssignPartPayload[]) {
  if (payloads.length === 0) {
    return { data: [] as PartAssignmentsSchema[], error: null };
  }

  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('part_assignments')
    .upsert(payloads, {
      onConflict: 'order_id,part_id',
      ignoreDuplicates: false,
    })
    .select('*');

  if (isMissingPartAssignmentsTable(error)) {
    return {
      data: [] as PartAssignmentsSchema[],
      error: toMissingTableError(),
    };
  }

  return {
    data: (data as PartAssignmentsSchema[]) ?? [],
    error,
  };
}

export async function updatePartAssignmentStatus(
  assignmentId: string,
  status: string,
  timestamps?: { started_at?: string; completed_at?: string }
) {
  const supabase = await createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('part_assignments')
    .update({ status, ...timestamps })
    .eq('id', assignmentId)
    .select('*')
    .single();

  if (isMissingPartAssignmentsTable(error)) {
    return {
      data: null,
      error: toMissingTableError(),
    };
  }

  return {
    data: data as PartAssignmentsSchema | null,
    error,
  };
}

export async function deletePartAssignment(assignmentId: string) {
  const supabase = await createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from('part_assignments')
    .delete()
    .eq('id', assignmentId);

  if (isMissingPartAssignmentsTable(error)) {
    return { error: toMissingTableError() };
  }

  return { error };
}

export async function fetchManufacturersList() {
  const supabase = await createSupabaseServiceRoleClient();

  // Fetch all users with account_type = 'manufacturer' via auth admin
  const { data: profilesData, error: profilesError } = await supabase
    .from('manufacturer_profiles')
    .select('user_id, processes, material_categories, certifications');

  if (profilesError) {
    return { data: [], error: profilesError };
  }

  // Get user metadata for each manufacturer
  const manufacturers: {
    id: string;
    companyName: string;
    email: string;
    processes: string[];
    materialCategories: string[];
    certifications: string[];
  }[] = [];

  for (const profile of profilesData ?? []) {
    const { data: userData } = await supabase.auth.admin.getUserById(
      profile.user_id
    );

    if (userData?.user) {
      manufacturers.push({
        id: profile.user_id,
        companyName:
          userData.user.user_metadata?.company_name || 'Unknown Company',
        email: userData.user.email || '',
        processes: profile.processes ?? [],
        materialCategories: profile.material_categories ?? [],
        certifications: profile.certifications ?? [],
      });
    }
  }

  return { data: manufacturers, error: null };
}
