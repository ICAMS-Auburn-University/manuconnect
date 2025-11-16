export interface SplitPartFile {
  name: string;
  hierarchy: string[];
  storage_path: string;
}

export type SplitPartApiEntry = SplitPartFile | string;

export interface SplitJobResult {
  user_id: string;
  order_id: string;
  original: string;
  parts: SplitPartApiEntry[];
}

export interface PartSummary {
  name: string;
  hierarchy: string[];
  storagePath: string;
}

export interface SplitJobResponse {
  data: SplitJobResult;
}

export interface SplitAssemblyResult {
  userId: string;
  orderId: string;
  originalPath: string;
  parts: PartSummary[];
}
