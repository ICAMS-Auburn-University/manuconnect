export interface UsersSchema {
  id: string; // uuid
  display_name: string;
}

export interface ChatsSchema {
  chat_id: string; // uuid
  member_ids: string[]; // uuid[]
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
  manufacturer: string;
  fileURLs: string;
  description: string;
  quantity: number;
  due_date: string;
  tags: string[];
  creator_name: string;
  isArchived: boolean;
  selected_offer: string;
  offers: string[];
  manufacturer_name: string;
  delivery_address: {
    city: string;
    state: string;
    street: string;
    country: string;
    postal_code: string;
  };
  price: Record<string, unknown>;
  shipping_info: {
    carrier: string | null;
    tracking_number: string | null;
  };
  livestream_url: string;
}
