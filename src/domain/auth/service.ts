'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { logger } from '@/lib/logger';
import { createUserPfp } from '@/services/integrations/supabaseAdmin';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: 'creator' | 'manufacturer' | 'admin';
  companyName: string;
}

export async function login({ email, password }: LoginData) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(data: SignupData) {
  logger.info('Attempting user signup');
  const supabase = await createSupabaseServerClient();
  logger.info(`Signing up user: ${data.email}`);
  const { data: UserData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`,
        // account_type: data.accountType,
        account_type: 'admin',
        company_name: data.companyName,
        profile_picture: ``,
      },
    },
  });
  logger.info('Signup response received', { error: error?.message });

  if (UserData?.user) {
    await createUserPfp(UserData.user.id);
  }

  if (error) {
    redirect('/error');
  }
}
