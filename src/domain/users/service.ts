'use server';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';

export async function getInitials() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  const initials =
    data.user?.user_metadata.first_name.charAt(0) +
    data.user?.user_metadata.last_name.charAt(0);

  return initials;
}

export async function getUserData() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

export async function getAccountType() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  const accountType = data.user?.user_metadata.account_type;

  return accountType;
}

export async function getUserId() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user?.id) {
    throw new Error('User ID not found');
  }
  return data.user;
}
