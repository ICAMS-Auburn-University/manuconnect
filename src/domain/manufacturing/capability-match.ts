export type CapabilityMatch = 'match' | 'mismatch' | 'unknown';

export function matchCapability(
  requirement: string | null,
  supported: ReadonlySet<string>,
  comparable = true
): CapabilityMatch {
  const normalized = requirement?.trim().toLowerCase();
  if (!normalized || supported.size === 0 || !comparable) return 'unknown';
  return supported.has(normalized) ? 'match' : 'mismatch';
}