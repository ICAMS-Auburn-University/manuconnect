'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OrdersSchema } from '@/types/schemas';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';

const DEFAULT_MODEL_PATH = '/error.glb';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
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

export default function View3DModel({ order }: { order: OrdersSchema }) {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modelPath = useMemo(
    () => resolveFilePath(order.fileURLs),
    [order.fileURLs]
  );

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      setIsLoading(true);
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
          setIsLoading(false);
        }
        return;
      }

      try {
        const supabase = await createSupabaseBrowserClient();

        const { data, error } = await supabase.storage
          .from('project-files')
          .createSignedUrl(modelPath, 60 * 60);

        let resolvedUrl = data?.signedUrl ?? null;

        if (!resolvedUrl) {
          const publicUrlResult = supabase.storage
            .from('project-files')
            .getPublicUrl(modelPath);

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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [modelPath]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full bg-muted rounded-md h-full">
        {isLoading && (
          <div className="h-full absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading 3D model…
            </span>
          </div>
        )}

        {!modelUrl && !isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No 3D model available.
          </div>
        ) : (
          <Canvas
            camera={{ position: [2, 2, 4], fov: 45 }}
            className="rounded-md h-96"
          >
            <ambientLight intensity={0.7} />
            <Suspense fallback={null}>
              <Environment preset="warehouse" />
              {modelUrl && <Model url={modelUrl} />}
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

useGLTF.preload(DEFAULT_MODEL_PATH);
