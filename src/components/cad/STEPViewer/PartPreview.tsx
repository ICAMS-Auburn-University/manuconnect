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
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-foreground">
            {name}
          </h4>
          {hierarchy && hierarchy.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              {hierarchy.join(' / ')}
            </p>
          )}
        </div>

        {/* 3D / 2D toggle */}
        <div className="flex shrink-0 items-center rounded-md border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              viewMode === '3d'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">Loading part…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-destructive/10">
            <TriangleAlert className="h-6 w-6 text-destructive" />
            <p className="mt-2 max-w-[200px] text-center text-xs text-destructive">
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
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-muted">
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
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-muted">
                <p className="text-xs text-muted-foreground">
                  2D snapshot not available
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dimensions info */}
      {dimensions && !isLoading && (
        <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Dimensions:</span>
          <span>{dimensions.x} × {dimensions.y} × {dimensions.z}</span>
        </div>
      )}
    </div>
  );
}
