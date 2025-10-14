export type Offer = {
  id: number;
  offerer: string;
  order_id: number;
  created_at: Date;
  unit_cost: number;
  projected_cost: number;
  projected_units: number;
  shipping_cost: number;
  lead_time: number;
  is_accepted: boolean;
  manufacturer_name: string;
  manufacturer_email: string;
};
