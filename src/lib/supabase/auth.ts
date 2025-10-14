import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';

// Lower-level data-access / repository functions for auth
export async function supabaseLogin(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function supabaseSignup(
  email: string,
  password: string,
  profileData: {
    firstName: string;
    lastName: string;
    accountType: string;
    companyName: string;
  }
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        display_name: `${profileData.firstName} ${profileData.lastName}`,
        account_type: profileData.accountType,
        company_name: profileData.companyName,
        profile_picture: '',
      },
    },
  });
  return { data, error };
}

// You can also add more: fetchUser, updateUserMetadata, etc.
