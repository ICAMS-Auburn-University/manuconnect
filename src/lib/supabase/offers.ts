import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import type { OffersSchema } from '@/types/schemas';

export async function fetchOffersByOrder(
  orderId: string | number
): Promise<OffersSchema[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Offers')
    .select()
    .eq('order_id', orderId)
    .eq('is_declined', false)
    .not('is_accepted', 'eq', true);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function insertOffer(
  offer: Omit<OffersSchema, 'id'>
): Promise<OffersSchema[]> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('Offers')
    .insert([
      {
        offerer: userData.user.id,
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

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to insert offer: No data returned');
  }

  return data;
}

export async function fetchOrderOffers(
  orderId: string | number
): Promise<{ offers: string[] }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .select('offers')
    .eq('id', orderId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Order not found');
  }

  return { offers: data.offers || [] };
}

export async function updateOrderOffers(
  orderId: string | number,
  offers: number[]
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('Orders')
    .update({
      offers: offers,
      last_update: new Date(),
    })
    .eq('id', orderId);

  if (error) {
    throw error;
  }
}

export async function acceptOfferById(
  offerId: string
): Promise<OffersSchema[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Offers')
    .update({ is_accepted: true })
    .eq('id', offerId)
    .select();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to update offer');
  }

  return data;
}

export async function declineOfferById(
  offerId: string
): Promise<OffersSchema[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Offers')
    .update({ is_declined: true })
    .eq('id', offerId)
    .select();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to update offer');
  }

  return data;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}
