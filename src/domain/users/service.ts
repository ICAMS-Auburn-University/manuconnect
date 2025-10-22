'use server';

import { logger } from '@/lib/logger';
import { getCurrentUser, getUserMetadata } from '@/lib/supabase/users';
import type { UserProfile } from './types';

export async function getInitials(): Promise<string | null> {
  try {
    const { metadata, error } = await getUserMetadata();

    if (error || !metadata) {
      return null;
    }

    const firstName = metadata.first_name || '';
    const lastName = metadata.last_name || '';

    const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');

    return initials || null;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Failed to get user initials', message);
    return null;
  }
}

export async function getUserData(): Promise<UserProfile | null> {
  try {
    const { user, error } = await getCurrentUser();

    if (error || !user) {
      return null;
    }

    const metadata = user.user_metadata;

    return {
      id: user.id,
      firstName: metadata?.first_name || '',
      lastName: metadata?.last_name || '',
      displayName:
        metadata?.display_name ||
        `${metadata?.first_name || ''} ${metadata?.last_name || ''}`,
      email: user.email || '',
      accountType: metadata?.account_type || '',
      companyName: metadata?.company_name || '',
      profilePicture: metadata?.profile_picture || undefined,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Failed to get user data', message);
    return null;
  }
}

export async function getAccountType(): Promise<string | null> {
  try {
    const { metadata, error } = await getUserMetadata();

    if (error || !metadata) {
      return null;
    }

    return metadata.account_type || null;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Failed to get account type', message);
    return null;
  }
}

export async function getUserId() {
  try {
    const { user, error } = await getCurrentUser();

    if (error || !user?.id) {
      throw new Error('User ID not found');
    }

    return user;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Failed to get user ID', message);
    throw new Error('User ID not found');
  }
}
