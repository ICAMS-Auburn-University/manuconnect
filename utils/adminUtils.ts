"use server";

import { createClient } from "@supabase/supabase-js";
import { createAvatar } from "@dicebear/core";
import * as style from "@dicebear/identicon";

export async function getUserById(userID: string) {
  const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service_role_key = process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabase_url, service_role_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Access auth admin api
  const adminAuthClient = supabase.auth.admin;

  const { data, error } = await adminAuthClient.getUserById(userID);

  if (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }

  return data;
}

export async function createUserPfp(userID: string) {
  const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service_role_key = process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabase_url, service_role_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Access auth admin api

  const UserData = await getUserById(userID);

  if (UserData && UserData.user?.user_metadata.profile_picture == "") {
    // Create Random Avatar
    const avatar = createAvatar(style, {
      seed: UserData.user?.id,
      backgroundColor: ["#000000"],
    });

    // Upload the avatar
    const { data: AvatarData, error: AvatarError } = await supabase.storage
      .from("profile-pics")
      .upload(`${UserData?.user?.id}/pfp.svg`, avatar.toString(), {
        contentType: "image/svg+xml",
      });

    // Update the user's profile picture
    if (AvatarError) {
      console.error(AvatarError);
    } else {
      console.log("Attempting to Update");
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
        console.log("Updated User Pfp to " + AvatarData.fullPath);
      }
    }
  }
}
