'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '@/store/useConfigStore';
import { useUIStore } from '@/store/useUIStore';
import { DEFAULT_SETTINGS, type ConfiguratorSettings } from '@/config/settings';
import GarageModel from './GarageModel';
import GroundPlane from './GroundPlane';

interface GarageSceneProps {
  settings?: ConfiguratorSettings;
}

export default function GarageScene({ settings = DEFAULT_SETTINGS }: GarageSceneProps) {
  const dim = useConfigStore(s => s.config.dimensions);
  const setSelectedGate = useUIStore(s => s.setSelectedGate);

  // Camera target: centre of the garage (half-height)
  const targetY = dim.height / 2;

  // Safe min distance: well outside the building diagonal
  const diagonal = Math.sqrt(dim.width ** 2 + dim.depth ** 2);
  const minDist  = Math.max(diagonal * 0.5, 3);
  const maxDist  = diagonal * 4;

  // Shadow frustum: fit tightly to the building (+generous margin)
  const shadowSize = Math.max(dim.width, dim.depth) * 0.7 + 4;

  return (
    <Canvas
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.86 }}
      camera={{ position: [dim.width * 1.5, dim.height * 2, dim.depth * 2], fov: 45, near: 0.1, far: 300 }}
      style={{ width: '100%', height: '100%', background: '#c9dff0' }}
      onClick={() => setSelectedGate(null)}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.42} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.82}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-camera-left={-shadowSize}
          shadow-camera-right={shadowSize}
          shadow-camera-top={shadowSize}
          shadow-camera-bottom={-shadowSize}
          shadow-bias={-0.001}
          shadow-normalBias={0.05}
        />
        <directionalLight position={[-8, 10, -8]} intensity={0.22} />

        {/* Environment */}
        <Environment preset="city" />

        {/* Ground */}
        <GroundPlane config={settings.ground} />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={24} blur={3.5} far={8} resolution={512} />

        {/* Garage */}
        <GarageModel />

        {/* Camera controls with safety limits */}
        <OrbitControls
          makeDefault
          target={[0, targetY, 0]}
          minDistance={minDist}
          maxDistance={maxDist}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.05}
          enablePan
          panSpeed={0.6}
          zoomSpeed={0.8}
          dampingFactor={0.08}
          enableDamping
        />
      </Suspense>
    </Canvas>
  );
}
