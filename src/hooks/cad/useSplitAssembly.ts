import { useCallback, useState } from 'react';

import {
  CadServiceError,
  SplitAssemblyParams,
  SplitAssemblyResult,
  splitAssembly,
} from '@/services/cad/splitAssembly';

interface SplitAssemblyState {
  data: SplitAssemblyResult | null;
  error: CadServiceError | Error | null;
  isLoading: boolean;
}

/**
 * Provides mutation-style semantics for the CAD split service helper.
 * Exposes loading, error, and data state alongside the trigger function.
 */
export function useSplitAssembly() {
  const [state, setState] = useState<SplitAssemblyState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const trigger = useCallback(
    async (params: SplitAssemblyParams): Promise<SplitAssemblyResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await splitAssembly(params);
        setState({ data, error: null, isLoading: false });
        return data;
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error('Unexpected error');
        setState({ data: null, error: normalizedError, isLoading: false });
        throw normalizedError;
      }
    },
    []
  );

  return { splitAssembly: trigger, ...state };
}

export type UseSplitAssemblyReturn = ReturnType<typeof useSplitAssembly>;
