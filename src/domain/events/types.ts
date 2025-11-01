import { EventType } from '@/types/enums';

export interface EventInput {
  eventType: EventType;
  description: string;
  userId: string;
  orderId: string;
}
