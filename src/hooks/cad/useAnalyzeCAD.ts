import { useCallback, useState } from 'react';
import {
  CADAnalysisResult,
} from '@/services/LLM/types';
import type { SplitAssemblyResult } from '@/domain/cad/types';

interface UseAnalyzeCADState {
  data: CADAnalysisResult | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Hook to analyze CAD data with LLM
 * Provides mutation-style semantics with loading, error, and data state
 */
export function useAnalyzeCAD() {
  const [state, setState] = useState<UseAnalyzeCADState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const analyze = useCallback(
    async (splitData: SplitAssemblyResult): Promise<CADAnalysisResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await fetch('/api/cad/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ splitData }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          analysis?: CADAnalysisResult;
          error?: string;
        };

        if (!response.ok || !payload.analysis) {
          throw new Error(payload.error || 'Failed to analyze CAD');
        }

        setState({ data: payload.analysis, error: null, isLoading: false });
        return payload.analysis;
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error('Unexpected error');
        setState({ data: null, error: normalizedError, isLoading: false });
        throw normalizedError;
      }
    },
    []
  );

  return { analyze, ...state };
}
