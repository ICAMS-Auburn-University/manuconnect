import { CAD_SERVICE_SPLIT_ENDPOINT } from '@/lib/config/cad';
import type {
  PartSummary,
  SplitAssemblyResult,
  SplitJobResponse,
  SplitPartApiEntry,
} from '@/domain/cad/types';

export interface SplitAssemblyParams {
  userId: string;
  orderId: string;
  file: File;
}

export class CadServiceError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'CadServiceError';
    this.status = status;
    this.payload = payload;
  }
}

const deriveHierarchyFromPath = (path: string): string[] => {
  const segments = path.split('/').filter(Boolean);
  return segments.slice(0, -1);
};

const normalizePart = (entry: SplitPartApiEntry): PartSummary => {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) {
      throw new Error('Encountered empty storage path in CAD split payload.');
    }
    const segments = trimmed.split('/').filter(Boolean);
    const name = segments.at(-1) ?? trimmed;
    return {
      name,
      hierarchy: deriveHierarchyFromPath(trimmed),
      storagePath: trimmed,
    };
  }

  const storagePath = entry.storage_path?.trim();
  if (!storagePath) {
    throw new Error('CAD split part is missing storage_path.');
  }

  const hierarchy =
    Array.isArray(entry.hierarchy) && entry.hierarchy.length > 0
      ? entry.hierarchy
      : deriveHierarchyFromPath(storagePath);

  const name =
    entry.name?.trim() ||
    storagePath.split('/').filter(Boolean).at(-1) ||
    storagePath;

  return {
    name,
    hierarchy,
    storagePath,
  };
};

const normalizeResponse = (response: SplitJobResponse): SplitAssemblyResult => {
  const { data } = response;

  if (!data) {
    throw new Error('CAD split API returned an empty payload.');
  }

  return {
    userId: data.user_id,
    orderId: data.order_id,
    originalPath: data.original,
    parts: (data.parts ?? []).map(normalizePart),
  };
};

export async function splitAssembly({
  userId,
  orderId,
  file,
}: SplitAssemblyParams): Promise<SplitAssemblyResult> {
  if (!userId || !orderId || !file) {
    throw new Error('Missing user, order, or file when calling splitAssembly.');
  }

  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('order_id', orderId);
  formData.append('cad_file', file);

  const response = await fetch(CAD_SERVICE_SPLIT_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };

    throw new CadServiceError(
      payload?.detail ?? 'Failed to split CAD assembly.',
      response.status,
      payload
    );
  }

  const data = (await response.json()) as SplitJobResponse;
  return normalizeResponse(data);
}
