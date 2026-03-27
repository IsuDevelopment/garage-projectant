'use client';

import { useMemo } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { useSpriteMaterial, effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { buildRoofGeometry } from '../utils/geometry';

export default function GarageRoof() {
  const dim         = useConfigStore(s => s.config.dimensions);
  const roof        = useConfigStore(s => s.config.roof);
  const globalMat   = useConfigStore(s => s.config.construction.material);

  const roofMat = effectiveMaterial(roof.material, globalMat);

  const geo = useMemo(
    () => buildRoofGeometry(dim, roof.slopeType, roof.pitch),
    [dim, roof.slopeType, roof.pitch],
  );

  // Compute actual roof slope surface dimensions so texture tiles at the same
  // density as the walls (tileSize=0.5 → 2 tiles/m in both directions).
  // ExtrudeGeometry UV-u runs along the shape perimeter, so we must pass the
  // real slope length rather than the plan-view width.
  const pitchRad = (roof.pitch * Math.PI) / 180;
  const oh = 0.15; // overhang — must match geometry.ts
  const { width: W, depth: D } = dim;

  const slopeWorldWidth = useMemo(() => {
    switch (roof.slopeType) {
      case 'double':
        // two slopes, each of half-span / cos(pitch)
        return ((W / 2 + oh) / Math.cos(pitchRad)) * 2;
      case 'right':
      case 'left':
        return (W + oh * 2) / Math.cos(pitchRad);
      case 'front':
      case 'back':
        return (D + oh * 2) / Math.cos(pitchRad);
      default:
        return W;
    }
  }, [W, D, oh, pitchRad, roof.slopeType]);

  const slopeWorldHeight = (roof.slopeType === 'front' || roof.slopeType === 'back')
    ? W + oh * 2
    : D + oh * 2;

  const material = useSpriteMaterial({
    config: roofMat,
    worldWidth: slopeWorldWidth,
    worldHeight: slopeWorldHeight,
    tileSize: 0.5,
  });

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <primitive object={material} attach="material" />
    </mesh>
  );
}
