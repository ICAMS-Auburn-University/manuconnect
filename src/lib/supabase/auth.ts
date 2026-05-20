import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';
import { SignUpData } from '@/domain/auth/types';

function resolveAppBaseUrl() {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, '');
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost}`.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

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
      emailRedirectTo: `${resolveAppBaseUrl()}/confirmAuth?next=/onboarding`,
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
