'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';
import { OffersSchema } from '@/types/schemas';
import { OrderStatus } from '@/types/enums';
import { createEvent } from '@/domain/events/service';
import { updateOrder } from '@/domain/orders/service';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import { NewOffer } from '@/components/emails/new-offer';
import { EventType } from '@/types/enums';
import { randomUUID } from 'crypto';
import { OfferAcceptanceEmail } from '@/components/emails/offer-acceptance';
import { abbreviateUUID } from '@/lib/utils/transforms';
import { CreateOfferInput } from '@/domain/offers/types';
import {
  fetchOffersByOrder,
  insertOffer,
  fetchOrderOffers,
  acceptOfferById,
  declineOfferById,
  getCurrentUser,
} from '@/lib/supabase/offers';
import { fetchOrderById } from '@/lib/supabase/orders';

const createResendClient = () => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(env.RESEND_API_KEY);
};

export async function createOffer(input: CreateOfferInput) {
  try {
    const { user, error } = await getCurrentUser();
    if (error || !user) {
      return null;
    }

    const id = randomUUID();
    const fullOffer: OffersSchema = {
      id: id,
      created_at: new Date().toISOString(),
      is_accepted: false,
      is_declined: false,
      offerer: user.id,
      order_id: input.order_id,
      unit_cost: String(input.unit_cost),
      projected_cost: String(input.projected_cost),
      projected_units: String(input.projected_units),
      shipping_cost: String(input.shipping_cost),
      lead_time: String(input.lead_time),
      manufacturer_email: user.email || '',
      manufacturer_name: user.user_metadata?.company_name || '',
      last_update: new Date().toISOString(),
    };

    const offerData = await insertOffer(fullOffer);
    if (!offerData || offerData.length === 0) {
      throw new Error('Failed to create offer: No data returned');
    }

    // Get the order's current offers array
    const orderData = await fetchOrderOffers(input.order_id);
    if (!orderData) {
      throw new Error('Error fetching order: Order data is null or undefined');
    }

    // Get creator data to send notifications
    const { data: orderDetails } = await fetchOrderById(input.order_id);
    if (!orderDetails) {
      throw new Error('Error fetching order details');
    }

    // Add the new offer ID to the order's offers array
    const offers = (orderData.offers || []) as string[];

    // Update the order with the new offer
    await updateOrder({
      id: input.order_id,
      offers: [...offers, id],
      last_update: new Date().toISOString(),
      status: OrderStatus.ManufacturerOffer,
    });

    // Send email to creator
    const resend = createResendClient();
    const creatorData = await getUserById(orderDetails.creator);
    if (!creatorData) {
      throw new Error('Failed to get creator data');
    }

    await resend.emails.send({
      from: 'ManuConnect <alerts@noreply.manuconnect.org>',
      to: [creatorData.user.email || 'default@example.com'],
      subject: 'New Offer Received',
      react: await NewOffer({
        offer: {
          ...offerData[0],
          created_at: new Date(offerData[0].created_at),
          unit_cost: parseFloat(offerData[0].unit_cost),
          projected_cost: parseFloat(offerData[0].projected_cost),
          projected_units: parseInt(offerData[0].projected_units, 10),
          shipping_cost: parseFloat(offerData[0].shipping_cost),
          lead_time: parseInt(offerData[0].lead_time, 10),
        },
        email: creatorData.user.email || 'default@example.com',
      }),
    });

    // Add events
    await createEvent({
      eventType: EventType.SUCCESS,
      description: `New offer received for order #${abbreviateUUID(input.order_id)}`,
      userId: orderDetails.creator,
      orderId: input.order_id,
    });

    await createEvent({
      eventType: EventType.SUCCESS,
      description: `New offer created for order #${abbreviateUUID(input.order_id)}`,
      userId: user.id,
      orderId: input.order_id,
    });

    logger.info(
      `Offer #${abbreviateUUID(id)} created by manufacturer ${user.id}`
    );
    return offerData;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error creating offer', message);
    throw error;
  }
}

export async function getOffers(orderId: string): Promise<OffersSchema[]> {
  try {
    return await fetchOffersByOrder(orderId);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error getting offers', message);
    throw new Error('Error getting offers: ' + message);
  }
}

export async function acceptOffer(offerId: string) {
  try {
    const { user } = await getCurrentUser();
    const offerData = await acceptOfferById(offerId);

    const manufacturerData = await getUserById(offerData[0].offerer);
    const result = await updateOrder({
      id: offerData[0].order_id,
      status: OrderStatus.OrderAccepted,
      selected_offer: offerId,
      manufacturer: offerData[0].offerer,
      manufacturer_name: manufacturerData.user.user_metadata.company_name,
      price: {
        unit_cost: parseFloat(offerData[0].unit_cost),
        projected_cost: parseFloat(offerData[0].projected_cost),
        projected_units: parseInt(offerData[0].projected_units, 10),
        shipping_cost: parseFloat(offerData[0].shipping_cost),
      },
    });

    if (!result?.data) {
      throw new Error('Failed to update order');
    }

    // Send email to manufacturer
    const resend = createResendClient();
    await resend.emails.send({
      from: 'ManuConnect <alerts@noreply.manuconnect.org>',
      to: [manufacturerData.user.email || 'default@example.com'],
      subject: 'Offer Accepted',
      react: await OfferAcceptanceEmail({
        offer: {
          ...offerData[0],
          // Keep IDs as strings
          created_at: new Date(offerData[0].created_at),
          unit_cost: parseFloat(offerData[0].unit_cost),
          projected_cost: parseFloat(offerData[0].projected_cost),
          projected_units: parseInt(offerData[0].projected_units, 10),
          shipping_cost: parseFloat(offerData[0].shipping_cost),
          lead_time: parseInt(offerData[0].lead_time, 10),
        },
        email: manufacturerData.user.email || 'default@example.com',
      }),
    });

    logger.info(
      `Offer #${abbreviateUUID(offerId)} accepted by creator ${user?.user_metadata?.display_name || null}`
    );

    redirect('/orders');
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error accepting offer', message);
    throw error;
  }
}

export async function declineOffer(offerId: string) {
  try {
    const { user } = await getCurrentUser();
    const offerData = await declineOfferById(offerId);

    // Get Offers Array from Order in Orders table
    const orderData = await fetchOrderOffers(offerData[0].order_id);
    let offers = orderData.offers || [];

    // Remove offer from offers array (all are strings now)
    offers = offers.filter((offer: string) => offer !== offerId);

    // Update Order in Orders table
    await updateOrder({
      id: offerData[0].order_id,
      offers: offers, // Just pass the string array directly
      last_update: new Date().toISOString(),
      status: OrderStatus.ManufacturerOffer,
    });

    logger.info(
      `Offer #${abbreviateUUID(offerId)} declined by creator ${user?.user_metadata?.display_name || null}`
    );

    redirect('/orders');
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error declining offer', message);
    throw error;
  }
}
