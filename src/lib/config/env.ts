export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
  NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY:
    process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export type Env = typeof env;
