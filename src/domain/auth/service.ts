'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  supabaseLogin,
  supabaseSignup,
  updateUserMetadataServer,
  supabaseGetUserServer,
} from '@/lib/supabase/auth';
import { logger } from '@/lib/logger';
import { createUserPfp } from '@/services/integrations/supabaseAdmin';
import {
  LoginData,
  SignUpData,
  CreatorOnboardingData,
  ManufacturerOnboardingData,
} from './types';
import { formatDateForPostgres } from '@/lib/utils/transforms';
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
  if (!data.agreementAccepted) {
    throw new Error('You must accept the agreement to continue');
  }

  logger.info('Auth service: completing creator onboarding');
  try {
    const { error } = await updateUserMetadataServer({
      agreement_accepted: data.agreementAccepted,
      onboarding_completed: true,
      time_accepted: formatDateForPostgres(new Date()),
    });

    if (error) {
      logger.error('Auth service: creator onboarding failed', error.message);
      throw new Error(error.message);
    }

    logger.info('Auth service: creator onboarding completed successfully');
    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Auth service: creator onboarding exception', message);
    throw error;
  }
}

export async function completeManufacturerOnboarding(
  data: ManufacturerOnboardingData
) {
  if (!data.agreementAccepted) {
    throw new Error('You must accept the agreement to continue');
  }

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

    const { error } = await updateUserMetadataServer({
      company_name: data.companyName,
      company_type: data.companyType,
      state_of_formation: data.stateOfFormation,
      company_address: companyAddress,
      representative_role: data.representativeRole,
      agreement_accepted: data.agreementAccepted,
      onboarding_completed: true,
      time_accepted: formatDateForPostgres(new Date()),
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Auth service: manufacturer onboarding exception', message);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { user, error } = await supabaseGetUserServer();

    if (error) {
      logger.error('Auth service: failed to get user', error.message);
      throw error;
    }

    return { user };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Auth service: get user exception', message);
    throw error;
  }
}
