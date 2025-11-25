import type { PartSummary } from './types';

export function formatPartBreadcrumb(part: PartSummary): string {
  const hierarchy = Array.isArray(part.hierarchy) ? part.hierarchy : [];
  const segments = hierarchy.filter(Boolean);

  if (part.name) {
    segments.push(part.name);
  }

  if (segments.length === 0) {
    return 'Unnamed part';
  }

  return segments.join(' / ');
}

export function formatPartLocation(part: PartSummary): string {
  if (!Array.isArray(part.hierarchy) || part.hierarchy.length === 0) {
    return 'Top-level part';
  }
  return part.hierarchy.filter(Boolean).join(' / ');
}

export function formatAssemblyDisplayName(originalPath: string): string {
  if (!originalPath) {
    return 'Original assembly';
  }
  const segments = originalPath.split('/').filter(Boolean);
  const fileName = segments.at(-1);
  if (!fileName) {
    return 'Original assembly';
  }
  return fileName;
}
