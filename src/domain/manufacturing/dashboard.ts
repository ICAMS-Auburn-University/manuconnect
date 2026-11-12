'use server';

import { logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/supabase/users';
import { fetchPartAssignmentsByManufacturer } from '@/lib/supabase/part-assignments';
import { getManufacturerOrders } from '@/domain/orders/service';
import { getMyOffers } from '@/domain/offers/service';
import { OrderStatus } from '@/types/enums';
import { daysUntil } from '@/lib/utils/dates';
import { fetchSplitPartsByOrder } from '@/lib/supabase/manufacturing';

export interface ManufacturerDashboardStats {
  openOffers: number;
  activeJobs: number;
  dueThisWeek: number;
  partsToShip: number;
}

const SHIPPED_PART_STATUSES = new Set(['Shipped', 'Delivered']);

export async function getManufacturerDashboardStats(): Promise<ManufacturerDashboardStats> {
  const empty = { openOffers: 0, activeJobs: 0, dueThisWeek: 0, partsToShip: 0 };

  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return empty;
    }

    const [offers, orders, assignments] = await Promise.all([
      getMyOffers(),
      getManufacturerOrders(),
      fetchPartAssignmentsByManufacturer(user.id),
    ]);

    const activeOrders = (orders ?? []).filter(
      (order) => !order.isArchived && order.status !== OrderStatus.Completed
    );
    const activeOrderIds = new Set(activeOrders.map((order) => order.id));

    return {
      openOffers: offers.filter((entry) => entry.status === 'pending').length,
      activeJobs: activeOrders.length,
      dueThisWeek: activeOrders.filter((order) => daysUntil(order.due_date) <= 7)
        .length,
      partsToShip: assignments.data.filter(
        (assignment) => activeOrderIds.has(assignment.order_id) && !SHIPPED_PART_STATUSES.has(assignment.status)
      ).length,
    };
  } catch (error: unknown) {
    logger.error(error, 'manufacturing:getManufacturerDashboardStats');
    return empty;
  }
}

export async function getManufacturerWorkQueue() {
  const { user, error } = await getCurrentUser();
  if (error || !user) throw new Error('Please sign in to view your work.');

  const [orders, assignments] = await Promise.all([
    getManufacturerOrders(),
    fetchPartAssignmentsByManufacturer(user.id),
  ]);
  if (!orders || assignments.error) throw new Error('Unable to load your work queue.');

  const activeOrders = orders.filter(
    (order) => !order.isArchived && order.status !== OrderStatus.Completed
  );
  const activeOrderIds = new Set(activeOrders.map((order) => order.id));
  const activeAssignments = assignments.data.filter(
    (assignment) => activeOrderIds.has(assignment.order_id) && !SHIPPED_PART_STATUSES.has(assignment.status)
  );
  const orderIds = Array.from(new Set(activeAssignments.map((assignment) => assignment.order_id)));
  const partResults = await Promise.all(orderIds.map((id) => fetchSplitPartsByOrder(id)));
  if (partResults.some((result) => result.error)) throw new Error('Unable to load your assigned parts.');
  const partNames = new Map(partResults.flatMap((result) => result.data.map((part) => [part.id, part.name] as const)));

  return {
    dueOrders: activeOrders.filter((order) => daysUntil(order.due_date) <= 7)
      .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime()),
    partOrders: activeOrders.map((order) => ({
      order,
      parts: activeAssignments.filter((assignment) => assignment.order_id === order.id)
        .map((assignment) => ({ id: assignment.id, name: partNames.get(assignment.part_id) ?? 'Unknown part', status: assignment.status })),
    })).filter((entry) => entry.parts.length > 0),
  };
}
