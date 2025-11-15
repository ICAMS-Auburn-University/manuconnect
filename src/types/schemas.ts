import { Address } from '@/types/shared';

export interface UsersMapSchema {
  id: string; // uuid
  display_name: string;
}

export interface ChatsSchema {
  chat_id: string; // uuid
  members: string[]; // uuid[]
  is_direct_message: boolean;
  created_at: string; // timestamp with time zone (ISO string)
}

export interface EventsSchema {
  id: string; // uuid
  event_type: string;
  description: string;
  user_id: string;
  created_at: string;
  order_id: string;
}

export interface MessagesSchema {
  message_id: string; // uuid
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[]; // uuid[]
  attachment_ids: string[]; // uuid[]
}

export interface OffersSchema {
  id: string; // uuid
  created_at: string; // timestamp with time zone (ISO string)
  offerer: string; // uuid
  order_id: string; // uuid
  is_accepted: boolean;
  unit_cost: string; // numeric → use string to preserve precision
  projected_cost: string;
  lead_time: string;
  projected_units: string;
  shipping_cost: string;
  last_update: string; // timestamp with time zone
  manufacturer_name: string;
  is_declined: boolean;
  manufacturer_email: string;
}

export interface OrdersSchema {
  id: string; // uuid
  title: string;
  creator: string;
  last_update: string;
  created_at: string;
  status: string;
  manufacturer: string | null;
  fileURLs: string;
  description: string;
  quantity: number;
  due_date: string;
  tags: string[];
  creator_name: string;
  isArchived: boolean;
  selected_offer: string | null;
  offers: string[];
  manufacturer_name: string;
  delivery_address: {
    city: string;
    state: string;
    street: string;
    country: string;
    postal_code: string;
  };
  price: {
    unit_cost: number;
    projected_cost: number;
    shipping_cost: number;
    projected_units: number;
  };
  shipping_info: {
    carrier: string | null;
    tracking_number: string | null;
  };
  livestream_url: string;
}

export interface AddressesSchema extends Address {
  id: string; // uuid
  created_at: string; // timestamp with time zone (ISO string)
  updated_at: string; // timestamp with time zone (ISO string)
}

export interface MessageAttachmentsSchema {
  attachment_id: string; // uuid,
  message_id: string; // uuid,
  bucket_id: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
  time_uploaded: string; // timestamp with time zone (ISO string)
}

export interface AssembliesSchema {
  id: string; // uuid
  order_id: string; // uuid
  assembly_name: string;
  build_order: number | null;
  specifications_completed: boolean;
  created_at: string;
}

export interface AssemblyPartsSchema {
  assembly_id: string; // uuid
  part_id: string; // uuid or storage path reference
}

export interface PartSpecificationsSchema {
  id: string; // uuid
  order_id: string; // uuid
  assembly_id: string; // uuid
  part_id: string; // uuid
  quantity: number;
  specifications: Record<string, unknown>;
  created_at: string;
}

export interface ShippingAddressesSchema extends Address {
  id: string; // uuid
  order_id: string; // uuid
  recipient_name: string;
  company_name: string | null;
  phone_number: string;
  created_at: string;
}

export interface SplitPartsSchema {
  id: string; // uuid
  order_id: string; // uuid
  name: string;
  storage_path: string;
  hierarchy: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
}
