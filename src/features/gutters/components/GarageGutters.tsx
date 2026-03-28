'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '@/store/useConfigStore';
import { ROOF_OVERHANG, pitchToHeight } from '@/features/garage/utils/geometry';

// Trough (rynna dachowa) — half-round concave profile
const OUTER_R  = 0.065;  // outer radius → Ø 13 cm
const WALL_T   = 0.002;  // wall thickness = 0.2 cm
const INNER_R  = OUTER_R - WALL_T;

// Downspout (rura spustowa) — round pipe
const PIPE_R    = 0.03;   // radius → Ø 6 cm
const PIPE_SEG  = 16;
const PIPE_INSET = 0.05;  // inset downspout 5 cm from gutter end
const PIPE_OVERLAP = 0.02; // let pipe slightly intersect the gutter body
const GUTTER_DROP = 0.07; // lower trough 7 cm below eave line
const END_CAP_DEPTH = 0.008;

/**
 * Half-round gutter cross-section profile (opening facing +Y).
 * Outer bottom arc CW (0→π) + inner arc CCW (π→0) = half-ring.
 * Created once at module level — immutable.
 */
const GUTTER_PROFILE: THREE.Shape = (() => {
  const s = new THREE.Shape();
  s.moveTo(OUTER_R, 0);
  s.absarc(0, 0, OUTER_R, 0, Math.PI, true);   // outer arc CW → bottom
  s.lineTo(-INNER_R, 0);
  s.absarc(0, 0, INNER_R, Math.PI, 0, false);  // inner arc CCW → back to right
  s.closePath();
  return s;
})();

const END_CAP_PROFILE: THREE.Shape = (() => {
  const s = new THREE.Shape();
  s.moveTo(OUTER_R, 0);
  s.absarc(0, 0, OUTER_R, 0, Math.PI, true);
  s.lineTo(OUTER_R, 0);
  s.closePath();
  return s;
})();

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
  const dim     = useConfigStore(s => s.config.dimensions);
  const roof    = useConfigStore(s => s.config.roof);
  const gutters = useConfigStore(s => s.config.gutters);

  const { width: W, height: H, depth: D } = dim;

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: new THREE.Color(gutters.color),
      metalness: 0.6,
      roughness: 0.3,
      side: THREE.DoubleSide,
    }),
    [gutters.color],
  );
  useEffect(() => () => { material.dispose(); }, [material]);

  const eaves = useMemo(
    () => getEaves(W, H, D, roof.slopeType, roof.pitch, gutters.drainSide),
    [W, H, D, roof.slopeType, roof.pitch, gutters.drainSide],
  );

  // Build one ExtrudeGeometry per eave — half-round concave trough
  const troughGeoms = useMemo(() => eaves.map(eave => {
    const g = new THREE.ExtrudeGeometry(GUTTER_PROFILE, {
      depth: eave.span,
      bevelEnabled: false,
    });
    g.translate(0, 0, -eave.span / 2);           // centre along extrusion axis (Z)
    if (eave.axis === 'x') g.rotateY(Math.PI / 2); // X-axis troughs: swap extrusion to X
    return g;
  }), [eaves]);
  useEffect(() => () => { troughGeoms.forEach(g => g.dispose()); }, [troughGeoms]);

  const endCapGeom = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(END_CAP_PROFILE, {
      depth: END_CAP_DEPTH,
      bevelEnabled: false,
    });
    g.translate(0, 0, -END_CAP_DEPTH / 2);
    return g;
  }, []);
  useEffect(() => () => { endCapGeom.dispose(); }, [endCapGeom]);

  if (!gutters.enabled || eaves.length === 0) return null;

  return (
    <group>
      {eaves.map((eave, i) => {
        const isAlongZ = eave.axis === 'z';
        const halfSpan = eave.span / 2;
        const troughTopY = eave.yEave - GUTTER_DROP;
        const troughBottomY = troughTopY - OUTER_R;
        const pipeHeight = Math.max(troughBottomY + PIPE_OVERLAP, 0.01);

        // Downspout positions at the drain end(s) of each trough
        const pipes: { x: number; z: number }[] = [];
        if (isAlongZ) {
          const drainZ = gutters.drainSide === 'front'
            ? eave.cz + halfSpan - PIPE_INSET   // +Z end = front face of garage
            : eave.cz - halfSpan + PIPE_INSET;  // -Z end = back face
          pipes.push({ x: eave.cx, z: drainZ });
        } else {
          if (gutters.downspout === 'both') {
            pipes.push({ x: eave.cx - halfSpan + PIPE_INSET, z: eave.cz });
            pipes.push({ x: eave.cx + halfSpan - PIPE_INSET, z: eave.cz });
          } else {
            const drainX = gutters.downspout === 'left'
              ? eave.cx - halfSpan + PIPE_INSET
              : eave.cx + halfSpan - PIPE_INSET;
            pipes.push({ x: drainX, z: eave.cz });
          }
        }

        return (
          <group key={i}>
            {/* Concave half-round trough */}
            <mesh
              geometry={troughGeoms[i]}
              material={material}
              position={[eave.cx, troughTopY, eave.cz]}
              castShadow
            />

            <mesh
              geometry={endCapGeom}
              material={material}
              position={isAlongZ
                ? [eave.cx, troughTopY, eave.cz - halfSpan + END_CAP_DEPTH / 2]
                : [eave.cx - halfSpan + END_CAP_DEPTH / 2, troughTopY, eave.cz]}
              rotation={isAlongZ ? [0, Math.PI, 0] : [0, -Math.PI / 2, 0]}
              castShadow
            />

            <mesh
              geometry={endCapGeom}
              material={material}
              position={isAlongZ
                ? [eave.cx, troughTopY, eave.cz + halfSpan - END_CAP_DEPTH / 2]
                : [eave.cx + halfSpan - END_CAP_DEPTH / 2, troughTopY, eave.cz]}
              rotation={isAlongZ ? [0, 0, 0] : [0, Math.PI / 2, 0]}
              castShadow
            />

            {/* Round downspout pipes */}
            {pipes.map((pipe, j) => (
              <mesh
                key={j}
                material={material}
                position={[pipe.x, pipeHeight / 2, pipe.z]}
                castShadow
              >
                <cylinderGeometry args={[PIPE_R, PIPE_R, pipeHeight, PIPE_SEG]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
