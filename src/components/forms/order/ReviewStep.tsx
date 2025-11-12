'use client';

import { useFormContext } from 'react-hook-form';

import type { SplitAssemblyResult } from '@/domain/cad/types';
import { OrderFormValues } from './schema';

interface ReviewStepProps {
  cadResult: SplitAssemblyResult | null;
}

export function ReviewStep({ cadResult }: ReviewStepProps) {
  const form = useFormContext<OrderFormValues>();
  const values = form.watch();
  const dueDate = values.dueDate
    ? new Date(values.dueDate).toLocaleDateString()
    : '—';

  return (
    <div className="space-y-6 rounded border border-gray-200 bg-white p-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Order Snapshot
        </h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p>
            <span className="font-medium text-gray-900">Title:</span>{' '}
            {values.title}
          </p>
          <p>
            <span className="font-medium text-gray-900">Description:</span>{' '}
            {values.description}
          </p>
          <p>
            <span className="font-medium text-gray-900">Units:</span>{' '}
            {values.quantity}
          </p>
          <p>
            <span className="font-medium text-gray-900">Deadline:</span>{' '}
            {dueDate}
          </p>
          <p>
            <span className="font-medium text-gray-900">Tags:</span>{' '}
            {values.tags.join(', ')}
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Shipping
        </h3>
        <address className="not-italic text-sm text-gray-700">
          <div>{values.shippingAddress1}</div>
          <div>{values.shippingAddress2}</div>
          <div>
            {values.shippingCity}, {values.shippingState} {values.shippingZip}
          </div>
          <div>United States</div>
        </address>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Assembly Breakdown
        </h3>
        {cadResult ? (
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Original assembly stored at{' '}
              <span className="font-mono">{cadResult.originalPath}</span>
            </p>
            <ul className="grid gap-2 md:grid-cols-2">
              {cadResult.parts.map((part) => (
                <li
                  key={part.storagePath}
                  className="rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs"
                >
                  {part.storagePath}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Upload a CAD assembly in the previous step to review derived parts.
          </p>
        )}
      </section>

      <section className="space-y-2 rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm">
        <h3 className="font-semibold text-gray-800">
          Production Timeline (preview)
        </h3>
        <p className="text-gray-600">
          We&apos;ll soon visualize sequencing dependencies pulled from the CAD
          metadata. For now, this placeholder marks where a part-by-part build
          schedule will live.
        </p>
      </section>
    </div>
  );
}
