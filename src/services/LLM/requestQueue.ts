import { CADAnalysisResult } from './types';

export interface ManufacturingRequest {
  id: string;
  analysis: CADAnalysisResult;
  fileName?: string;
  fileUrl?: string;
  timestamp: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';
  quotes?: ManufacturerQuote[];
}

export interface ManufacturerQuote {
  manufacturerId: string;
  manufacturerName: string;
  quotedPrice: number;
  leadTime: string;
  notes?: string;
  timestamp: string;
}

/**
 * Submit a CAD analysis to the manufacturing request queue
 */
export async function submitToRequestQueue(
  analysis: CADAnalysisResult,
  options?: {
    fileName?: string;
    fileUrl?: string;
  }
): Promise<string> {
  const requestId = generateRequestId();
  
  const request: ManufacturingRequest = {
    id: requestId,
    analysis,
    fileName: options?.fileName,
    fileUrl: options?.fileUrl,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  // Store in localStorage for now (can be replaced with API call later)
  const existingRequests = getStoredRequests();
  existingRequests.push(request);
  localStorage.setItem('manufacturing-requests', JSON.stringify(existingRequests));

  // TODO: Replace with actual API call when backend is ready
  // await fetch('/api/manufacturing-requests', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });

  return requestId;
}

/**
 * Get all manufacturing requests from storage
 */
export function getStoredRequests(): ManufacturingRequest[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem('manufacturing-requests');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse stored requests:', error);
    return [];
  }
}

/**
 * Get a specific request by ID
 */
export function getRequestById(id: string): ManufacturingRequest | null {
  const requests = getStoredRequests();
  return requests.find(r => r.id === id) || null;
}

/**
 * Update a request's status
 */
export function updateRequestStatus(
  id: string,
  status: ManufacturingRequest['status']
): boolean {
  const requests = getStoredRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) return false;
  
  requests[index].status = status;
  localStorage.setItem('manufacturing-requests', JSON.stringify(requests));
  
  return true;
}

/**
 * Add a quote to a request
 */
export function addQuoteToRequest(
  requestId: string,
  quote: ManufacturerQuote
): boolean {
  const requests = getStoredRequests();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) return false;
  
  if (!requests[index].quotes) {
    requests[index].quotes = [];
  }
  
  requests[index].quotes!.push(quote);
  localStorage.setItem('manufacturing-requests', JSON.stringify(requests));
  
  return true;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
