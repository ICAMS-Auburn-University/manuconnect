'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  supabaseLogin,
  supabaseSignup,
  updateUserMetadata,
  supabaseGetUser,
} from '@/lib/supabase/auth';
import { logger } from '@/lib/logger';
import { createUserPfp } from '@/services/integrations/supabaseAdmin';
import {
  LoginData,
  SignUpData,
  CreatorOnboardingData,
  ManufacturerOnboardingData,
} from './types';
import { Address } from '@/types/shared';

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

export async function completeCreatorOnboarding(data: CreatorOnboardingData) {
  logger.info('Auth service: completing creator onboarding');

  try {
    const { error } = await updateUserMetadata({
      agreementAccepted: data.agreementAccepted,
      onboardingCompleted: true,
    });

    if (error) {
      logger.error('Auth service: creator onboarding failed', error.message);
      throw new Error(error.message);
    }

    logger.info('Auth service: creator onboarding completed successfully');
    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error: any) {
    logger.error('Auth service: creator onboarding exception', error.message);
    throw error;
  }
}

export async function completeManufacturerOnboarding(
  data: ManufacturerOnboardingData
) {
  logger.info('Auth service: completing manufacturer onboarding');

  try {
    const companyAddress: Address = {
      street1: data.companyAddress.street1,
      street2: data.companyAddress.street2,
      city: data.companyAddress.city,
      state: data.companyAddress.state,
      postal_code: data.companyAddress.postal_code,
      country: data.companyAddress.country,
    };

    const { error } = await updateUserMetadata({
      companyName: data.companyName,
      companyType: data.companyType,
      stateOfFormation: data.stateOfFormation,
      companyAddress: companyAddress,
      representativeRole: data.representativeRole,
      agreementAccepted: data.agreementAccepted,
      onboardingCompleted: true,
    });

    if (error) {
      logger.error(
        'Auth service: manufacturer onboarding failed',
        error.message
      );
      throw new Error(error.message);
    }

    logger.info('Auth service: manufacturer onboarding completed successfully');
    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error: any) {
    logger.error(
      'Auth service: manufacturer onboarding exception',
      error.message
    );
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { user, error } = await supabaseGetUser();

    if (error) {
      logger.error('Auth service: failed to get user', error.message);
      throw error;
    }

    return { user };
  } catch (error: any) {
    logger.error('Auth service: get user exception', error.message);
    throw error;
  }
}
