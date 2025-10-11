'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';
import { Offer, OrderStatus } from '@/lib/types/definitions';
import { createEvent } from '@/domain/events/service';
import { updateOrder } from '@/domain/orders/service';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import { NewOffer } from '@/components/emails/new-offer';
import { OfferAcceptanceEmail } from '@/components/emails/offer-acceptance';

const createResendClient = () => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(env.RESEND_API_KEY);
};

export async function createOffer(offer: Offer) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  // Create Offer in Offers table
  const { data: offerData, error: offerError } = await supabase
    .from('Offers')
    .insert([
      {
        offerer: data.user.id,
        order_id: offer.order_id,
        created_at: new Date(),
        last_update: new Date(),
        unit_cost: offer.unit_cost,
        projected_cost: offer.projected_cost,
        projected_units: offer.projected_units,
        shipping_cost: offer.shipping_cost,
        lead_time: offer.lead_time,
        is_declined: false,
        is_accepted: false,
        manufacturer_name: offer.manufacturer_name,
        manufacturer_email: offer.manufacturer_email,
      },
    ])
    .select();

  if (offerError) {
    throw new Error('Error creating offer: ' + offerError.message);
  }
  if (!offerData) {
    throw new Error('Failed to create offer');
  }

  // Get Offers Array from Order in Orders table
  const { data: orderData, error: orderError } = await supabase
    .from('Orders')
    .select('offers, creator')
    .eq('id', offer.order_id)
    .single();

  if (orderError) {
    throw new Error('Error fetching order: ' + orderError.message);
  }

  if (!orderData) {
    throw new Error('Order not found when creating offer');
  }

  const offers = orderData?.offers || [];

  // Update Order in Orders table
  const offerId = offerData[0].id;
  const { error: updatedOrderError } = await supabase
    .from('Orders')
    .update({
      offers: [...offers, offerId],
      last_update: new Date(),
      status: OrderStatus.ManufacturerOffer,
    })
    .eq('id', offer.order_id);

  if (updatedOrderError) {
    throw new Error('Error updating order: ' + updatedOrderError.message);
  }

  // Send email to creator

  const resend = createResendClient();
  const creatorData = await getUserById(orderData?.creator);
  if (!creatorData) {
    throw new Error('Failed to get creator data');
  }

  await resend.emails.send({
    from: 'ManuConnect <alerts@noreply.manuconnect.org>',
    to: [creatorData.user.email || 'default@example.com'],
    subject: 'New Offer Received',
    react: await NewOffer({
      offer: offerData[0],
      email: creatorData.user.email || 'default@example.com',
    }),
  });

  // Add event to Events table
  await createEvent(
    // Creates event for order owner
    'offer',
    `New offer received for order #${offer.order_id.toLocaleString('en-US', {
      minimumIntegerDigits: 6,
      useGrouping: false,
    })}`,
    orderData?.creator,
    offer.order_id
  );

  await createEvent(
    // Creates event for offerer
    'success',
    `New offer created for order #${offer.order_id.toLocaleString('en-US', {
      minimumIntegerDigits: 6,
      useGrouping: false,
    })}`,
    data.user.id,
    offer.order_id
  );

  logger.info(`Offer #${offerId} created by manufacturer ${data.user.id}`);
  return offerData;
}

export async function getOffers(orderId: number) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('Offers')
    .select()
    .eq('order_id', orderId)
    .eq('is_declined', false)
    .not('is_accepted', 'eq', true);

  if (error) {
    throw new Error('Error getting offers: ' + error.message);
  }

  return data;
}

export async function acceptOffer(offerId: number) {
  const supabase = await createSupabaseServerClient();

  const User = (await supabase.auth.getUser()).data.user?.user_metadata;

  const { data: offerData, error: offerError } = await supabase
    .from('Offers')
    .update({ is_accepted: true })
    .eq('id', offerId)
    .select();

  if (offerError) {
    throw new Error('Error accepting offer: ' + offerError.message);
  }
  if (!offerData) {
    throw new Error('Failed to accept offer');
  }

  const manufacturerData = await getUserById(offerData[0].offerer);
  const data = await updateOrder({
    id: offerData[0].order_id,
    status: OrderStatus.OrderAccepted,
    selected_offer: offerId,
    manufacturer: offerData[0].offerer,
    manufacturer_name: manufacturerData.user.user_metadata.company_name,
    price: {
      unit_cost: offerData[0].unit_cost,
      projected_cost: offerData[0].projected_cost,
      projected_units: offerData[0].projected_units,
      shipping_cost: offerData[0].shipping_cost,
    },
  });

  if (data?.error) {
    throw new Error('Error updating order: ' + data.error);
  }
  if (!data?.data) {
    throw new Error('Failed to update order');
  }

  // Send email to manufacturer

  const resend = createResendClient();

  await resend.emails.send({
    from: 'ManuConnect <alerts@noreply.manuconnect.org>',
    to: [manufacturerData.user.email || 'default@example.com'],
    subject: 'Offer Accepted',
    react: await OfferAcceptanceEmail({
      offer: offerData[0],
      email: manufacturerData.user.email || 'default@example.com',
    }),
  });

  logger.info(
    `Offer #${offerId.toLocaleString('en-US', {
      minimumIntegerDigits: 6,
      useGrouping: false,
    })} accepted by creator ${User?.display_name || null}`
  );

  redirect('/orders');
}

export async function declineOffer(offerId: number) {
  const supabase = await createSupabaseServerClient();

  const User = (await supabase.auth.getUser()).data.user?.user_metadata;

  const { data: offerData, error: offerError } = await supabase
    .from('Offers')
    .update({ is_declined: true })
    .eq('id', offerId)
    .select();

  if (offerError) {
    throw new Error('Error declining offer: ' + offerError.message);
  }
  if (!offerData) {
    throw new Error('Failed to decline offer');
  }

  // Get Offers Array from Order in Orders table
  const { data: orderData, error: orderError } = await supabase
    .from('Orders')
    .select('offers')
    .eq('id', offerData[0].order_id)
    .single();

  if (orderError) {
    throw new Error('Error fetching order offers: ' + orderError.message);
  }

  if (!orderData) {
    throw new Error('Order not found when declining offer');
  }

  let offers = orderData?.offers || [];

  // Remove offer from offers array
  offers = offers.filter((offer: number) => offer !== offerId);

  // Update Order in Orders table
  const { error: updatedOrderError } = await supabase
    .from('Orders')
    .update({
      offers: [...offers],
      last_update: new Date(),
      status: OrderStatus.ManufacturerOffer,
    })
    .eq('id', offerData[0].order_id);

  if (updatedOrderError) {
    throw new Error('Error updating order: ' + updatedOrderError.message);
  }

  // Send email to manufacturer

  //
  logger.info(
    `Offer #${offerId.toLocaleString('en-US', {
      minimumIntegerDigits: 6,
      useGrouping: false,
    })} declined by creator ${User?.display_name || null}`
  );

  redirect('/orders');
}
