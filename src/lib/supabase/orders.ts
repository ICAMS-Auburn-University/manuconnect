import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { Order } from '@/domain/orders/types';
import { OrderStatus } from '@/types/enums';
import { getUserById } from '@/services/integrations/supabaseAdmin';

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

export async function getLatestOrderNumber() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}

export async function insertOrder(orderData: Partial<Order>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .insert(orderData)
    .select();

  return { data, error };
}

export async function updateOrderById(id: number, updateData: Partial<Order>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .update(updateData)
    .eq('id', id)
    .select();

  return { data, error };
}

export async function fetchOrdersByCreator(creatorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .select('*')
    .eq('creator', creatorId)
    .order('id', { ascending: true });

  return { data, error };
}

export async function fetchOrdersByManufacturer(manufacturerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .select('*')
    .eq('manufacturer', manufacturerId)
    .order('id', { ascending: true });

  return { data, error };
}

export async function fetchUnclaimedOrders() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .select('*')
    .is('manufacturer', null)
    .eq('isArchived', false);

  return { data, error };
}

export async function fetchOrderById(orderId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('Orders')
    .select('*')
    .eq('id', orderId)
    .or(`creator.eq.${userId},manufacturer.eq.${userId}`)
    .single();

  return { data, error };
}
