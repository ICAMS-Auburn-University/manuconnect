'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box, Eye, Loader2, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSTEPLoader } from '../hooks/useSTEPLoader';
import { STEPViewer } from './STEPViewer';

interface PartPreviewProps {
  /** Supabase storage path for the STP file */
  storagePath: string;
  /** Part display name */
  name: string;
  /** Part hierarchy path */
  hierarchy?: string[];
  /** Optional CSS class */
  className?: string;
}

type ViewMode = '3d' | '2d';

/**
 * Part preview panel with a toggle between interactive 3D view
 * and a static 2D snapshot image.
 */
export function PartPreview({
  storagePath,
  name,
  hierarchy,
  className,
}: PartPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const { mesh, dimensions, isLoading, error, snapshotUrl } =
    useSTEPLoader(storagePath);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-gray-900">
            {name}
          </h4>
          {hierarchy && hierarchy.length > 0 && (
            <p className="truncate text-xs text-gray-400">
              {hierarchy.join(' / ')}
            </p>
          )}
        </div>

        {/* 3D / 2D toggle */}
        <div className="flex shrink-0 items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              viewMode === '3d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Box className="h-3.5 w-3.5" />
            3D
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              viewMode === '2d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            2D
          </button>
        </div>
      </div>

      {/* Viewer area */}
      <div className="relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-xs text-gray-400">Loading part…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-red-50">
            <TriangleAlert className="h-6 w-6 text-red-400" />
            <p className="mt-2 max-w-[200px] text-center text-xs text-red-500">
              {error}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {viewMode === '3d' && (
              <STEPViewer mesh={mesh} height={400} />
            )}

            {viewMode === '2d' && snapshotUrl && (
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <Image
                  src={snapshotUrl}
                  alt={`2D preview of ${name}`}
                  width={500}
                  height={400}
                  className="max-h-[380px] w-auto object-contain"
                  unoptimized
                />
              </div>
            )}

            {viewMode === '2d' && !snapshotUrl && (
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400">
                  2D snapshot not available
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dimensions info */}
      {dimensions && !isLoading && (
        <div className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Dimensions:</span>
          <span>{dimensions.x} × {dimensions.y} × {dimensions.z}</span>
        </div>
      )}
    </div>
  );
}
