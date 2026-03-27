'use client';

import { useMemo } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { useSpriteMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { buildGableGeometry } from '@/features/garage/utils/geometry';

/** Renders garage walls and floor. Each wall is a thin box so corners don't z-fight. */
export default function GarageWalls() {
  const dim           = useConfigStore(s => s.config.dimensions);
  const globalMat     = useConfigStore(s => s.config.construction.material);
  const roof          = useConfigStore(s => s.config.roof);
  const { width: W, height: H, depth: D } = dim;

  // Wall thickness — just enough to avoid z-fighting at corners
  const t = 0.04;

  const wallMat = effectiveMaterial(null, globalMat);

  // UV in gableGeometry is already pre-divided by TILE_SIZE, so tileSize=1 here
  const gableGeo = useMemo(
    () => buildGableGeometry(dim, roof.slopeType, roof.pitch),
    [dim, roof.slopeType, roof.pitch],
  );
  const gableMat = useSpriteMaterial({ config: wallMat, worldWidth: 1, worldHeight: 1, tileSize: 1 });

  const frontMat = useSpriteMaterial({ config: wallMat, worldWidth: W, worldHeight: H });
  const backMat  = useSpriteMaterial({ config: wallMat, worldWidth: W, worldHeight: H });
  const leftMat  = useSpriteMaterial({ config: wallMat, worldWidth: D, worldHeight: H });
  const rightMat = useSpriteMaterial({ config: wallMat, worldWidth: D, worldHeight: H });
  const floorMat = useSpriteMaterial({ config: { type: 'trapez', color: '#888888' }, worldWidth: W, worldHeight: D, tileSize: 1 });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Front wall (Z = +D/2), exterior face flush with +D/2 */}
      <mesh position={[0, H / 2, D / 2 - t / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, t]} />
        <primitive object={frontMat} attach="material" />
      </mesh>

      {/* Back wall, exterior flush with -D/2 */}
      <mesh position={[0, H / 2, -D / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, t]} />
        <primitive object={backMat} attach="material" />
      </mesh>

      {/* Left wall (X = -W/2), inset by t so it doesn't intersect front/back */}
      <mesh position={[-W / 2 + t / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, H, D - t * 2]} />
        <primitive object={leftMat} attach="material" />
      </mesh>

      {/* Right wall (X = +W/2) */}
      <mesh position={[W / 2 - t / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, H, D - t * 2]} />
        <primitive object={rightMat} attach="material" />
      </mesh>

      {/* Gable triangles — rendered with wall material so they match the walls */}
      {gableGeo && (
        <mesh geometry={gableGeo} castShadow receiveShadow>
          <primitive object={gableMat} attach="material" />
        </mesh>
      )}
    </group>
  );
}
