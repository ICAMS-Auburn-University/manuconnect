import type { OffersSchema, OrdersSchema } from '@/types/schemas';

export interface CreateOfferInput {
  order_id: string;
  unit_cost: number;
  projected_cost: number;
  projected_units: number;
  shipping_cost: number;
  lead_time: number;
  part_ids?: string[];
}

export type MyOfferStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'not_selected'
  | 'order_closed';

export interface MyOfferEntry {
  offer: OffersSchema;
  status: MyOfferStatus;
  order: Pick<
    OrdersSchema,
    | 'id'
    | 'title'
    | 'status'
    | 'due_date'
    | 'quantity'
    | 'creator_name'
    | 'manufacturer'
    | 'isArchived'
  > | null;
}
