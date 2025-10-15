'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/config/env';

let browserClient: SupabaseClient<any, any> | null = null;

export function createClient(): SupabaseClient<any, any> {
  if (!browserClient) {
    browserClient = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_KEY
    );
  }

  return browserClient;
}
