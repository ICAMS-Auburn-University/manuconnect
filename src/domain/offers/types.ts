export interface CreateOfferInput {
  order_id: string;
  unit_cost: number;
  projected_cost: number;
  projected_units: number;
  shipping_cost: number;
  lead_time: number;
}
