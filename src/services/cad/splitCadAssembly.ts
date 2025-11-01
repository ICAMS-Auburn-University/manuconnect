export interface SplitCadAssemblyParams {
  userId: string;
  orderId: string;
  file: File;
}

export interface SplitCadAssemblyResult {
  user_id: string;
  order_id: string;
  original: string;
  parts: string[];
}

export class CadServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CadServiceError';
    this.status = status;
  }
}

/**
 * Calls the CAD service split endpoint to extract individual parts from an uploaded assembly.
 * @throws CadServiceError when the CAD service responds with a non-2xx status code.
 */
export async function splitCadAssembly({
  userId,
  orderId,
  file,
}: SplitCadAssemblyParams): Promise<SplitCadAssemblyResult> {
  const baseUrl = process.env.NEXT_PUBLIC_CAD_SERVICE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_CAD_SERVICE_URL is not configured.');
  }

  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('order_id', orderId);
  formData.append('cad_file', file);

  const response = await fetch(`${baseUrl}/split`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    throw new CadServiceError(
      payload?.detail ?? 'Failed to split CAD assembly',
      response.status
    );
  }

  const result = (await response.json()) as { data: SplitCadAssemblyResult };
  return result.data;
}
