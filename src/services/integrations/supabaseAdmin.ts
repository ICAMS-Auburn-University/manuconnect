'use server';

import { createClient } from '@supabase/supabase-js';
import { createAvatar } from '@dicebear/core';
import * as style from '@dicebear/identicon';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';

const createAdminClient = () =>
  createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

export async function getUserById(userID: string) {
  const supabase = createAdminClient();

  // Access auth admin api
  const adminAuthClient = supabase.auth.admin;

  const { data, error } = await adminAuthClient.getUserById(userID);

  if (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }

  return data;
}

export async function createUserPfp(userID: string) {
  const supabase = createAdminClient();

  // Access auth admin api

  const UserData = await getUserById(userID);

  if (UserData && UserData.user?.user_metadata.profile_picture == '') {
    // Create Random Avatar
    const avatar = createAvatar(style, {
      seed: UserData.user?.id,
      backgroundColor: ['#000000'],
    });

    // Upload the avatar
    const { data: AvatarData, error: AvatarError } = await supabase.storage
      .from('profile-pics')
      .upload(`${UserData?.user?.id}/pfp.svg`, avatar.toString(), {
        contentType: 'image/svg+xml',
      });

    // Update the user's profile picture
    if (AvatarError) {
      console.error(AvatarError);
    } else {
      const { error: UpdateError } = await supabase.auth.admin.updateUserById(
        UserData.user.id,
        {
          user_metadata: {
            profile_picture: AvatarData.fullPath,
          },
        }
      );
      if (UpdateError) {
        console.error(UpdateError);
      } else {
        logger.info('Updated user profile image', {
          userId: UserData.user.id,
        });
      }
    }
  }
}
