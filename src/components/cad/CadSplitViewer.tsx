'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  Folder as FolderIcon,
  Info,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { buildPartTree, PartTreeNode } from '@/domain/cad/tree';
import type { PartSummary, SplitAssemblyResult } from '@/domain/cad/types';
import {
  formatAssemblyDisplayName,
  formatPartLocation,
} from '@/domain/cad/format';
import { cn } from '@/lib/utils';
import { buildPublicStorageUrl, parseStoragePath } from '@/lib/storage/paths';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DrawingUploadState = {
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  drawingPath?: string;
  drawingUrl?: string | null;
  error?: string | null;
  updatedAt?: string;
};

type DrawingStatusMap = Record<string, DrawingUploadState>;

interface CadSplitViewerProps {
  splitResult: SplitAssemblyResult;
}

export function CadSplitViewer({ splitResult }: CadSplitViewerProps) {
  const [selectedPart, setSelectedPart] = useState<PartSummary | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [pendingDownload, setPendingDownload] = useState<string | null>(null);
  const [drawingStatuses, setDrawingStatuses] = useState<DrawingStatusMap>({});
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    part: PartSummary | null;
  }>({ open: false, part: null });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const derivedTree = useMemo(
    () => buildPartTree(splitResult.parts),
    [splitResult.parts]
  );

  const assemblyLabel = useMemo(
    () => formatAssemblyDisplayName(splitResult.originalPath),
    [splitResult.originalPath]
  );

  const treeRoot = useMemo<PartTreeNode>(
    () => ({
      id: 'assembly-root',
      label: assemblyLabel,
      path: assemblyLabel,
      children: derivedTree,
    }),
    [assemblyLabel, derivedTree]
  );

  useEffect(() => {
    setDrawingStatuses((prev) => {
      const next: DrawingStatusMap = {};
      splitResult.parts.forEach((part) => {
        next[part.storagePath] = prev[part.storagePath] ?? { status: 'idle' };
      });
      return next;
    });

    setSelectedPart((prev) => {
      if (!splitResult.parts.length) {
        return null;
      }

      if (prev) {
        const match = splitResult.parts.find(
          (part) => part.storagePath === prev.storagePath
        );
        if (match) {
          return match;
        }
      }

      return splitResult.parts[0];
    });

    setDownloadUrls((prev) => {
      const next: Record<string, string> = {};
      splitResult.parts.forEach((part) => {
        if (prev[part.storagePath]) {
          next[part.storagePath] = prev[part.storagePath];
        }
      });
      return next;
    });
  }, [splitResult]);

  const handleDownloadPart = useCallback(
    async (part: PartSummary) => {
      const cachedUrl = downloadUrls[part.storagePath];
      if (cachedUrl) {
        window.open(cachedUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      setPendingDownload(part.storagePath);

      try {
        const client = await createSupabaseBrowserClient();
        const { bucket, path } = parseStoragePath(part.storagePath);

        const { data, error } = await client.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60);

        const resolvedUrl =
          data?.signedUrl ??
          client.storage.from(bucket).getPublicUrl(path).data.publicUrl ??
          buildPublicStorageUrl(part.storagePath);

        if (!resolvedUrl) {
          throw error ?? new Error('Unable to resolve download URL.');
        }

        setDownloadUrls((prev) => ({
          ...prev,
          [part.storagePath]: resolvedUrl,
        }));

        window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to download part.';
        toast.error(message);
      } finally {
        setPendingDownload((current) =>
          current === part.storagePath ? null : current
        );
      }
    },
    [downloadUrls]
  );

  const openUploadDialog = useCallback((part: PartSummary) => {
    setSelectedPart(part);
    setUploadError(null);
    setDialogState({ open: true, part });
  }, []);

  const closeUploadDialog = useCallback((open: boolean) => {
    setDialogState((prev) => ({ ...prev, open }));
    if (!open) {
      setUploadError(null);
    }
  }, []);

  const uploadDrawing = useCallback(async (part: PartSummary, file: File) => {
    const client = await createSupabaseBrowserClient();
    const { bucket, path } = parseStoragePath(part.storagePath);

    const objectSegments = path.split('/').filter(Boolean);
    const parentFolder = objectSegments.slice(0, -1).join('/');

    const normalizedName = part.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w\-]+/g, '_');
    const extension = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.'))
      : '.pdf';

    const drawingObjectPath = [
      parentFolder,
      'drawings',
      `${normalizedName}${extension}`,
    ]
      .filter(Boolean)
      .join('/');

    const { error } = await client.storage
      .from(bucket)
      .upload(drawingObjectPath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/pdf',
      });

    if (error) {
      throw error;
    }

    const drawingStoragePath = `${bucket}/${drawingObjectPath}`;

    const { data } = await client.storage
      .from(bucket)
      .createSignedUrl(drawingObjectPath, 60 * 60);

    const fallback =
      client.storage.from(bucket).getPublicUrl(drawingObjectPath).data
        .publicUrl ?? buildPublicStorageUrl(drawingStoragePath);

    return {
      storagePath: drawingStoragePath,
      url: data?.signedUrl ?? fallback,
    };
  }, []);

  const handleUploadDrawing = useCallback(
    async (file: File) => {
      const targetPart = dialogState.part;
      if (!targetPart) {
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      setDrawingStatuses((prev) => ({
        ...prev,
        [targetPart.storagePath]: {
          ...(prev[targetPart.storagePath] ?? { status: 'idle' }),
          status: 'uploading',
          error: null,
        },
      }));

      try {
        const result = await uploadDrawing(targetPart, file);

        setDrawingStatuses((prev) => ({
          ...prev,
          [targetPart.storagePath]: {
            status: 'uploaded',
            drawingPath: result.storagePath,
            drawingUrl: result.url,
            error: null,
            updatedAt: new Date().toISOString(),
          },
        }));

        toast.success('3-view drawing uploaded.');
        setDialogState({ open: false, part: null });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to upload drawing.';
        setUploadError(message);
        setDrawingStatuses((prev) => ({
          ...prev,
          [targetPart.storagePath]: {
            status: 'error',
            error: message,
          },
        }));
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [dialogState.part, uploadDrawing]
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        <div className="rounded border border-muted bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Original assembly securely stored. Derived parts are ready for review
          below.
        </div>

        <div className="rounded border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Derived parts
              </h3>
              <p className="text-xs text-muted-foreground">
                {splitResult.parts.length} generated file
                {splitResult.parts.length === 1 ? '' : 's'}
              </p>
              {treeRoot.children.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Open the parent assembly folder to reveal its subparts.
                </p>
              )}
            </div>
          </div>

          {treeRoot.children.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No parts returned from the CAD service.
            </p>
          ) : (
            <ScrollArea className="mt-4 h-auto pr-4">
              <div className="space-y-2">
                <TreeNode
                  key={treeRoot.id}
                  node={treeRoot}
                  level={0}
                  selectedPartId={selectedPart?.storagePath ?? null}
                  drawingStatuses={drawingStatuses}
                  downloadUrls={downloadUrls}
                  pendingDownload={pendingDownload}
                  onSelectPart={setSelectedPart}
                  onDownloadPart={handleDownloadPart}
                  onUploadDrawing={openUploadDialog}
                />
              </div>
            </ScrollArea>
          )}
        </div>

        <DrawingUploadDialog
          open={dialogState.open}
          part={dialogState.part}
          isUploading={isUploading}
          errorMessage={uploadError}
          onOpenChange={closeUploadDialog}
          onUpload={handleUploadDrawing}
        />
      </div>
    </TooltipProvider>
  );
}

interface TreeNodeProps {
  node: PartTreeNode;
  level: number;
  selectedPartId: string | null;
  drawingStatuses: DrawingStatusMap;
  downloadUrls: Record<string, string>;
  pendingDownload: string | null;
  onSelectPart: (part: PartSummary) => void;
  onDownloadPart: (part: PartSummary) => void;
  onUploadDrawing: (part: PartSummary) => void;
}

const hasMissingDrawings = (
  node: PartTreeNode,
  drawingStatuses: DrawingStatusMap
): boolean => {
  if (node.part) {
    return drawingStatuses[node.part.storagePath]?.status !== 'uploaded';
  }
  return node.children.some((child) =>
    hasMissingDrawings(child, drawingStatuses)
  );
};

function TreeNode({ node, level, ...rest }: TreeNodeProps) {
  if (node.part) {
    return <PartLeaf part={node.part} level={level} {...rest} />;
  }

  const includeWarning = hasMissingDrawings(node, rest.drawingStatuses);

  return (
    <Accordion type="multiple" defaultValue={[]} className="w-full border-none">
      <AccordionItem value={node.id} className="border-none">
        <AccordionTrigger
          className="gap-2 text-sm font-semibold text-gray-900"
          style={{ marginLeft: level * 16 }}
        >
          <div className="flex flex-1 items-center gap-2">
            <FolderIcon className="h-4 w-4 text-blue-600" />
            <span>{node.label}</span>
            {includeWarning && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex cursor-help items-center text-amber-500">
                    <Info
                      className="h-4 w-4"
                      aria-label="Some subparts missing drawings"
                    />
                    <span className="sr-only">
                      Some subparts missing drawings
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  Upload drawings for all subparts.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pl-4">
          <div className="space-y-2">
            {node.children.map((child) => (
              <TreeNode
                key={`${node.id}-${child.id}`}
                node={child}
                level={level + 1}
                {...rest}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface PartLeafProps extends Omit<TreeNodeProps, 'node' | 'level'> {
  part: PartSummary;
  level: number;
}

function PartLeaf({
  part,
  level,
  selectedPartId,
  drawingStatuses,
  downloadUrls,
  pendingDownload,
  onSelectPart,
  onDownloadPart,
  onUploadDrawing,
}: PartLeafProps) {
  const drawingStatus = drawingStatuses[part.storagePath];
  const downloadUrl = downloadUrls[part.storagePath];
  const hasDrawing = drawingStatus?.status === 'uploaded';
  const isSelected = selectedPartId === part.storagePath;
  const locationLabel = formatPartLocation(part);
  const uploadCtaLabel = hasDrawing
    ? 'Replace 3-view drawing'
    : 'Upload 3-view drawing';

  return (
    <div
      className={cn(
        'rounded border p-3 text-sm transition-colors',
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      )}
      style={{ marginLeft: level * 16 }}
      onClick={() => onSelectPart(part)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectPart(part);
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 text-slate-600" />
        <span className="font-medium text-gray-900">{part.name}</span>
        {!hasDrawing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex cursor-help items-center text-amber-500">
                <Info className="h-4 w-4" aria-label="Drawing missing" />
                <span className="sr-only">No drawing uploaded yet</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              Upload a drawing for this part.
            </TooltipContent>
          </Tooltip>
        )}
        {drawingStatus?.status === 'uploaded' && (
          <Badge variant="secondary" className="drawing-badge--uploaded">
            Drawing uploaded
          </Badge>
        )}
        {drawingStatus?.status === 'uploading' && (
          <Badge variant="outline" className="border-amber-200 text-amber-600">
            Uploading…
          </Badge>
        )}
        {drawingStatus?.status === 'error' && (
          <Badge variant="destructive">Upload failed</Badge>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {downloadUrl ? (
          <Button asChild size="sm" variant="outline">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onDownloadPart(part);
            }}
            disabled={pendingDownload === part.storagePath}
          >
            <Download className="mr-2 h-4 w-4" />
            {pendingDownload === part.storagePath ? 'Resolving…' : 'Download'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            onUploadDrawing(part);
          }}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          {uploadCtaLabel}
        </Button>
      </div>
    </div>
  );
}

interface DrawingUploadDialogProps {
  open: boolean;
  part: PartSummary | null;
  isUploading: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<void>;
}

function DrawingUploadDialog({
  open,
  part,
  isUploading,
  errorMessage,
  onOpenChange,
  onUpload,
}: DrawingUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setLocalError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!file) {
        setLocalError('Please select a drawing file to upload.');
        return;
      }

      try {
        await onUpload(file);
        setFile(null);
      } catch {
        // Error feedback handled upstream.
      }
    },
    [file, onUpload]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload 3-view drawing</DialogTitle>
          <DialogDescription>
            {part
              ? `Attach a PDF or image that matches ${part.name}.`
              : 'Select a part to upload a drawing.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="drawing-file">Drawing file</Label>
            <input
              id="drawing-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) => {
                setLocalError(null);
                setFile(event.target.files?.[0] ?? null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, PNG, JPG. Max size 25 MB.
            </p>
          </div>
          {(localError || errorMessage) && (
            <p className="text-sm text-destructive">
              {localError ?? errorMessage}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isUploading || !part}>
              {isUploading ? 'Uploading…' : 'Upload drawing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
