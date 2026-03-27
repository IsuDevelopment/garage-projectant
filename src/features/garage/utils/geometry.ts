import * as THREE from 'three';
import { GarageDimensions, RoofSlopeType } from '@/store/types';

export const ROOF_OVERHANG = 0.15;
/** Tile size in world units — must match the value used in useSpriteMaterial */
export const TILE_SIZE = 0.5;

export function pitchToHeight(halfSpan: number, pitchDeg: number): number {
  return halfSpan * Math.tan((pitchDeg * Math.PI) / 180);
}

/**
 * Build a BufferGeometry for the roof with hand-crafted UV coordinates so that
 * the texture tiles at exactly TILE_SIZE world-units per repeat, matching the walls.
 *
 * UV layout: U runs along the ridge direction (depth or width), V runs down the slope.
 * This means prążki (stripes) are always perpendicular to the ridge — as on a real
 * corrugated-steel roof.
 *
 * All positions are in world space with the garage centred at origin (Y=0 = ground).
 */
export function buildRoofGeometry(
  dim: GarageDimensions,
  slopeType: RoofSlopeType,
  pitchDeg: number,
): THREE.BufferGeometry {
  const { width: W, height: H, depth: D } = dim;
  const oh = ROOF_OVERHANG;

  switch (slopeType) {
    case 'double': return buildDouble(W, H, D, pitchDeg, oh);
    case 'right':  return buildSingle(W, H, D, pitchDeg, oh, 'right');
    case 'left':   return buildSingle(W, H, D, pitchDeg, oh, 'left');
    case 'front':  return buildSingle(W, H, D, pitchDeg, oh, 'front');
    case 'back':   return buildSingle(W, H, D, pitchDeg, oh, 'back');
    default:       return buildDouble(W, H, D, pitchDeg, oh);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Merge multiple BufferGeometries into one */
function merge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[]       = [];
  const normals: number[]   = [];
  const indices: number[]   = [];
  let base = 0;

  for (const g of geos) {
    const pos = g.attributes.position;
    const uv  = g.attributes.uv;
    const nor = g.attributes.normal;
    const idx = g.index;

    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
      normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + base);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + base);
    }
    base += pos.count;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  out.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  out.setIndex(indices);
  return out;
}

/**
 * Build a single quad (two triangles) with explicit UV.
 * verts: [v0, v1, v2, v3] in CCW order for the front face.
 * uv:    matching [u0,v0, u1,v1, u2,v2, u3,v3]
 * normal: face normal
 */
function quad(
  verts: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3],
  uvCoords: [number, number, number, number, number, number, number, number],
  normal: THREE.Vector3,
): THREE.BufferGeometry {
  const [v0, v1, v2, v3] = verts;
  const [u0, t0, u1, t1, u2, t2, u3, t3] = uvCoords;
  const nx = normal.x, ny = normal.y, nz = normal.z;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    v0.x, v0.y, v0.z,
    v1.x, v1.y, v1.z,
    v2.x, v2.y, v2.z,
    v3.x, v3.y, v3.z,
  ], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([
    u0, t0, u1, t1, u2, t2, u3, t3,
  ], 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute([
    nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz,
  ], 3));
  geo.setIndex([0, 2, 1, 0, 3, 2]);
  return geo;
}

// ─── UV helper ────────────────────────────────────────────────────────────────

/** Convert a world distance to a UV coordinate based on TILE_SIZE */
function uv(worldDist: number): number {
  return worldDist / TILE_SIZE;
}

// ─── Roof types ───────────────────────────────────────────────────────────────

function buildDouble(W: number, H: number, D: number, pitchDeg: number, oh: number): THREE.BufferGeometry {
  const ridgeH   = pitchToHeight(W / 2, pitchDeg);
  const halfW    = W / 2 + oh;
  const halfD    = D / 2 + oh;
  const slopeLen = Math.sqrt((W / 2 + oh) ** 2 + ridgeH ** 2); // actual surface length of each slope

  // Ridge Y
  const ridgeY = H + ridgeH;

  // Left slope: ridge (X=0) → left eave (X=-halfW)
  // U axis: along depth (Z), V axis: down the slope
  const leftSlope = quad(
    [
      new THREE.Vector3( 0,      ridgeY, -halfD),
      new THREE.Vector3( 0,      ridgeY,  halfD),
      new THREE.Vector3(-halfW,  H,       halfD),
      new THREE.Vector3(-halfW,  H,      -halfD),
    ],
    [uv(0), uv(0),  uv(D + oh*2), uv(0),  uv(D + oh*2), uv(slopeLen),  uv(0), uv(slopeLen)],
    new THREE.Vector3(-ridgeH, W/2 + oh, 0).normalize(),
  );

  // Right slope: ridge (X=0) → right eave (X=+halfW)
  const rightSlope = quad(
    [
      new THREE.Vector3(halfW,  H,      -halfD),
      new THREE.Vector3(halfW,  H,       halfD),
      new THREE.Vector3(0,      ridgeY,  halfD),
      new THREE.Vector3(0,      ridgeY, -halfD),
    ],
    [uv(0), uv(slopeLen),  uv(D + oh*2), uv(slopeLen),  uv(D + oh*2), uv(0),  uv(0), uv(0)],
    new THREE.Vector3(ridgeH, W/2 + oh, 0).normalize(),
  );

  return merge([leftSlope, rightSlope]);
}

function gableTriangle(W: number, H: number, ridgeH: number, oh: number, z: number, dir: number): THREE.BufferGeometry {
  const halfW = W / 2 + oh;
  // Three vertices: left-eave, right-eave, ridge
  const v0 = new THREE.Vector3(-halfW, H, z);
  const v1 = new THREE.Vector3( halfW, H, z);
  const v2 = new THREE.Vector3(0,     H + ridgeH, z);
  const normal = new THREE.Vector3(0, 0, dir);

  const geo = new THREE.BufferGeometry();
  const verts = dir > 0
    ? [v0, v1, v2]
    : [v1, v0, v2];

  geo.setAttribute('position', new THREE.Float32BufferAttribute(
    verts.flatMap(v => [v.x, v.y, v.z]), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([
    uv(0), uv(0),
    uv(W + oh*2), uv(0),
    uv((W + oh*2)/2), uv(ridgeH),
  ], 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(
    [normal.x, normal.y, normal.z,  normal.x, normal.y, normal.z,  normal.x, normal.y, normal.z], 3));
  geo.setIndex([0, 1, 2]);
  return geo;
}

function buildSingle(
  W: number, H: number, D: number,
  pitchDeg: number, oh: number,
  dir: 'right' | 'left' | 'front' | 'back',
): THREE.BufferGeometry {
  const isWidth = dir === 'right' || dir === 'left';
  const span    = isWidth ? (W + oh * 2) : (D + oh * 2);
  const ext     = isWidth ? (D + oh * 2) : (W + oh * 2);
  const slopeH  = pitchToHeight(span, pitchDeg);
  const slopeLen = Math.sqrt(span ** 2 + slopeH ** 2);

  // Vertex order is chosen so that quad() indices [0,2,1, 0,3,2] produce
  // a CCW winding with the outward normal pointing UP from the roof surface.
  // U: along the ext direction, V: along the slope (0 = high edge, slopeLen = eave)
  let v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3;
  let normal: THREE.Vector3;
  let uvs: [number, number, number, number, number, number, number, number];

  const hE = ext / 2;
  const hS = span / 2;

  switch (dir) {
    case 'right': // high on right (+X), low on left (-X)
      // Outward normal: (-slopeH, +span, 0) — up and slightly left
      v0 = new THREE.Vector3(-hS, H,           hE);
      v1 = new THREE.Vector3(-hS, H,          -hE);
      v2 = new THREE.Vector3( hS, H + slopeH, -hE);
      v3 = new THREE.Vector3( hS, H + slopeH,  hE);
      normal = new THREE.Vector3(-slopeH, span, 0).normalize();
      uvs = [uv(0), uv(slopeLen), uv(ext), uv(slopeLen), uv(ext), uv(0), uv(0), uv(0)];
      break;
    case 'left': // high on left (-X), low on right (+X)
      // Outward normal: (+slopeH, +span, 0) — up and slightly right
      v0 = new THREE.Vector3(-hS, H + slopeH,  hE);
      v1 = new THREE.Vector3(-hS, H + slopeH, -hE);
      v2 = new THREE.Vector3( hS, H,          -hE);
      v3 = new THREE.Vector3( hS, H,           hE);
      normal = new THREE.Vector3(slopeH, span, 0).normalize();
      uvs = [uv(0), uv(0), uv(ext), uv(0), uv(ext), uv(slopeLen), uv(0), uv(slopeLen)];
      break;
    case 'back': // high at back (-Z), low at front (+Z)
      // Outward normal: (0, +span, +slopeH) — up and slightly front
      v0 = new THREE.Vector3( hE, H,            hS);
      v1 = new THREE.Vector3(-hE, H,            hS);
      v2 = new THREE.Vector3(-hE, H + slopeH,  -hS);
      v3 = new THREE.Vector3( hE, H + slopeH,  -hS);
      normal = new THREE.Vector3(0, span, slopeH).normalize();
      uvs = [uv(0), uv(slopeLen), uv(ext), uv(slopeLen), uv(ext), uv(0), uv(0), uv(0)];
      break;
    case 'front': // high at front (+Z), low at back (-Z)
    default:
      // Outward normal: (0, +span, -slopeH) — up and slightly back
      v0 = new THREE.Vector3( hE, H + slopeH,  hS);
      v1 = new THREE.Vector3(-hE, H + slopeH,  hS);
      v2 = new THREE.Vector3(-hE, H,           -hS);
      v3 = new THREE.Vector3( hE, H,           -hS);
      normal = new THREE.Vector3(0, span, -slopeH).normalize();
      uvs = [uv(0), uv(0), uv(ext), uv(0), uv(ext), uv(slopeLen), uv(0), uv(slopeLen)];
      break;
  }

  return quad([v0, v1, v2, v3], uvs, normal);
}

/**
 * Build the triangular end-fills for any roof type.
 * These sit above the rectangular walls and should be rendered with wall material.
 * Returns null when no end-fill triangles are needed (flat roof).
 */
export function buildGableGeometry(
  dim: GarageDimensions,
  slopeType: RoofSlopeType,
  pitchDeg: number,
): THREE.BufferGeometry | null {
  const { width: W, height: H, depth: D } = dim;
  const oh = ROOF_OVERHANG;

  switch (slopeType) {
    case 'double': {
      const ridgeH = pitchToHeight(W / 2, pitchDeg);
      const halfD  = D / 2 + oh;
      return merge([
        gableTriangle(W, H, ridgeH, oh, halfD, 1),
        gableTriangle(W, H, ridgeH, oh, -halfD, -1),
      ]);
    }
    case 'right':
    case 'left': {
      // Single slope along X — triangular ends on front (Z=+halfD) and back (Z=-halfD)
      const span   = W + oh * 2;
      const slopeH = pitchToHeight(span, pitchDeg);
      const halfD  = D / 2 + oh;
      const halfW  = W / 2 + oh;
      // For 'right': low at X=-halfW, high at X=+halfW
      // For 'left':  low at X=+halfW, high at X=-halfW
      const lowX  = slopeType === 'right' ? -halfW :  halfW;
      const highX = slopeType === 'right' ?  halfW : -halfW;

      const endTriangle = (z: number, normalDir: number): THREE.BufferGeometry => {
        const vLow  = new THREE.Vector3(lowX,  H,          z);
        const vHigh = new THREE.Vector3(highX, H + slopeH, z);
        const vBase = new THREE.Vector3(highX, H,          z);
        const normal = new THREE.Vector3(0, 0, normalDir);
        const geo = new THREE.BufferGeometry();
        const verts = normalDir > 0 ? [vLow, vBase, vHigh] : [vBase, vLow, vHigh];
        geo.setAttribute('position', new THREE.Float32BufferAttribute(
          verts.flatMap(v => [v.x, v.y, v.z]), 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([
          uv(0), uv(0),
          uv(span), uv(0),
          uv(span), uv(slopeH),
        ], 2));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(
          [normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z], 3));
        geo.setIndex([0, 1, 2]);
        return geo;
      };

      return merge([endTriangle(halfD, 1), endTriangle(-halfD, -1)]);
    }
    case 'front':
    case 'back': {
      // Single slope along Z — triangular ends on left (X=-halfW) and right (X=+halfW)
      const span   = D + oh * 2;
      const slopeH = pitchToHeight(span, pitchDeg);
      const halfW  = W / 2 + oh;
      const halfD  = D / 2 + oh;
      // For 'front': high at Z=+halfD, low at Z=-halfD
      // For 'back':  high at Z=-halfD, low at Z=+halfD
      const lowZ  = slopeType === 'front' ? -halfD :  halfD;
      const highZ = slopeType === 'front' ?  halfD : -halfD;

      const endTriangle = (x: number, normalDir: number): THREE.BufferGeometry => {
        const vLow  = new THREE.Vector3(x, H,          lowZ);
        const vHigh = new THREE.Vector3(x, H + slopeH, highZ);
        const vBase = new THREE.Vector3(x, H,          highZ);
        const normal = new THREE.Vector3(normalDir, 0, 0);
        const geo = new THREE.BufferGeometry();
        const verts = normalDir > 0 ? [vBase, vLow, vHigh] : [vLow, vBase, vHigh];
        geo.setAttribute('position', new THREE.Float32BufferAttribute(
          verts.flatMap(v => [v.x, v.y, v.z]), 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([
          uv(0), uv(0),
          uv(span), uv(0),
          uv(span), uv(slopeH),
        ], 2));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(
          [normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z], 3));
        geo.setIndex([0, 1, 2]);
        return geo;
      };

      return merge([endTriangle(-halfW, -1), endTriangle(halfW, 1)]);
    }
    default:
      return null;
  }
}

/** Set UV repeat on a texture so it tiles at approx 1 tile per `tileSize` world units */
export function setTextureRepeat(
  texture: THREE.Texture,
  worldW: number,
  worldH: number,
  tileSize = TILE_SIZE,
): void {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(worldW / tileSize, worldH / tileSize);
  texture.needsUpdate = true;
}
