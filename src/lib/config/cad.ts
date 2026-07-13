const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeCadServiceBase = (value: string) => {
  const trimmed = trimTrailingSlash(value);

  if (trimmed.endsWith('/split')) {
    return trimmed.slice(0, -'/split'.length);
  }

  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }

  return `${trimmed}/api/v1`;
};

/**
 * Update this constant when the CAD microservice base URL changes.
 * Falls back to the hardcoded local dev endpoint if no env override is provided.
 */
export const CAD_SERVICE_API_BASE = trimTrailingSlash(
  normalizeCadServiceBase(
    process.env.NEXT_PUBLIC_CAD_SERVICE_URL ?? 'http://localhost:8000/api/v1'
  )
);

export const CAD_SERVICE_SPLIT_ENDPOINT = `${CAD_SERVICE_API_BASE}/split`;
