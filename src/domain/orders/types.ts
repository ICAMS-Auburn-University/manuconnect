import { Offer } from '@/domain/offers/types';
import { OrderStatus } from '@/types/enums';

export type Order = {
  id: number;
  title: string;
  description: string;
  creator: string;
  creator_name: string;
  creator_email: string;
  status: OrderStatus;
  created_at: Date;
  last_update: Date;
  manufacturer: string;
  manufacturer_name: string;
  fileURLs: string;
  due_date: Date;
  quantity: number;
  tags: string[];
  isArchived: boolean;
  offers: Offer[];
  selected_offer: number;
  delivery_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  shipping_info: {
    tracking_number: string;
    carrier: string;
  };
  livestream_url: string;
  price: {
    unit_cost: number;
    projected_cost: number;
    projected_units: number;
    shipping_cost: number;
  };
};
