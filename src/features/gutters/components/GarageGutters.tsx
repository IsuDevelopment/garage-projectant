'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '@/store/useConfigStore';
import { ROOF_OVERHANG, pitchToHeight } from '@/features/garage/utils/geometry';

// Rynna / trough dimensions
const TROUGH_W  = 0.12;  // width (perpendicular to wall)
const TROUGH_H  = 0.08;  // height
const PIPE_W    = 0.06;  // downspout cross-section
const PIPE_D    = 0.06;
const PIPE_GAP  = 0.02;  // gap between downspout and wall

/**
 * Computes eave positions for each slope type.
 * Returns an array of eave descriptors: { axis, span, x, z, yEave }
 *   axis  'x' → trough runs along X (front/back eave)
 *   axis  'z' → trough runs along Z (left/right eave)
 *   span        trough length (world units)
 *   x,z         centre of trough in world space
 *   yEave        Y position of eave (bottom of trough)
 */
function getEaves(
  W: number, H: number, D: number,
  slopeType: string, pitchDeg: number,
  drainSide: 'front' | 'back',
): Array<{ axis: 'x' | 'z'; span: number; cx: number; cz: number; yEave: number }> {
  const oh = ROOF_OVERHANG;
  const halfW = W / 2;
  const halfD = D / 2;

  switch (slopeType) {
    case 'double': {
      // Eaves run along Z (left and right sides), water falls left/right
      const eaveLen = D + oh * 2;
      const yEave = H; // eave sits at wall height
      return [
        { axis: 'z', span: eaveLen, cx: -(halfW + oh), cz: 0, yEave },
        { axis: 'z', span: eaveLen, cx:  (halfW + oh), cz: 0, yEave },
      ];
    }
    case 'double-front-back': {
      // Eaves run along X (front and back sides)
      const eaveLen = W + oh * 2;
      const yEave = H;
      return [
        { axis: 'x', span: eaveLen, cx: 0, cz: -(halfD + oh), yEave },
        { axis: 'x', span: eaveLen, cx: 0, cz:  (halfD + oh), yEave },
      ];
    }
    case 'right':
    case 'left': {
      // Single eave on the low side (along Z)
      const roofSpan = W + oh * 2;
      const slopeH   = pitchToHeight(roofSpan, pitchDeg);
      const yLow = H + slopeH * oh / roofSpan;
      const lowX = slopeType === 'right' ? -(halfW + oh) : (halfW + oh);
      const eaveLen = D + oh * 2;
      return [{ axis: 'z', span: eaveLen, cx: lowX, cz: 0, yEave: yLow }];
    }
    case 'front':
    case 'back': {
      // Single eave on the low side (along X)
      const roofSpan = D + oh * 2;
      const slopeH   = pitchToHeight(roofSpan, pitchDeg);
      const yLow = H + slopeH * oh / roofSpan;
      const lowZ = slopeType === 'front' ? -(halfD + oh) : (halfD + oh);
      const eaveLen = W + oh * 2;
      return [{ axis: 'x', span: eaveLen, cx: 0, cz: lowZ, yEave: yLow }];
    }
    default:
      return [];
  }
}

export default function GarageGutters() {
  const dim        = useConfigStore(s => s.config.dimensions);
  const roof       = useConfigStore(s => s.config.roof);
  const gutters    = useConfigStore(s => s.config.gutters);

  const { width: W, height: H, depth: D } = dim;
  const oh = ROOF_OVERHANG;
  const halfW = W / 2;
  const halfD = D / 2;

  const color = useMemo(() => new THREE.Color(gutters.color), [gutters.color]);

  const eaves = useMemo(
    () => getEaves(W, H, D, roof.slopeType, roof.pitch, gutters.drainSide),
    [W, H, D, roof.slopeType, roof.pitch, gutters.drainSide],
  );

  if (!gutters.enabled || eaves.length === 0) return null;

  return (
    <group>
      {eaves.map((eave, i) => {
        const troughLen = eave.span;
        const isAlongZ  = eave.axis === 'z';

        // Trough — sits just below the eave
        const troughY = eave.yEave - TROUGH_H / 2;

        // Downspout(s): placed at front/back corner(s) of each trough depending on drainSide+downspout
        // For each eave we determine which end(s) get a downspout.
        // "end" in eave's own axis direction:
        //   along-Z axis: ends at cz ± span/2  → front (+Z) / back (-Z)
        //   along-X axis: ends at cx ± span/2  → right (+X) / left (-X)

        const halfSpan = troughLen / 2;

        // Compute downspout positions
        const pipes: { x: number; z: number }[] = [];

        if (isAlongZ) {
          // Trough along Z — drain end is +Z (front) or -Z (back)
          const drainZ = gutters.drainSide === 'front'
            ? eave.cz + halfSpan   // front = +Z end of trough
            : eave.cz - halfSpan;  // back  = -Z (but only for drains facing back wall)

          // Left / right refers to X direction at that drain end
          if (gutters.downspout === 'both' || gutters.downspout === 'left') {
            pipes.push({ x: eave.cx, z: drainZ });
          } else {
            pipes.push({ x: eave.cx, z: drainZ });
          }
          // For double eave (both sides), each eave has its own pipe(s)
        } else {
          // Trough along X — drain end is front (+Z) / back (-Z) wall… no, drain on left/right
          // For front-back eaves, drain is at left or right end
          const drainX =
            gutters.downspout === 'both' ? null :
            gutters.downspout === 'left'  ? eave.cx - halfSpan :
                                            eave.cx + halfSpan;

          if (drainX !== null) {
            pipes.push({ x: drainX, z: eave.cz });
          } else {
            pipes.push({ x: eave.cx - halfSpan, z: eave.cz });
            pipes.push({ x: eave.cx + halfSpan, z: eave.cz });
          }
        }

        return (
          <group key={i}>
            {/* Trough */}
            <mesh
              position={[
                eave.cx,
                troughY,
                eave.cz,
              ]}
              castShadow
            >
              <boxGeometry args={isAlongZ
                ? [TROUGH_W, TROUGH_H, troughLen]
                : [troughLen, TROUGH_H, TROUGH_W]
              } />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Downspout pipes */}
            {pipes.map((pipe, j) => {
              const pipeH = troughY; // from ground to trough
              const offsetX = isAlongZ ? (eave.cx > 0 ? PIPE_GAP : -PIPE_GAP) : 0;
              const offsetZ = isAlongZ ? 0 : (eave.cz > 0 ? PIPE_GAP : -PIPE_GAP);
              return (
                <mesh
                  key={j}
                  position={[pipe.x + offsetX, pipeH / 2, pipe.z + offsetZ]}
                  castShadow
                >
                  <boxGeometry args={[PIPE_W, pipeH, PIPE_D]} />
                  <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
