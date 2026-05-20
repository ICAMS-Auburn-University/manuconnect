'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OrdersSchema } from '@/types/schemas';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';
import { useSTEPLoader } from '@/components/cad/hooks/useSTEPLoader';
import { STEPViewer } from '@/components/cad/STEPViewer/STEPViewer';

const DEFAULT_MODEL_PATH = '/error.glb';
const STORAGE_BUCKET = 'project-files';

const STEP_EXTENSIONS = ['.stp', '.step', '.stpz'];

function isStepFile(path: string): boolean {
  const lower = path.toLowerCase();
  return STEP_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function normalizeStorageObjectPath(path: string): string {
  const trimmed = path.trim().replace(/^\/+/, '');
  const bucketPrefix = `${STORAGE_BUCKET}/`;
  if (trimmed.startsWith(bucketPrefix)) {
    return trimmed.slice(bucketPrefix.length);
  }
  return trimmed;
}

function Model({
  url,
  onReady,
}: {
  url: string;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return <primitive object={scene} />;
}

function resolveFilePath(fileURLs: OrdersSchema['fileURLs']): string | null {
  if (!fileURLs) {
    return null;
  }

  const rawValue = fileURLs.trim();

  if (!rawValue || rawValue === 'null' || rawValue === 'undefined') {
    return null;
  }

  if (rawValue.startsWith('[') || rawValue.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawValue);

      if (Array.isArray(parsed)) {
        const candidate = parsed.find(
          (value) => typeof value === 'string' && value.trim().length > 0
        );

        if (typeof candidate === 'string') {
          return candidate.trim();
        }
      }

      if (typeof parsed === 'string' && parsed.trim().length > 0) {
        return parsed.trim();
      }
    } catch (error) {
      console.warn('Unable to parse order file URLs', error);
    }
  }

  return rawValue;
}

function STEPModelViewer({ storagePath }: { storagePath: string }) {
  const [hookPath, setHookPath] = useState<string | null>(storagePath);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const { mesh, dimensions, isLoading, error } = useSTEPLoader(hookPath);

  useEffect(() => {
    setHookPath(storagePath);
  }, [storagePath]);

  useEffect(() => {
    if (!isLoading) {
      setIsSlowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSlowLoading(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full rounded-md h-full min-h-[420px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm rounded-md">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="flex flex-col items-start">
              <span className="text-sm text-muted-foreground">
                Loading STEP model…
              </span>
              {isSlowLoading && (
                <span className="text-xs text-muted-foreground">
                  Large files can take a minute to parse.
                </span>
              )}
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 rounded-md bg-muted text-sm text-muted-foreground">
            <span>Failed to load model: {error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHookPath(null);
                requestAnimationFrame(() => setHookPath(storagePath));
              }}
            >
              Retry loading model
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <STEPViewer mesh={mesh} height={420} />
        )}
      </div>

      {dimensions && !isLoading && (
        <div className="mt-2 flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium">Bounding box:</span>
          <span>{dimensions.x} × {dimensions.y} × {dimensions.z}</span>
        </div>
      )}
    </div>
  );
}

function GLTFModelViewer({ modelPath }: { modelPath: string | null }) {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      setIsLoading(true);
      setIsModelReady(false);
      setIsSlowLoading(false);
      setErrorMessage(null);

      if (!modelPath) {
        if (isMounted) {
          setModelUrl(DEFAULT_MODEL_PATH);
          setDownloadUrl(DEFAULT_MODEL_PATH);
          setIsLoading(false);
        }
        return;
      }

      if (modelPath.startsWith('http')) {
        if (isMounted) {
          setModelUrl(modelPath);
          setDownloadUrl(modelPath);
        }
        return;
      }

      try {
        const supabase = await createSupabaseBrowserClient();
        const objectPath = normalizeStorageObjectPath(modelPath);

        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(objectPath, 60 * 60);

        let resolvedUrl = data?.signedUrl ?? null;

        if (!resolvedUrl) {
          const publicUrlResult = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(objectPath);

          resolvedUrl = publicUrlResult.data?.publicUrl ?? null;
        }

        if (!resolvedUrl) {
          throw error ?? new Error('Unable to resolve model URL');
        }

        if (isMounted) {
          setModelUrl(resolvedUrl);
          setDownloadUrl(resolvedUrl);
        }
      } catch (error) {
        console.error('Failed to load 3D model from Supabase', error);
        if (isMounted) {
          setModelUrl(DEFAULT_MODEL_PATH);
          setDownloadUrl(DEFAULT_MODEL_PATH);
          setErrorMessage('Showing fallback model.');
        }
      } finally {
        // Keep the loading overlay until the GLTF scene is parsed/render-ready.
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [modelPath, reloadKey]);

  useEffect(() => {
    if (!modelUrl || isModelReady) {
      setIsSlowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSlowLoading(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [modelUrl, isModelReady]);

  useEffect(() => {
    if (!modelUrl || isModelReady) {
      return;
    }

    const timeout = setTimeout(() => {
      setErrorMessage('Model loading timed out. Please retry or download the file.');
      setModelUrl(null);
      setIsLoading(false);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [modelUrl, isModelReady]);

  const isViewerLoading = isLoading || (!!modelUrl && !isModelReady);

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full bg-muted rounded-md h-full">
        {isViewerLoading && (
          <div className="h-full absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="flex flex-col items-start">
              <span className="text-sm text-muted-foreground">
                Loading 3D model…
              </span>
              {isSlowLoading && (
                <span className="text-xs text-muted-foreground">
                  This model is large. Still working…
                </span>
              )}
            </div>
          </div>
        )}

        {!modelUrl && !isViewerLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>No 3D model available.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((prev) => prev + 1)}
            >
              Retry loading model
            </Button>
          </div>
        ) : (
          <Canvas
            camera={{ position: [2, 2, 4], fov: 45 }}
            className="rounded-md h-96"
          >
            <ambientLight intensity={0.7} />
            <Suspense fallback={null}>
              <Environment preset="warehouse" />
              {modelUrl && (
                <Model
                  url={modelUrl}
                  onReady={() => {
                    setIsModelReady(true);
                    setIsLoading(false);
                  }}
                />
              )}
            </Suspense>
            <OrbitControls makeDefault />
          </Canvas>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        {downloadUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={downloadUrl} download>
              <Download className="mr-2 h-4 w-4" />
              Download Model
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-muted-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Model
          </Button>
        )}
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-muted-foreground">{errorMessage}</p>
      )}
    </div>
  );
}

export default function View3DModel({ order }: { order: OrdersSchema }) {
  const modelPath = useMemo(
    () => resolveFilePath(order.fileURLs),
    [order.fileURLs]
  );

  const isStep = modelPath ? isStepFile(modelPath) : false;

  if (!modelPath) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
        No 3D model available.
      </div>
    );
  }

  if (isStep) {
    const storagePath = modelPath.startsWith('http')
      ? modelPath
      : modelPath.startsWith(`${STORAGE_BUCKET}/`)
        ? modelPath
        : `${STORAGE_BUCKET}/${normalizeStorageObjectPath(modelPath)}`;

    return (
      <div className="space-y-4">
        <STEPModelViewer storagePath={storagePath} />
        <DownloadButton modelPath={modelPath} />
      </div>
    );
  }

  return <GLTFModelViewer modelPath={modelPath} />;
}

function DownloadButton({ modelPath }: { modelPath: string }) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      if (modelPath.startsWith('http')) {
        setDownloadUrl(modelPath);
        return;
      }

      try {
        const supabase = await createSupabaseBrowserClient();
        const objectPath = normalizeStorageObjectPath(modelPath);
        const { data } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(objectPath, 60 * 60);

        if (isMounted && data?.signedUrl) {
          setDownloadUrl(data.signedUrl);
        }
      } catch {
        // Download URL will remain null — button stays disabled
      }
    };

    resolve();
    return () => { isMounted = false; };
  }, [modelPath]);

  return (
    <div className="flex justify-between">
      {downloadUrl ? (
        <Button variant="outline" size="sm" asChild>
          <a href={downloadUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download Model
          </a>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="text-muted-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Model
        </Button>
      )}
    </div>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);
