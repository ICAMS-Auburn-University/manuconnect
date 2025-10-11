import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/lib/config/env';

type SupabaseClient = ReturnType<typeof createServerClient>;

const withCookieStore = async (
  supabaseKey: string
): Promise<SupabaseClient> => {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware refreshes sessions.
        }
      },
    },
  });
};

export const createSupabaseServerClient = () =>
  withCookieStore(env.NEXT_PUBLIC_SUPABASE_KEY);

export const createSupabaseServiceRoleClient = () =>
  withCookieStore(env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY);

// Backwards compatibility for existing imports
export const createClient = () => createSupabaseServerClient();
