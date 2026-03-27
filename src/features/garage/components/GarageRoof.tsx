'use client';

import { useMemo } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { useSpriteMaterial, effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { buildRoofGeometry } from '../utils/geometry';

export default function GarageRoof() {
  const dim       = useConfigStore(s => s.config.dimensions);
  const roof      = useConfigStore(s => s.config.roof);
  const globalMat = useConfigStore(s => s.config.construction.material);

  const roofMat = effectiveMaterial(roof.material, globalMat);

  const geo = useMemo(
    () => buildRoofGeometry(dim, roof.slopeType, roof.pitch),
    [dim, roof.slopeType, roof.pitch],
  );

  // UV coordinates in geometry.ts are already expressed in world-units / TILE_SIZE,
  // so texture.repeat must stay at 1×1 (no extra scaling here).
  const material = useSpriteMaterial({
    config: roofMat,
    worldWidth: 1,
    worldHeight: 1,
    tileSize: 1,
  });

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <primitive object={material} attach="material" />
    </mesh>
  );
}

