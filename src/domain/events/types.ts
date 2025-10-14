import { EventType } from '@/types/enums';

export interface EventInput {
  eventType: EventType;
  description: string;
  userId: string;
  orderId: string;
}

export interface Event {
  id: string;
  event_type: EventType;
  description: string;
  user_id: string;
  order_id: string;
  created_at: string;
}
