import { env } from '@/lib/config/env';

export interface ParsedStoragePath {
  bucket: string;
  path: string;
}

export function parseStoragePath(storagePath: string): ParsedStoragePath {
  const segments = storagePath.split('/').filter(Boolean);
  if (segments.length < 2) {
    throw new Error(`Invalid Supabase storage path: ${storagePath}`);
  }

  const [bucket, ...pathSegments] = segments;
  return { bucket, path: pathSegments.join('/') };
}

export function buildPublicStorageUrl(storagePath: string): string | null {
  try {
    return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${storagePath}`;
  } catch {
    return null;
  }
}
