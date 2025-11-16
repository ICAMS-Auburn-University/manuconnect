const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

/**
 * Update this constant when the CAD microservice base URL changes.
 * Falls back to the hardcoded local dev endpoint if no env override is provided.
 */
export const CAD_SERVICE_API_BASE = trimTrailingSlash(
  process.env.NEXT_PUBLIC_CAD_SERVICE_URL ?? 'http://localhost:8000/api/v1'
);

export const CAD_SERVICE_SPLIT_ENDPOINT = `${CAD_SERVICE_API_BASE}/split`;
