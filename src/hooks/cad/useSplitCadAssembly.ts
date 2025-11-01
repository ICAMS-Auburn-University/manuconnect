import { useCallback, useState } from 'react';

import {
  CadServiceError,
  SplitCadAssemblyParams,
  SplitCadAssemblyResult,
  splitCadAssembly,
} from '@/services/cad/splitCadAssembly';

interface SplitCadAssemblyState {
  data: SplitCadAssemblyResult | null;
  error: CadServiceError | Error | null;
  isLoading: boolean;
}

/**
 * Provides mutation-style semantics for the CAD split service helper.
 * Exposes loading, error, and data state alongside the trigger function.
 */
export function useSplitCadAssembly() {
  const [state, setState] = useState<SplitCadAssemblyState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const trigger = useCallback(
    async (params: SplitCadAssemblyParams): Promise<SplitCadAssemblyResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await splitCadAssembly(params);
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

  return {
    splitCadAssembly: trigger,
    ...state,
  };
}

export type UseSplitCadAssemblyReturn = ReturnType<typeof useSplitCadAssembly>;
