'use server';

import { logger } from '@/lib/logger';
import { PartAssignmentsSchema, SplitPartsSchema } from '@/types/schemas';
import {
  fetchPartAssignmentsByOrder,
  fetchPartAssignmentsByManufacturer,
  upsertPartAssignments,
  updatePartAssignmentStatus,
  deletePartAssignment,
  fetchManufacturersList,
} from '@/lib/supabase/part-assignments';
import { fetchSplitPartsByOrder } from '@/lib/supabase/manufacturing';
import { getCurrentUser } from '@/lib/supabase/orders';

export interface ManufacturerSummary {
  id: string;
  companyName: string;
  email: string;
  processes: string[];
  materialCategories: string[];
  certifications: string[];
}

export interface PartAssignmentWithPart extends PartAssignmentsSchema {
  partName: string;
  partHierarchy: string[];
  storagePath: string;
}

export interface CollaborationData {
  assignments: PartAssignmentWithPart[];
  splitParts: SplitPartsSchema[];
  collaborators: {
    manufacturerId: string;
    manufacturerName: string;
    partCount: number;
    completedCount: number;
  }[];
  isLeadManufacturer: boolean;
  currentUserId: string;
}

/**
 * Get all collaboration data for an order — assignments, parts, and collaborator summaries.
 */
export async function getCollaborationData(
  orderId: string
): Promise<CollaborationData> {
  const { user } = await getCurrentUser();
  const currentUserId = user?.id ?? '';

  const [assignmentsResult, partsResult] = await Promise.all([
    fetchPartAssignmentsByOrder(orderId),
    fetchSplitPartsByOrder(orderId),
  ]);

  if (assignmentsResult.error) {
    logger.error(assignmentsResult.error, 'collaboration:getAssignments');
  }
  if (partsResult.error) {
    logger.error(partsResult.error, 'collaboration:getSplitParts');
  }

  const splitParts = partsResult.data;
  const assignments = assignmentsResult.data;

  // Build a map of part_id → split_part for enrichment
  const partMap = new Map<string, SplitPartsSchema>();
  splitParts.forEach((p) => partMap.set(p.id, p));

  // Enrich assignments with part data
  const enrichedAssignments: PartAssignmentWithPart[] = assignments.map(
    (a) => {
      const part = partMap.get(a.part_id);
      return {
        ...a,
        partName: part?.name ?? 'Unknown Part',
        partHierarchy: part?.hierarchy ?? [],
        storagePath: part?.storage_path ?? '',
      };
    }
  );

  // Compute collaborator summaries
  const collabMap = new Map<
    string,
    { name: string; total: number; completed: number }
  >();
  assignments.forEach((a) => {
    if (!a.assigned_manufacturer) return;
    const existing = collabMap.get(a.assigned_manufacturer) ?? {
      name: a.manufacturer_name,
      total: 0,
      completed: 0,
    };
    existing.total += 1;
    if (a.status === 'Completed' || a.status === 'Shipped') {
      existing.completed += 1;
    }
    collabMap.set(a.assigned_manufacturer, existing);
  });

  const collaborators = Array.from(collabMap.entries()).map(
    ([manufacturerId, data]) => ({
      manufacturerId,
      manufacturerName: data.name,
      partCount: data.total,
      completedCount: data.completed,
    })
  );

  return {
    assignments: enrichedAssignments,
    splitParts,
    collaborators,
    isLeadManufacturer: false, // Will be set by caller with order data
    currentUserId,
  };
}

/**
 * Assign parts to a subcontractor. Only the lead manufacturer can do this.
 */
export async function assignPartsToSubcontractor(
  orderId: string,
  partIds: string[],
  manufacturerId: string,
  manufacturerName: string
): Promise<{ success: boolean; error: string | null }> {
  if (partIds.length === 0) {
    return { success: false, error: 'No parts selected' };
  }

  const payloads = partIds.map((partId) => ({
    order_id: orderId,
    part_id: partId,
    assembly_id: null,
    assigned_manufacturer: manufacturerId,
    manufacturer_name: manufacturerName,
    status: 'Not Started',
  }));

  const { error } = await upsertPartAssignments(payloads);

  if (error) {
    logger.error(error, 'collaboration:assignParts');
    return { success: false, error: String(error) };
  }

  return { success: true, error: null };
}

/**
 * Unassign a part (remove subcontractor assignment).
 */
export async function unassignPart(
  assignmentId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await deletePartAssignment(assignmentId);

  if (error) {
    logger.error(error, 'collaboration:unassignPart');
    return { success: false, error: String(error) };
  }

  return { success: true, error: null };
}

/**
 * Update the status of a part assignment.
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  newStatus: string
): Promise<{ success: boolean; error: string | null }> {
  const timestamps: { started_at?: string; completed_at?: string } = {};

  if (newStatus === 'In Progress') {
    timestamps.started_at = new Date().toISOString();
  }
  if (newStatus === 'Completed' || newStatus === 'Shipped') {
    timestamps.completed_at = new Date().toISOString();
  }

  const { error } = await updatePartAssignmentStatus(
    assignmentId,
    newStatus,
    timestamps
  );

  if (error) {
    logger.error(error, 'collaboration:updateStatus');
    return { success: false, error: String(error) };
  }

  return { success: true, error: null };
}

/**
 * Get all manufacturers for the subcontractor picker.
 * Excludes the current lead manufacturer.
 */
export async function getAvailableManufacturers(
  excludeUserId?: string
): Promise<ManufacturerSummary[]> {
  const { data, error } = await fetchManufacturersList();

  if (error) {
    logger.error(error, 'collaboration:getManufacturers');
    return [];
  }

  return excludeUserId
    ? data.filter((m) => m.id !== excludeUserId)
    : data;
}

/**
 * Get all orders where the current user is a subcontractor.
 */
export async function getSubcontractedOrders(
  userId: string
): Promise<string[]> {
  const { data, error } = await fetchPartAssignmentsByManufacturer(userId);

  if (error) {
    logger.error(error, 'collaboration:getSubcontractedOrders');
    return [];
  }

  // Return unique order IDs
  return [...new Set(data.map((a) => a.order_id))];
}
