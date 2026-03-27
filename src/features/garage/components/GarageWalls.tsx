'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '@/store/useConfigStore';
import { effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { useSpriteMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { buildWallsWithGablesGeometry } from '@/features/garage/utils/geometry';

/** Renders garage walls and floor. Each wall is a thin box so corners don't z-fight. */
export default function GarageWalls() {
  const dim           = useConfigStore(s => s.config.dimensions);
  const globalMat     = useConfigStore(s => s.config.construction.material);
  const roof          = useConfigStore(s => s.config.roof);
  const { width: W, height: H, depth: D } = dim;

  const wallMat = effectiveMaterial(null, globalMat);
  // UVs in the geometry are already world-units / TILE_SIZE, so repeat stays 1×1
  const meshMat = useSpriteMaterial({ config: wallMat, worldWidth: 1, worldHeight: 1, tileSize: 1, side: THREE.DoubleSide });
  // Geometria ścian + szczytów
  const wallsGeo = useMemo(
    () => buildWallsWithGablesGeometry(dim, roof.slopeType, roof.pitch),
    [dim, roof.slopeType, roof.pitch],
  );
  const floorMat = useSpriteMaterial({ config: { type: 'trapez', color: '#888888' }, worldWidth: W, worldHeight: D, tileSize: 1 });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      {/* Walls + gables as one mesh */}
      <mesh geometry={wallsGeo} castShadow receiveShadow>
        <primitive object={meshMat} attach="material" />
      </mesh>
    </group>
  );
}
