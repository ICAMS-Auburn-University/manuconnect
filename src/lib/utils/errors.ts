export const isNextRedirectError = (
  error: unknown
): error is { digest: string } => {
  if (typeof error === 'object' && error !== null && 'digest' in error) {
    const digest = (error as { digest?: unknown }).digest;
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
  }
  return false;
};
