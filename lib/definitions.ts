import { User } from "@supabase/supabase-js";

export type Order = {
  id: number;
  title: string;
  description: string | null;
  creator?: string;
  creator_name?: string;
  creator_email?: string;
  status: OrderStatus;
  created_at: Date;
  last_update: Date;
  manufacturer?: string | null;
  manufacturer_name?: string;
  fileURLs: string | null;
  due_date: Date;
  quantity: number;
  tags?: string[];
  isArchived?: boolean;
  offers?: Offer[];
  selected_offer?: number;
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  shipping_info?: {
    tracking_number: string;
    carrier: string;
  };
  livestream_url?: string | null;
  price?: {
    unit_cost: number;
    projected_cost: number;
    projected_units: number;
    shipping_cost: number;
  };
};

export type Offer = {
  id?: number;
  offerer: string | null;
  order_id: number;
  created_at?: Date | null;
  unit_cost: number;
  projected_cost: number;
  projected_units: number;
  shipping_cost: number;
  lead_time: number;
  is_accepted?: boolean | null;
  is_declined?: boolean | null;
  manufacturer_name: string;
  manufacturer_email: string;
};

export type Event = {
  id: string;
  order_id: number;
  event_type: string;
  description: string;
  created_at: Date;
  user_id: string;
  metadata: {};
};

export enum OrderStatus {
  OrderCreated = "Order Created",
  ManufacturerOffer = "Manufacturer Offer",
  OrderAccepted = "Order Accepted",
  MachineSetup = "Machine Setup",
  StartedManufacturing = "Started Manufacturing",
  QualityCheck = "Quality Check",
  Shipped = "Shipping",
  Completed = "Completed",
}

export const ProcessTags = [
  {
    id: "cnc_machining",
    label: "CNC Machining",
  },
  {
    id: "3d_printing",
    label: "3D Printing",
  },
  {
    id: "injection_molding",
    label: "Injection Molding",
  },
  {
    id: "sheet_metal_fabrication",
    label: "Sheet Metal Fabrication",
  },
  {
    id: "casting",
    label: "Casting",
  },
  {
    id: "forging",
    label: "Forging",
  },
  {
    id: "welding",
    label: "Welding",
  },
  {
    id: "laser_cutting",
    label: "Laser Cutting",
  },
  {
    id: "waterjet_cutting",
    label: "Waterjet Cutting",
  },
  {
    id: "plasma_cutting",
    label: "Plasma Cutting",
  },
  {
    id: "extrusion",
    label: "Extrusion",
  },
  {
    id: "surface_finishing",
    label: "Surface Finishing",
  },
  {
    id: "anodizing",
    label: "Anodizing",
  },
  {
    id: "powder_coating",
    label: "Powder Coating",
  },
] as const;

export const MaterialTags = [
  {
    id: "metal",
    label: "Metal",
  },
  {
    id: "plastic",
    label: "Plastic",
  },
  {
    id: "composite",
    label: "Composite",
  },
  {
    id: "ceramic",
    label: "Ceramic",
  },
  {
    id: "wood",
    label: "Wood",
  },
  {
    id: "glass",
    label: "Glass",
  },
  {
    id: "rubber",
    label: "Rubber",
  },
  {
    id: "carbon_fiber",
    label: "Carbon Fiber",
  },
] as const;
export const MiscTags = [
  {
    id: "mass_production",
    label: "Mass Production",
  },
  {
    id: "low_volume_production",
    label: "Low Volume Production",
  },
  {
    id: "high_volume_production",
    label: "High Volume Production",
  },
] as const;
