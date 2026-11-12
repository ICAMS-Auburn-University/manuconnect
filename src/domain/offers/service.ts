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
import { CreateOfferInput, MyOfferEntry, MyOfferStatus } from '@/domain/offers/types';
import {
  fetchOffersByOrder,
  insertOffer,
  fetchOrderOffers,
  acceptOfferById,
  declineOfferById,
  fetchOffersByOfferer,
  fetchOfferById,
  deleteOfferById,
  getCurrentUser,
} from '@/lib/supabase/offers';
import {
  fetchOrderById,
  fetchOrdersByIds,
  updateOrderById,
} from '@/lib/supabase/orders';

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
      part_ids: input.part_ids ?? [],
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

    // Send email to creator (non-blocking)
    try {
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
          },
          email: creatorData.user.email || 'default@example.com',
        }),
      });
    } catch (emailError) {
      logger.error(emailError, 'offers:createOffer:email');
    }

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

export async function getMyOffers(): Promise<MyOfferEntry[]> {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return [];
    }

    const offers = await fetchOffersByOfferer(user.id);
    const orderIds = Array.from(new Set(offers.map((offer) => offer.order_id)));
    const { data: orders, error } = await fetchOrdersByIds(orderIds);

    if (error) {
      logger.error(error, 'offers:getMyOffers:orders');
    }

    const orderById = new Map(orders.map((order) => [order.id, order]));

    return offers.map((offer) => {
      const order = orderById.get(offer.order_id) ?? null;

      let status: MyOfferStatus = 'pending';
      if (offer.is_accepted) {
        status = 'accepted';
      } else if (offer.is_declined) {
        status = 'declined';
      } else if (!order || order.isArchived) {
        status = 'order_closed';
      } else if (order.manufacturer && order.manufacturer !== user.id) {
        status = 'not_selected';
      }

      return {
        offer,
        status,
        order: order
          ? {
              id: order.id,
              title: order.title,
              status: order.status,
              due_date: order.due_date,
              quantity: order.quantity,
              creator_name: order.creator_name,
              manufacturer: order.manufacturer,
              isArchived: order.isArchived,
            }
          : null,
      };
    });
  } catch (error: unknown) {
    logger.error(error, 'offers:getMyOffers');
    return [];
  }
}

/**
 * Deletes a pending offer owned by the current manufacturer and keeps the
 * order's offer list/status consistent. Bypasses updateOrder so the creator
 * does not receive a misleading "order update" email.
 */
export async function withdrawOffer(
  offerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const offer = await fetchOfferById(offerId);
    if (!offer || offer.offerer !== user.id) {
      return { success: false, error: 'Offer not found' };
    }
    if (offer.is_accepted) {
      return {
        success: false,
        error: 'Accepted offers cannot be withdrawn. Contact the creator.',
      };
    }

    await deleteOfferById(offerId);

    const [{ offers: listedOffers }, pendingOffers, { data: order }] =
      await Promise.all([
        fetchOrderOffers(offer.order_id),
        fetchOffersByOrder(offer.order_id),
        fetchOrderById(offer.order_id),
      ]);

    const patch: Parameters<typeof updateOrderById>[1] = {
      offers: listedOffers.filter((id) => id !== offerId),
      last_update: new Date().toISOString(),
    };

    if (
      order &&
      !order.manufacturer &&
      pendingOffers.length === 0 &&
      order.status === OrderStatus.ManufacturerOffer
    ) {
      patch.status = OrderStatus.OrderCreated;
    }

    const { error: updateError } = await updateOrderById(offer.order_id, patch);
    if (updateError) {
      logger.error(updateError, 'offers:withdrawOffer:updateOrder');
    }

    await createEvent({
      eventType: EventType.OFFER,
      description: `Offer withdrawn for order #${abbreviateUUID(offer.order_id)}`,
      userId: user.id,
      orderId: offer.order_id,
    });

    logger.info(`Offer #${abbreviateUUID(offerId)} withdrawn by ${user.id}`);
    return { success: true, error: null };
  } catch (error: unknown) {
    logger.error(error, 'offers:withdrawOffer');
    return { success: false, error: 'Failed to withdraw offer' };
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

    // Send email to manufacturer (non-blocking)
    try {
      const resend = createResendClient();
      await resend.emails.send({
        from: 'ManuConnect <alerts@noreply.manuconnect.org>',
        to: [manufacturerData.user.email || 'default@example.com'],
        subject: 'Offer Accepted',
        react: await OfferAcceptanceEmail({
          offer: {
            ...offerData[0],
          },
          email: manufacturerData.user.email || 'default@example.com',
        }),
      });
    } catch (emailError) {
      logger.error(emailError, 'offers:acceptOffer:email');
    }

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
