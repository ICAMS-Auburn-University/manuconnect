import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/lib/config/env';

const withCookieStore = async (supabaseKey: string) => {
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

// NOTE: use this for client-side or public server-side operations (uses anon/public key)
export const createSupabasePublicClient = () =>
  withCookieStore(env.NEXT_PUBLIC_SUPABASE_KEY);

// NOTE: use this ONLY for privileged server-side operations (uses service role key)
export const createSupabaseServiceRoleClient = () =>
  withCookieStore(env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY);
