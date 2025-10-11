import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_KEY: z.string().min(1),
  NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY,
  NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY:
    process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error(
    'Invalid environment configuration',
    parsed.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

export type Env = typeof env;
