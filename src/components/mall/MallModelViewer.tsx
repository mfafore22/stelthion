import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface MallModelViewerProps {
  modelUrl: string;
  className?: string;
  backgroundColor?: number;
  scale?: number;
  initialCameraPosition?: [number, number, number];
  initialTarget?: [number, number, number];
}

/**
 * Lightweight Three.js viewer for standalone mall models.
 * Intended for locations that do not yet have full map integrations.
 */
export function MallModelViewer({
  modelUrl,
  className,
  backgroundColor = 0x050a18,
  scale = 1,
  initialCameraPosition = [40, 30, 60],
  initialTarget,
}: MallModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(...initialCameraPosition);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    if (initialTarget) {
      controls.target.set(...initialTarget);
    }
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(80, 120, 120);
    scene.add(directionalLight);

    let animationFrame = -1;
    let currentModel: THREE.Object3D | null = null;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      gltf => {
        currentModel = gltf.scene;
        currentModel.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        // Center the model and apply optional scale
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        currentModel.scale.setScalar(scale);
        scene.add(currentModel);

        // Auto-fit camera if no explicit target was provided
        if (!initialTarget) {
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fitDistance = maxDim * 1.6 + 10;
          const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
          const newPosition = direction.multiplyScalar(fitDistance);
          camera.position.copy(newPosition);

          const centerWorld = new THREE.Vector3();
          box.getCenter(centerWorld);
          controls.target.copy(centerWorld);
          controls.update();
        }
      },
      undefined,
      error => {
        console.error('[MallModelViewer] Failed to load model:', error);
      }
    );

    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', onResize);
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrame);
      controls.dispose();
      renderer.dispose();
      if (currentModel) {
        scene.remove(currentModel);
      }
      container.removeChild(renderer.domElement);
    };
  }, [backgroundColor, initialCameraPosition, initialTarget, modelUrl, scale]);

  return <div ref={containerRef} className={className} />;
}
