import * as THREE from 'three';
import { GarageDimensions } from '@/store/types';
import { RoofSlopeType } from '@/store/types';

// ─── Roof geometry helpers ────────────────────────────────────────────────────

export interface RoofGeometryResult {
  shape: THREE.Shape;
  /** 3D positions for ExtrudeGeometry cross-section and extrude depth */
  extrudeDepth: number;
  /** absolute peak height above wall top */
  peakHeight: number;
  /** rotation to apply to the extruded mesh (on Y axis) */
  rotation: [number, number, number];
  /** translation to position the mesh relative to garage centre */
  position: [number, number, number];
}

/**
 * Convert pitch in degrees to ridge height above sill for a given half-span.
 */
export function pitchToHeight(halfSpan: number, pitchDeg: number): number {
  return halfSpan * Math.tan((pitchDeg * Math.PI) / 180);
}

/**
 * Build three.js BufferGeometry for the roof based on slope type and dimensions.
 * The garage box sits with its base at Y=0, walls up to Y=wallHeight.
 * The returned geometry is already translated/rotated relative to scene origin (garage centered at 0,0,0).
 */
export function buildRoofGeometry(
  dim: GarageDimensions,
  slopeType: RoofSlopeType,
  pitchDeg: number,
): THREE.BufferGeometry {
  const { width: W, height: H, depth: D } = dim;

  // overhang
  const oh = 0.15;

  switch (slopeType) {
    case 'double':
      return buildDoubleSlopeRoof(W, H, D, pitchDeg, oh);
    case 'right':
      return buildSingleSlopeRoof(W, H, D, pitchDeg, oh, 'right');
    case 'left':
      return buildSingleSlopeRoof(W, H, D, pitchDeg, oh, 'left');
    case 'front':
      return buildSingleSlopeRoof(W, H, D, pitchDeg, oh, 'front');
    case 'back':
      return buildSingleSlopeRoof(W, H, D, pitchDeg, oh, 'back');
    default:
      return buildDoubleSlopeRoof(W, H, D, pitchDeg, oh);
  }
}

// ─── Double slope (gabled) ────────────────────────────────────────────────────
function buildDoubleSlopeRoof(W: number, H: number, D: number, pitchDeg: number, oh: number): THREE.BufferGeometry {
  const ridgeH = pitchToHeight(W / 2, pitchDeg);
  // Cross-section shape (looking from front, Z axis = extrude direction)
  // Points: bottom-left, bottom-right, ridge (centre top)
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 - oh, H);
  shape.lineTo(W / 2 + oh, H);
  shape.lineTo(0, H + ridgeH);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: D + oh * 2,
    bevelEnabled: false,
  });
  // Extrude goes +Z but we want it centred on Z
  geo.translate(0, 0, -D / 2 - oh);
  return geo;
}

// ─── Single slope ─────────────────────────────────────────────────────────────
function buildSingleSlopeRoof(
  W: number,
  H: number,
  D: number,
  pitchDeg: number,
  oh: number,
  direction: 'right' | 'left' | 'front' | 'back',
): THREE.BufferGeometry {
  const isAlongWidth = direction === 'right' || direction === 'left';
  const span = isAlongWidth ? W : D;
  const slopeH = pitchToHeight(span, pitchDeg);

  // Build cross-section in XY, extrude along Z
  const shape = new THREE.Shape();
  const lowY  = H;
  const highY = H + slopeH;
  const halfSpan = span / 2 + oh;
  const extrudeDepth = isAlongWidth ? D + oh * 2 : W + oh * 2;

  if (direction === 'right') {
    shape.moveTo(-halfSpan, lowY);
    shape.lineTo(halfSpan, highY);
    shape.lineTo(halfSpan, H);
    shape.lineTo(-halfSpan, H);
    shape.closePath();
  } else if (direction === 'left') {
    shape.moveTo(-halfSpan, highY);
    shape.lineTo(halfSpan, lowY);
    shape.lineTo(halfSpan, H);
    shape.lineTo(-halfSpan, H);
    shape.closePath();
  } else {
    // front / back — same cross-section, extruded along X
    shape.moveTo(-halfSpan, H);
    shape.lineTo(halfSpan, H);
    if (direction === 'front') {
      shape.lineTo(halfSpan, H);
      shape.lineTo(halfSpan, highY);
      shape.lineTo(-halfSpan, H);
    } else {
      shape.lineTo(-halfSpan, highY);
    }
    shape.closePath();
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: false,
  });

  if (isAlongWidth) {
    geo.translate(0, 0, -D / 2 - oh);
  } else {
    // Rotate 90° around Y so it runs along depth axis
    geo.rotateY(Math.PI / 2);
    geo.translate(0, 0, 0);
    // After rotation, extrude was along Z → now along X; re-centre
    geo.translate(0, 0, 0);
    // Manual rotation approach: rebuild for front/back using Z direction
    // Actually rebuild properly: extrude along X
    return buildFrontBackSlope(W, H, D, pitchDeg, oh, direction as 'front' | 'back');
  }

  return geo;
}

function buildFrontBackSlope(
  W: number,
  H: number,
  D: number,
  pitchDeg: number,
  oh: number,
  direction: 'front' | 'back',
): THREE.BufferGeometry {
  const slopeH = pitchToHeight(D, pitchDeg);
  // Cross-section in ZY, extrude along X
  const shape = new THREE.Shape();
  const halfD = D / 2 + oh;
  const halfW = W / 2 + oh;

  if (direction === 'back') {
    shape.moveTo(-halfD, H);
    shape.lineTo(halfD, H + slopeH);
    shape.lineTo(halfD, H);
    shape.closePath();
  } else {
    shape.moveTo(-halfD, H + slopeH);
    shape.lineTo(halfD, H);
    shape.lineTo(-halfD, H);
    shape.closePath();
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: W + oh * 2,
    bevelEnabled: false,
  });
  // Rotate so extrude axis (Z) aligns with X
  geo.rotateY(-Math.PI / 2);
  geo.translate(halfW - oh, 0, 0);
  return geo;
}

// ─── UV helpers for sprite tiling ────────────────────────────────────────────

/** Set UV repeat on a texture so it tiles at approx 1 tile per `tileSize` world units */
export function setTextureRepeat(
  texture: THREE.Texture,
  worldW: number,
  worldH: number,
  tileSize = 0.5,
): void {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(worldW / tileSize, worldH / tileSize);
  texture.needsUpdate = true;
}
