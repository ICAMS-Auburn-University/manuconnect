'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';
import { parseStoragePath, buildPublicStorageUrl } from '@/lib/storage/paths';

export interface STEPLoadResult {
  mesh: THREE.Group | null;
  boundingBox: THREE.Box3 | null;
  dimensions: { x: number; y: number; z: number } | null;
  isLoading: boolean;
  error: string | null;
  snapshotUrl: string | null;
}

/**
 * Fetches a signed URL for an STP file stored in Supabase.
 */
async function fetchSignedUrl(storagePath: string): Promise<string> {
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  const client = await createSupabaseBrowserClient();
  let bucket = 'project-files';
  let path = storagePath.replace(/^\/+/, '');

  try {
    const parsed = parseStoragePath(storagePath);
    bucket = parsed.bucket;
    path = parsed.path;
  } catch {
    const defaultPrefix = `${bucket}/`;
    if (path.startsWith(defaultPrefix)) {
      path = path.slice(defaultPrefix.length);
    }
  }

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (data?.signedUrl) {
    return data.signedUrl;
  }

  const storagePathForPublicUrl = `${bucket}/${path}`;
  const publicUrl =
    client.storage.from(bucket).getPublicUrl(path).data.publicUrl ??
    buildPublicStorageUrl(storagePathForPublicUrl);

  if (publicUrl) {
    return publicUrl;
  }

  throw error ?? new Error('Unable to resolve download URL for part.');
}

/**
 * Loads a STEP file from an ArrayBuffer using occt-import-js
 * and returns a THREE.Group with the parsed geometry.
 */
async function parseSTEPBuffer(buffer: ArrayBuffer): Promise<THREE.Group> {
  // Dynamic import to avoid SSR issues with WASM
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const occtImportJs = (await import('occt-import-js')) as any;
  const occt = await occtImportJs.default({
    locateFile: () => '/occt-import-js.wasm',
  });

  const fileBuffer = new Uint8Array(buffer);
  const result = occt.ReadStepFile(fileBuffer, null);

  const group = new THREE.Group();

  for (const resultMesh of result.meshes) {
    const geometry = new THREE.BufferGeometry();

    // Vertices
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3)
    );

    // Normals (if available)
    if (resultMesh.attributes.normal) {
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3)
      );
    }

    // Index
    if (resultMesh.index) {
      geometry.setIndex(
        new THREE.BufferAttribute(new Uint32Array(resultMesh.index.array), 1)
      );
    }

    // Face colors from STEP or default
    let color = new THREE.Color(0x8899aa);
    if (resultMesh.color) {
      color = new THREE.Color(
        resultMesh.color[0] / 255,
        resultMesh.color[1] / 255,
        resultMesh.color[2] / 255
      );
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  }

  return group;
}

/**
 * Captures a 2D snapshot (PNG data URL) of a THREE.Group from a given camera angle.
 */
function captureSnapshot(
  group: THREE.Group,
  width = 512,
  height = 512
): string | null {
  try {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const clone = group.clone();
    scene.add(clone);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    scene.add(directional);

    // Fit camera to model
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = 50;
    const distance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));

    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 10000);
    camera.position.set(
      center.x + distance * 0.8,
      center.y + distance * 0.6,
      center.z + distance
    );
    camera.lookAt(center);

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    renderer.dispose();
    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * React hook that loads and parses an STP file from Supabase storage.
 * Returns a THREE.Group for 3D rendering and a snapshot for 2D preview.
 */
export function useSTEPLoader(storagePath: string | null): STEPLoadResult {
  const [mesh, setMesh] = useState<THREE.Group | null>(null);
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const [dimensions, setDimensions] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadedPathRef = useRef<string | null>(null);

  const loadStep = useCallback(async (path: string) => {
    if (loadedPathRef.current === path) {
      return; // Already loaded
    }
    loadedPathRef.current = path;
    setIsLoading(true);
    setError(null);
    setMesh(null);
    setBoundingBox(null);
    setDimensions(null);
    setSnapshotUrl(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = await fetchSignedUrl(path);

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch STP file (HTTP ${response.status})`);
      }

      const buffer = await response.arrayBuffer();
      if (controller.signal.aborted) return;

      const group = await parseSTEPBuffer(buffer);
      if (controller.signal.aborted) return;

      // Compute bounding box and dimensions
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());

      setMesh(group);
      setBoundingBox(box);
      setDimensions({
        x: Math.round(size.x * 100) / 100,
        y: Math.round(size.y * 100) / 100,
        z: Math.round(size.z * 100) / 100,
      });

      // Generate 2D snapshot
      const snapshot = captureSnapshot(group);
      setSnapshotUrl(snapshot);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : 'Failed to load STEP file';
      setError(message);
      loadedPathRef.current = null;
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!storagePath) {
      setMesh(null);
      setBoundingBox(null);
      setDimensions(null);
      setSnapshotUrl(null);
      setError(null);
      setIsLoading(false);
      loadedPathRef.current = null;
      return;
    }

    void loadStep(storagePath);

    return () => {
      abortRef.current?.abort();
    };
  }, [storagePath, loadStep]);

  return { mesh, boundingBox, dimensions, isLoading, error, snapshotUrl };
}
