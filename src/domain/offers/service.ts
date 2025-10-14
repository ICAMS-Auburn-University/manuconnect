'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';
import { Offer } from '@/domain/offers/types';
import { OrderStatus } from '@/types/enums';
import { createEvent } from '@/domain/events/service';
import { updateOrder } from '@/domain/orders/service';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import { NewOffer } from '@/components/emails/new-offer';
import { EventType } from '@/types/enums';
import { OfferAcceptanceEmail } from '@/components/emails/offer-acceptance';
import {
  fetchOffersByOrder,
  insertOffer,
  fetchOrderOffers,
  acceptOfferById,
  declineOfferById,
  getCurrentUser,
} from '@/lib/supabase/offers';

const createResendClient = () => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(env.RESEND_API_KEY);
};

export async function createOffer(offer: Offer) {
  try {
    const { user, error } = await getCurrentUser();
    if (error || !user) {
      return null;
    }
    const offerData = await insertOffer(offer);

    const orderData = (await fetchOrderOffers(offer.order_id)) as {
      offers: number[];
      creator: string;
    };
    if (!orderData) {
      throw new Error('Error fetching order: Order data is null or undefined');
    }

    const offers = orderData.offers || [];

    // Update Order in Orders table
    const offerId = offerData[0].id;
    await updateOrder({
      id: offer.order_id,
      offers: [
        ...offers.map((o: any) => (typeof o === 'number' ? { id: o } : o)),
        { ...offer, id: Number(offerId) },
      ],
      last_update: new Date(),
      status: OrderStatus.ManufacturerOffer,
    });

    // Send email to creator
    const resend = createResendClient();
    const creatorData = await getUserById(orderData.creator);
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
          id: Number(offerData[0].id),
          order_id: Number(offerData[0].order_id),
          created_at: new Date(offerData[0].created_at),
          unit_cost: parseFloat(offerData[0].unit_cost),
          projected_cost: parseFloat(offerData[0].projected_cost),
          lead_time: parseInt(offerData[0].lead_time, 10),
          projected_units: parseInt(offerData[0].projected_units, 10),
          shipping_cost: parseFloat(offerData[0].shipping_cost),
        },
        email: creatorData.user.email || 'default@example.com',
      }),
    });

    // Add events
    await createEvent({
      eventType: 'offer' as EventType,
      description: `New offer received for order #${offer.order_id.toLocaleString(
        'en-US',
        {
          minimumIntegerDigits: 6,
          useGrouping: false,
        }
      )}`,
      userId: orderData.creator,
      orderId: String(offer.order_id),
    });

    await createEvent({
      eventType: 'success' as EventType,
      description: `New offer created for order #${offer.order_id.toLocaleString(
        'en-US',
        {
          minimumIntegerDigits: 6,
          useGrouping: false,
        }
      )}`,
      userId: user.id,
      orderId: String(offer.order_id),
    });

    logger.info(`Offer #${offerId} created by manufacturer ${user.id}`);
    return offerData;
  } catch (error: any) {
    logger.error('Error creating offer', error.message);
    throw error;
  }
}

export async function getOffers(orderId: number) {
  try {
    return await fetchOffersByOrder(orderId);
  } catch (error: any) {
    logger.error('Error getting offers', error.message);
    throw new Error('Error getting offers: ' + error.message);
  }
}

export async function acceptOffer(offerId: number) {
  try {
    const { user } = await getCurrentUser();
    const offerData = await acceptOfferById(offerId);

    const manufacturerData = await getUserById(offerData[0].offerer);
    const result = await updateOrder({
      id: Number(offerData[0].order_id),
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
          id: Number(offerData[0].id),
          order_id: Number(offerData[0].order_id),
          created_at: new Date(offerData[0].created_at),
          unit_cost: parseFloat(offerData[0].unit_cost),
          projected_cost: parseFloat(offerData[0].projected_cost),
          projected_units: parseInt(offerData[0].projected_units, 10),
          shipping_cost: parseFloat(offerData[0].shipping_cost),
          lead_time: parseInt(offerData[0].lead_time, 10), // Convert lead_time to number
        },
        email: manufacturerData.user.email || 'default@example.com',
      }),
    });

    logger.info(
      `Offer #${offerId.toLocaleString('en-US', {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })} accepted by creator ${user?.user_metadata?.display_name || null}`
    );

    redirect('/orders');
  } catch (error: any) {
    logger.error('Error accepting offer', error.message);
    throw error;
  }
}

export async function declineOffer(offerId: number) {
  try {
    const { user } = await getCurrentUser();
    const offerData = await declineOfferById(offerId);

    // Get Offers Array from Order in Orders table
    const orderData = await fetchOrderOffers(offerData[0].order_id);
    let offers = orderData.offers || [];

    // Remove offer from offers array
    offers = offers.filter((offer: number) => offer !== offerId);

    // Update Order in Orders table
    await updateOrder({
      id: Number(offerData[0].order_id),
      offers: offers.map((offerId: number) => ({ id: offerId }) as Offer),
      last_update: new Date(),
      status: OrderStatus.ManufacturerOffer,
    });

    logger.info(
      `Offer #${offerId.toLocaleString('en-US', {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })} declined by creator ${user?.user_metadata?.display_name || null}`
    );

    redirect('/orders');
  } catch (error: any) {
    logger.error('Error declining offer', error.message);
    throw error;
  }
}
