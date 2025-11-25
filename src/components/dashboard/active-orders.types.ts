import type { OrdersSchema } from '@/types/schemas';

export type DerivedOrderStatus =
  | 'Draft'
  | 'Finding Manufacturers'
  | 'Building In Progress'
  | 'Quality Check'
  | 'Shipping'
  | 'Completed';

export interface ActiveOrderSummary {
  order: OrdersSchema;
  status: DerivedOrderStatus;
  statusDescription: string;
  totalAssemblies: number;
  completedAssemblies: number;
  awaitingManufacturers: number;
  canArchive: boolean;
}
