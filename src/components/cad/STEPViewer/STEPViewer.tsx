'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);

  // Initialize the Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const h = height;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xf8f9fa, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 10, 7);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-5, -3, -5);
    scene.add(dir2);

    // Camera — wide clipping range so large and small parts never get clipped
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.001, 100000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Controls — tuned for smooth interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 1.0;
    controls.rotateSpeed = 1.0;
    controls.minDistance = 0.01;
    controls.maxDistance = 50000;
    // Prevent the controls from stealing touch scroll on mobile
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const observer = new ResizeObserver(() => {
      const w = container.clientWidth;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [height]);

  // Update the mesh in the scene whenever it changes
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    // Remove old meshes (keep lights)
    const toRemove = scene.children.filter(
      (child) => child instanceof THREE.Group
    );
    toRemove.forEach((child) => scene.remove(child));

    if (!mesh) return;

    const clone = mesh.clone();
    scene.add(clone);

    // Fit camera to model with adequate padding so nothing is clipped
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.6; // 1.6× padding

    // Dynamically set clipping planes based on model size
    camera.near = maxDim * 0.0001;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();

    camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.5,
      center.z + distance * 0.9
    );
    camera.lookAt(center);
    controls.target.copy(center);
    controls.minDistance = maxDim * 0.1;
    controls.maxDistance = maxDim * 20;
    controls.update();
  }, [mesh]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full rounded-lg border border-gray-200 bg-gray-50 overflow-hidden',
        className
      )}
      style={{ height }}
    />
  );
}
