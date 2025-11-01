'use client';

import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/config/env';

export const createSupabaseBrowserClient = async () =>
  createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_KEY
  );
