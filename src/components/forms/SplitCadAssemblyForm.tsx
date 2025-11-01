import { ChangeEvent, FormEvent, useCallback, useState } from 'react';

import { useSplitCadAssembly } from '@/hooks/cad/useSplitCadAssembly';

export function SplitCadAssemblyForm() {
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { splitCadAssembly, data, error, isLoading } = useSplitCadAssembly();

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFile(event.target.files?.[0] ?? null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!file) {
        setFormError('Please select a CAD file to upload.');
        return;
      }

      setFormError(null);

      try {
        await splitCadAssembly({
          userId,
          orderId,
          file,
        });
      } catch {
        // Error state is handled via the hook; no-op to avoid noisy console errors.
      }
    },
    [file, orderId, splitCadAssembly, userId]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded border border-gray-200 p-4"
    >
      <fieldset className="flex flex-col gap-2">
        <label htmlFor="userId" className="text-sm font-medium text-gray-700">
          User ID
        </label>
        <input
          id="userId"
          name="userId"
          type="text"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="user-123"
          required
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="orderId" className="text-sm font-medium text-gray-700">
          Order ID
        </label>
        <input
          id="orderId"
          name="orderId"
          type="text"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="order-456"
          required
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="cadFile" className="text-sm font-medium text-gray-700">
          CAD File (STEP/IGES)
        </label>
        <input
          id="cadFile"
          name="cadFile"
          type="file"
          accept=".step,.stp,.iges,.igs"
          onChange={handleFileChange}
          className="text-sm"
          required
        />
      </fieldset>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Splitting…' : 'Split Assembly'}
      </button>

      {(formError || error) && (
        <p className="text-sm text-red-600">
          {formError ?? error?.message ?? 'An unexpected error occurred.'}
        </p>
      )}

      {data && (
        <div className="rounded bg-gray-50 p-3 text-sm">
          <p className="font-semibold text-gray-800">Supabase Paths</p>
          <p className="mt-2 text-gray-700">
            Original: <span className="font-mono">{data.original}</span>
          </p>
          <div className="mt-2">
            <p className="text-gray-700">Parts:</p>
            <ul className="mt-1 list-disc pl-5">
              {data.parts.map((partPath) => (
                <li key={partPath} className="font-mono text-gray-700">
                  {partPath}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </form>
  );
}
