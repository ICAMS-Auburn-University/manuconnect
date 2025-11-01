'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { EventType } from '@/types/enums';

import {
  fetchEventsByUser,
  insertEvent,
  getCurrentUser,
} from '@/lib/supabase/events';
import { EventInput } from '@/domain/events/types';
import { EventsSchema } from '@/types/schemas';
import { randomUUID } from 'crypto';

export async function getRecentEvents(
  limit: number = 10
): Promise<EventsSchema[] | null> {
  try {
    const { user, error: authError } = await getCurrentUser();

    if (authError) {
      logger.error(
        'events: getRecentEvents: getUser failed',
        authError.message
      );
      return null;
    }

    if (!user) {
      logger.info('events: getRecentEvents: no user found in session');
      return null;
    }

    const rows = await fetchEventsByUser(user.id, limit);

    logger.info('Fetched events for user', {
      userId: user.id,
      count: rows.length,
    });
    return rows.map((r) => mapSchemaToDomain(r));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('events: getRecentEvents failed', message);
    throw new Error('Error fetching recent events');
  }
}

export async function createEvent(input: EventInput): Promise<EventsSchema> {
  try {
    if (!input.userId) {
      throw new Error('UserId required');
    }
    if (!input.eventType) {
      throw new Error('EventType required');
    }

    const eventData: EventsSchema = {
      id: randomUUID(), // event ID
      event_type: input.eventType,
      description: input.description,
      user_id: input.userId,
      order_id: input.orderId,
      created_at: new Date().toISOString(),
    };

    console.log('Event data before insert:', JSON.stringify(eventData));
    const inserted = await insertEvent(eventData);
    logger.info('Created event', {
      userId: input.userId,
      eventId: inserted.id,
    });

    revalidatePath('/', 'layout');
    return mapSchemaToDomain(inserted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('events: createEvent failed', message);
    throw new Error('Error creating event');
  }
}

function mapSchemaToDomain(e: EventsSchema): EventsSchema {
  return {
    id: e.id,
    event_type: e.event_type as EventType,
    description: e.description,
    user_id: e.user_id,
    order_id: e.order_id,
    created_at: e.created_at,
  };
}
