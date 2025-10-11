'use server';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { logger } from '@/lib/logger';

/**
 * Fetches the most recent events for the logged in user from the Supabase database.
 * @param limit The maximum number of events to fetch (default is 10).
 * @returns The most recent events for the logged in user
 * @throws Error if there is an error fetching the events
 */
export async function getRecentEvents(limit: number = 10) {
  const supabase = await createSupabaseServerClient();
  const { data: UserData, error: UserError } = await supabase.auth.getUser();

  if (UserError) {
    logger.error(UserError, 'events:getRecentEvents:getUser');
    return null;
  }

  if (!UserData) {
    throw new Error('User data not found');
  }

  const { data, error } = await supabase
    .from('Events')
    .select('*')
    .eq('user_id', UserData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error(error, 'events:getRecentEvents:query');
    throw new Error('Error fetching events');
  }

  logger.info(`Fetched Events For User: ${UserData.user.id}`);

  return data;
}

/**
 * Creates a new event in the Supabase database.
 * @param eventType The type of event to create (e.g., "order", "user", "system", "error", "success", "shipment").
 * @param eventData The data associated with the event.
 * @param userId The ID of the user associated with the event.
 * @param orderId Optional order ID associated with the event.
 * @param metadata Optional metadata associated with the event.
 * @returns The created event data
 * @throws Error if there is an error creating the event
 */
export async function createEvent(
  eventType:
    | 'order'
    | 'user'
    | 'system'
    | 'error'
    | 'success'
    | 'shipment'
    | 'offer',
  description: string,
  userId: string,
  orderId?: number,
  metadata?: object
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('Events')
    .insert([
      {
        event_type: eventType,
        description: description,
        user_id: userId,
        order_id: orderId,
        metadata: metadata,
      },
    ])
    .select()
    .single();

  if (error) {
    logger.error(error, 'events:createEvent:insert');
    throw new Error('Error creating event');
  }

  logger.info(`Created Event For User: ${userId}`);

  return data;
}
