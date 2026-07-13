'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
} from '@react-three/drei';
import { cn } from '@/lib/utils';

interface STEPViewerProps {
  /** THREE.Group containing the parsed STEP meshes */
  mesh: THREE.Group | null;
  /** Optional CSS class for the container */
  className?: string;
  /** Height of the viewer in px (default 320) */
  height?: number;
}

/**
 * Interactive 3D viewer that renders a THREE.Group with orbit controls.
 * Uses vanilla Three.js (no React Three Fiber) to avoid SSR issues in Next.js.
 */
export function STEPViewer({
  mesh,
  className,
  height = 420,
}: STEPViewerProps) {
  const displayMesh = useMemo(() => {
    if (!mesh) {
      return null;
    }

    const root = new THREE.Group();
    const source = mesh.clone(true);

    source.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const baseGeometry = child.geometry.clone();
      baseGeometry.computeBoundingSphere();

      const material = Array.isArray(child.material)
        ? child.material[0]
        : child.material;
      const baseColor =
        material instanceof THREE.Material && 'color' in material
          ? (material as THREE.MeshStandardMaterial).color
          : new THREE.Color(0x8ea4b8);

      const shadedMesh = new THREE.Mesh(
        baseGeometry,
        new THREE.MeshPhysicalMaterial({
          color: baseColor,
          metalness: 0.08,
          roughness: 0.42,
          clearcoat: 0.18,
          clearcoatRoughness: 0.35,
          envMapIntensity: 0.85,
          side: THREE.DoubleSide,
        })
      );
      shadedMesh.castShadow = true;
      shadedMesh.receiveShadow = true;
      shadedMesh.position.copy(child.position);
      shadedMesh.rotation.copy(child.rotation);
      shadedMesh.scale.copy(child.scale);

      const edgeLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(baseGeometry, 35),
        new THREE.LineBasicMaterial({
          color: 0x203040,
          transparent: true,
          opacity: 0.2,
        })
      );
      shadedMesh.add(edgeLines);
      root.add(shadedMesh);
    });

    return root;
  }, [mesh]);

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border border-gray-200 bg-[radial-gradient(circle_at_top,_#ffffff,_#eef3f8_55%,_#dde6f0)]',
        className
      )}
      style={{ height }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.2, 2.4, 3.6], fov: 38, near: 0.01, far: 100000 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          scene.background = new THREE.Color('#eef3f8');
        }}
      >
        <ambientLight intensity={0.45} />
        <hemisphereLight
          args={['#f8fbff', '#d8dee8', 1.05]}
          position={[0, 8, 0]}
        />
        <directionalLight
          castShadow
          intensity={2.6}
          position={[8, 10, 7]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.00008}
        />
        <directionalLight intensity={0.9} position={[-6, 4, -8]} />
        <Environment preset="studio" />

        {displayMesh && (
          <Bounds fit clip observe margin={1.24}>
            <Center>
              <primitive object={displayMesh} />
            </Center>
          </Bounds>
        )}

        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.3}
          scale={18}
          blur={2.6}
          far={6}
          resolution={1024}
          color="#7f8fa3"
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          rotateSpeed={0.8}
          zoomSpeed={0.9}
          panSpeed={0.8}
          minDistance={0.1}
          maxDistance={50000}
        />
      </Canvas>
    </div>
  );
}
