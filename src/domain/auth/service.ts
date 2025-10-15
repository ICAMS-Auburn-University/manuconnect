'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseLogin, supabaseSignup } from '@/lib/supabase/auth';
import { logger } from '@/lib/logger';
import { createUserPfp } from '@/services/integrations/supabaseAdmin';
import { LoginData, SignUpData } from './types';

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

export async function signup(data: SignUpData) {
  logger.info('Auth service: signup', { email: data.email });
  const { data: signupResult, error } = await supabaseSignup(data);

  if (error) {
    logger.error('Auth service: signup failed', error.message);
    throw new Error(error.message);
  }

  if (signupResult && signupResult.user) {
    await createUserPfp(signupResult.user.id);
  }
}
