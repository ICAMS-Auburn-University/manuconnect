'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseLogin, supabaseSignup } from '@/lib/supabase/auth';
import { logger } from '@/lib/logger';
import { createUserPfp } from '@/services/integrations/supabaseAdmin';
import { LoginData, SignupData } from './types';

export async function login({ email, password }: LoginData) {
  logger.info('Auth service: login', { email });
  const { error } = await supabaseLogin(email, password);
  if (error) {
    logger.error('Auth service: login failed', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(data: SignupData) {
  logger.info('Auth service: signup', { email: data.email });
  const { data: signupResult, error } = await supabaseSignup(
    data.email,
    data.password,
    {
      firstName: data.firstName,
      lastName: data.lastName,
      accountType: data.accountType,
      companyName: data.companyName,
    }
  );

  if (error) {
    logger.error('Auth service: signup failed', error.message);
    redirect('/error');
  }

  if (signupResult && signupResult.user) {
    await createUserPfp(signupResult.user.id);
  }
}
