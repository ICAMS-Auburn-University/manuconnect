import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { createClient } from '@/services/supabase/client';
import { SignUpData } from '@/domain/auth/types';

// --------- Server-side functions (START) ---------
export async function supabaseLogin(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function supabaseSignup(signUpData: SignUpData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: signUpData.email,
    password: signUpData.password,
    options: {
      data: {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        display_name: `${signUpData.firstName} ${signUpData.lastName}`,
        account_type: signUpData.accountType,
        profile_picture: '',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/confirmAuth?next=/onboarding`,
    },
  });
  return { data, error };
}

export async function updateUserMetadataServer(
  metadata: Record<string, unknown>
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });
  return { data, error };
}

export async function supabaseGetUserServer() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}
// --------- Server-side functions (END) ---------

// --------- Client-side functions (START) ---------
export async function updateUserMetadata(metadata: Record<string, unknown>) {
  'use client';
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });
  return { data, error };
}

export async function supabaseGetUser() {
  'use client';
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}
// --------- Client-side functions (END) ---------
