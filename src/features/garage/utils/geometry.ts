/**
 * Build a single BufferGeometry for all garage walls (front, back, left, right) and gables.
 * All walls are hand-crafted quads with UV that continues seamlessly into gable fills.
 *
 * UV convention (must match wallQuad / wallTriangle helpers):
 *  - front/back walls: U = 0 at X = -halfW, increases toward +X
 *  - left/right walls: U = 0 at Z = -halfD, increases toward +Z
 */
export function buildWallsWithGablesGeometry(
  dim: GarageDimensions,
  slopeType: RoofSlopeType,
  pitchDeg: number,
): THREE.BufferGeometry {
  const { width: W, height: H, depth: D } = dim;
  const halfW = W / 2;
  const halfD = D / 2;
  const oh = ROOF_OVERHANG;

  // Front wall (Z = +halfD) — U: left(-halfW)→0, right(+halfW)→uv(W)
  const frontRect = quad(
    [
      new THREE.Vector3(-halfW, 0, halfD),
      new THREE.Vector3( halfW, 0, halfD),
      new THREE.Vector3( halfW, H, halfD),
      new THREE.Vector3(-halfW, H, halfD),
    ],
    [uv(0), uv(0), uv(W), uv(0), uv(W), uv(H), uv(0), uv(H)],
    new THREE.Vector3(0, 0, 1),
  );

  // Back wall (Z = -halfD) — same U convention: left(-halfW)→0, right(+halfW)→uv(W)
  const backRect = quad(
    [
      new THREE.Vector3(-halfW, 0, -halfD),
      new THREE.Vector3( halfW, 0, -halfD),
      new THREE.Vector3( halfW, H, -halfD),
      new THREE.Vector3(-halfW, H, -halfD),
    ],
    [uv(0), uv(0), uv(W), uv(0), uv(W), uv(H), uv(0), uv(H)],
    new THREE.Vector3(0, 0, -1),
  );

  // Left wall (X = -halfW) — U: back(-halfD)→0, front(+halfD)→uv(D)
  const leftRect = quad(
    [
      new THREE.Vector3(-halfW, 0, -halfD),
      new THREE.Vector3(-halfW, 0,  halfD),
      new THREE.Vector3(-halfW, H,  halfD),
      new THREE.Vector3(-halfW, H, -halfD),
    ],
    [uv(0), uv(0), uv(D), uv(0), uv(D), uv(H), uv(0), uv(H)],
    new THREE.Vector3(-1, 0, 0),
  );

  // Right wall (X = +halfW) — U: back(-halfD)→0, front(+halfD)→uv(D)
  const rightRect = quad(
    [
      new THREE.Vector3(halfW, 0, -halfD),
      new THREE.Vector3(halfW, 0,  halfD),
      new THREE.Vector3(halfW, H,  halfD),
      new THREE.Vector3(halfW, H, -halfD),
    ],
    [uv(0), uv(0), uv(D), uv(0), uv(D), uv(H), uv(0), uv(H)],
    new THREE.Vector3(1, 0, 0),
  );

  // Gable fills — placed above H, UV continues from the rect tops
  const fills: THREE.BufferGeometry[] = [];

  switch (slopeType) {
    case 'double': {
      // Triangular gables on front (+Z) and back (-Z)
      const ridgeH = pitchToHeight(W / 2, pitchDeg);
      fills.push(wallTriangle([-halfW, H], [ halfW, H], [0, H + ridgeH], 'z',  halfD,  1));
      fills.push(wallTriangle([-halfW, H], [ halfW, H], [0, H + ridgeH], 'z', -halfD, -1));
      break;
    }
    case 'double-front-back': {
      // Triangular gables on left (-X) and right (+X)
      const ridgeH = pitchToHeight(D / 2, pitchDeg);
      fills.push(wallTriangle([-halfD, H], [halfD, H], [0, H + ridgeH], 'x', -halfW, -1));
      fills.push(wallTriangle([-halfD, H], [halfD, H], [0, H + ridgeH], 'x',  halfW,  1));
      break;
    }
    case 'right':
    case 'left': {
      const roofSpan   = W + oh * 2;
      const slopeH     = pitchToHeight(roofSpan, pitchDeg);
      const yLowWall   = H + slopeH * oh / roofSpan;
      const yHighWall  = H + slopeH * (W + oh) / roofSpan;
      const yLeft  = slopeType === 'right' ? yLowWall  : yHighWall;
      const yRight = slopeType === 'right' ? yHighWall : yLowWall;

      // Trapezoid fills on front (+Z) and back (-Z)
      fills.push(wallQuad([-halfW, H], [ halfW, H], [ halfW, yRight], [-halfW, yLeft],  'z',  halfD,  1));
      fills.push(wallQuad([-halfW, H], [ halfW, H], [ halfW, yRight], [-halfW, yLeft],  'z', -halfD, -1));

      // Rectangle fill on the high-side X-wall
      const highX   = slopeType === 'right' ?  halfW : -halfW;
      const highDir = slopeType === 'right' ?  1     : -1;
      const highY   = slopeType === 'right' ? yRight : yLeft;
      fills.push(wallQuad([-halfD, H], [halfD, H], [halfD, highY], [-halfD, highY], 'x', highX, highDir));
      break;
    }
    case 'front':
    case 'back': {
      const roofSpan  = D + oh * 2;
      const slopeH    = pitchToHeight(roofSpan, pitchDeg);
      const yLowWall  = H + slopeH * oh / roofSpan;
      const yHighWall = H + slopeH * (D + oh) / roofSpan;
      const yFront = slopeType === 'front' ? yHighWall : yLowWall;
      const yBack  = slopeType === 'front' ? yLowWall  : yHighWall;

      // Trapezoid fills on left (-X) and right (+X)
      fills.push(wallQuad([-halfD, H], [halfD, H], [halfD, yFront], [-halfD, yBack], 'x', -halfW, -1));
      fills.push(wallQuad([-halfD, H], [halfD, H], [halfD, yFront], [-halfD, yBack], 'x',  halfW,  1));

      // Rectangle fill on the high-side Z-wall
      const highZ   = slopeType === 'front' ?  halfD : -halfD;
      const highDir = slopeType === 'front' ?  1     : -1;
      const highY   = slopeType === 'front' ? yFront : yBack;
      fills.push(wallQuad([-halfW, H], [halfW, H], [halfW, highY], [-halfW, highY], 'z', highZ, highDir));
      break;
    }
  }

  return merge([frontRect, backRect, leftRect, rightRect, ...fills]);
}
import * as THREE from 'three';
import { GarageDimensions, RoofSlopeType } from '@/store/types';

export const ROOF_OVERHANG = 0.15;
/** Roof slab thickness in world units */
export const ROOF_THICKNESS = 0.04;
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
    case 'double-front-back': return buildDoubleFrontBack(W, H, D, pitchDeg, oh);
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

/**
 * Build a thick slab from 4 top-face corners and a thickness vector (normal direction * t).
 * Returns top face, bottom face, and 4 edge quads — fully closed box.
 * top[0..3] must be in winding order for outward-facing top.
 * offsetVec points from top to bottom (downward into the roof).
 */
function slab(
  top: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3],
  topUVs: [number, number, number, number, number, number, number, number],
  topNormal: THREE.Vector3,
  offsetVec: THREE.Vector3,
): THREE.BufferGeometry {
  const [t0, t1, t2, t3] = top;
  const bot: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = [
    t0.clone().add(offsetVec),
    t1.clone().add(offsetVec),
    t2.clone().add(offsetVec),
    t3.clone().add(offsetVec),
  ];

  const botNormal = topNormal.clone().negate();
  // Bottom face: reverse winding
  const botUVs = topUVs; // UV doesn't matter much for unseen bottom

  const topFace = quad(top, topUVs, topNormal);
  const botFace = quad([bot[1], bot[0], bot[3], bot[2]], botUVs, botNormal);

  // Edge strips (4 sides of the slab)
  // Each edge connects top[i]→top[i+1] to bot[i]→bot[i+1]
  const edges: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const edgeLen = top[i].distanceTo(top[j]);
    const t = ROOF_THICKNESS;

    // Edge normal: cross product of edge direction with offset direction
    const edgeDir = new THREE.Vector3().subVectors(top[j], top[i]).normalize();
    const edgeNormal = new THREE.Vector3().crossVectors(edgeDir, offsetVec).normalize();

    edges.push(quad(
      [top[i], top[j], bot[j], bot[i]],
      [uv(0), uv(0), uv(edgeLen), uv(0), uv(edgeLen), uv(t), uv(0), uv(t)],
      edgeNormal,
    ));
  }

  return merge([topFace, botFace, ...edges]);
}

// ─── Roof types ───────────────────────────────────────────────────────────────

function buildDouble(W: number, H: number, D: number, pitchDeg: number, oh: number): THREE.BufferGeometry {
  const ridgeH   = pitchToHeight(W / 2, pitchDeg);
  const halfW    = W / 2 + oh;
  const halfD    = D / 2 + oh;
  const slopeLen = Math.sqrt((W / 2 + oh) ** 2 + ridgeH ** 2);
  const ridgeY = H + ridgeH;
  const t = ROOF_THICKNESS;

  // Left slope normal (outward)
  const leftN = new THREE.Vector3(-ridgeH, W/2 + oh, 0).normalize();
  const leftOff = leftN.clone().multiplyScalar(-t);
  const leftSlope = slab(
    [
      new THREE.Vector3( 0,      ridgeY, -halfD),
      new THREE.Vector3( 0,      ridgeY,  halfD),
      new THREE.Vector3(-halfW,  H,       halfD),
      new THREE.Vector3(-halfW,  H,      -halfD),
    ],
    [uv(0), uv(0),  uv(D + oh*2), uv(0),  uv(D + oh*2), uv(slopeLen),  uv(0), uv(slopeLen)],
    leftN,
    leftOff,
  );

  const rightN = new THREE.Vector3(ridgeH, W/2 + oh, 0).normalize();
  const rightOff = rightN.clone().multiplyScalar(-t);
  const rightSlope = slab(
    [
      new THREE.Vector3(halfW,  H,      -halfD),
      new THREE.Vector3(halfW,  H,       halfD),
      new THREE.Vector3(0,      ridgeY,  halfD),
      new THREE.Vector3(0,      ridgeY, -halfD),
    ],
    [uv(0), uv(slopeLen),  uv(D + oh*2), uv(slopeLen),  uv(D + oh*2), uv(0),  uv(0), uv(0)],
    rightN,
    rightOff,
  );

  return merge([leftSlope, rightSlope]);
}

function buildDoubleFrontBack(W: number, H: number, D: number, pitchDeg: number, oh: number): THREE.BufferGeometry {
  const ridgeH   = pitchToHeight(D / 2, pitchDeg);
  const halfW    = W / 2 + oh;
  const halfD    = D / 2 + oh;
  const slopeLen = Math.sqrt((D / 2 + oh) ** 2 + ridgeH ** 2);
  const ridgeY = H + ridgeH;
  const t = ROOF_THICKNESS;

  const frontN = new THREE.Vector3(0, D / 2 + oh, ridgeH).normalize();
  const frontOff = frontN.clone().multiplyScalar(-t);
  const frontSlope = slab(
    [
      new THREE.Vector3(-halfW, H,      halfD),
      new THREE.Vector3( halfW, H,      halfD),
      new THREE.Vector3( halfW, ridgeY, 0),
      new THREE.Vector3(-halfW, ridgeY, 0),
    ],
    [uv(0), uv(slopeLen),  uv(W + oh * 2), uv(slopeLen),  uv(W + oh * 2), uv(0),  uv(0), uv(0)],
    frontN,
    frontOff,
  );

  const backN = new THREE.Vector3(0, D / 2 + oh, -ridgeH).normalize();
  const backOff = backN.clone().multiplyScalar(-t);
  const backSlope = slab(
    [
      new THREE.Vector3(-halfW, ridgeY, 0),
      new THREE.Vector3( halfW, ridgeY, 0),
      new THREE.Vector3( halfW, H,     -halfD),
      new THREE.Vector3(-halfW, H,     -halfD),
    ],
    [uv(0), uv(0),  uv(W + oh * 2), uv(0),  uv(W + oh * 2), uv(slopeLen),  uv(0), uv(slopeLen)],
    backN,
    backOff,
  );

  return merge([frontSlope, backSlope]);
}


function buildSingle(
  W: number, H: number, D: number,
  pitchDeg: number, oh: number,
  dir: 'right' | 'left' | 'front' | 'back',
): THREE.BufferGeometry {
  const isWidth = dir === 'right' || dir === 'left';
  const wallSpan = isWidth ? W : D;
  const roofSpan = wallSpan + oh * 2;
  const roofExt  = (isWidth ? D : W) + oh * 2;
  const slopeH   = pitchToHeight(roofSpan, pitchDeg);
  const slopeLen = Math.sqrt(roofSpan ** 2 + slopeH ** 2);
  const t = ROOF_THICKNESS;

  let top: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  let normal: THREE.Vector3;
  let uvs: [number, number, number, number, number, number, number, number];

  const hE = roofExt / 2;
  const hS = roofSpan / 2;

  switch (dir) {
    case 'right':
      top = [
        new THREE.Vector3(-hS, H,           hE),
        new THREE.Vector3(-hS, H,          -hE),
        new THREE.Vector3( hS, H + slopeH, -hE),
        new THREE.Vector3( hS, H + slopeH,  hE),
      ];
      normal = new THREE.Vector3(-slopeH, roofSpan, 0).normalize();
      uvs = [uv(0), uv(slopeLen), uv(roofExt), uv(slopeLen), uv(roofExt), uv(0), uv(0), uv(0)];
      break;
    case 'left':
      top = [
        new THREE.Vector3(-hS, H + slopeH,  hE),
        new THREE.Vector3(-hS, H + slopeH, -hE),
        new THREE.Vector3( hS, H,          -hE),
        new THREE.Vector3( hS, H,           hE),
      ];
      normal = new THREE.Vector3(slopeH, roofSpan, 0).normalize();
      uvs = [uv(0), uv(0), uv(roofExt), uv(0), uv(roofExt), uv(slopeLen), uv(0), uv(slopeLen)];
      break;
    case 'back':
      top = [
        new THREE.Vector3( hE, H,            hS),
        new THREE.Vector3(-hE, H,            hS),
        new THREE.Vector3(-hE, H + slopeH,  -hS),
        new THREE.Vector3( hE, H + slopeH,  -hS),
      ];
      normal = new THREE.Vector3(0, roofSpan, slopeH).normalize();
      uvs = [uv(0), uv(slopeLen), uv(roofExt), uv(slopeLen), uv(roofExt), uv(0), uv(0), uv(0)];
      break;
    case 'front':
    default:
      top = [
        new THREE.Vector3( hE, H + slopeH,  hS),
        new THREE.Vector3(-hE, H + slopeH,  hS),
        new THREE.Vector3(-hE, H,           -hS),
        new THREE.Vector3( hE, H,           -hS),
      ];
      normal = new THREE.Vector3(0, roofSpan, -slopeH).normalize();
      uvs = [uv(0), uv(0), uv(roofExt), uv(0), uv(roofExt), uv(slopeLen), uv(0), uv(slopeLen)];
      break;
  }

  const offsetVec = normal.clone().multiplyScalar(-t);
  return slab(top, uvs, normal, offsetVec);
}

/**
 * Build triangular wall-fills above the rectangular walls up to the roof line.
 * These are flush with the wall surface (no overhang) and use wall material.
 * The roof surface overhangs past these triangles.
 */
export function buildGableGeometry(
  dim: GarageDimensions,
  slopeType: RoofSlopeType,
  pitchDeg: number,
): THREE.BufferGeometry | null {
  const { width: W, height: H, depth: D } = dim;
  const halfW = W / 2;
  const halfD = D / 2;

  switch (slopeType) {
    case 'double': {
      // Triangular gables on front (Z=+D/2) and back (Z=-D/2)
      const ridgeH = pitchToHeight(W / 2, pitchDeg);
      return merge([
        wallTriangle(
          [-halfW, H], [halfW, H], [0, H + ridgeH],
          'z', halfD,  1,
        ),
        wallTriangle(
          [halfW, H], [-halfW, H], [0, H + ridgeH],
          'z', -halfD, -1,
        ),
      ]);
    }
    case 'double-front-back': {
      // Triangular gables on left (X=-W/2) and right (X=+W/2)
      const ridgeH = pitchToHeight(D / 2, pitchDeg);
      return merge([
        wallTriangle(
          [-halfD, H], [halfD, H], [0, H + ridgeH],
          'x', -halfW, -1,
        ),
        wallTriangle(
          [halfD, H], [-halfD, H], [0, H + ridgeH],
          'x', halfW, 1,
        ),
      ]);
    }
    case 'right':
    case 'left': {
      const oh = ROOF_OVERHANG;
      const roofSpan = W + oh * 2;
      const slopeH = pitchToHeight(roofSpan, pitchDeg);
      // Y of roof surface at the wall boundary on each side
      const yLowWall  = H + slopeH * oh / roofSpan;           // at low-eave wall edge
      const yHighWall = H + slopeH * (W + oh) / roofSpan;     // at high-eave wall edge

      const leftX  = -halfW;
      const rightX =  halfW;
      // For 'right': +X is high, for 'left': -X is high
      const yLeft  = slopeType === 'right' ? yLowWall  : yHighWall;
      const yRight = slopeType === 'right' ? yHighWall : yLowWall;

      // Front and back wall fills: trapezoids on Z-planes
      const frontBack = merge([
        wallQuad([leftX, H], [rightX, H], [rightX, yRight], [leftX, yLeft], 'z', halfD, 1),
        wallQuad([rightX, H], [leftX, H], [leftX, yLeft], [rightX, yRight], 'z', -halfD, -1),
      ]);

      // High-side wall fill: rectangle on the X-plane at the high end
      const highX    = slopeType === 'right' ?  halfW : -halfW;
      const highDir  = slopeType === 'right' ?  1     : -1;
      const highY    = slopeType === 'right' ? yRight : yLeft;
      const highWall = wallQuad(
        [-halfD, H], [halfD, H], [halfD, highY], [-halfD, highY],
        'x', highX, highDir,
      );

      return merge([frontBack, highWall]);
    }
    case 'front':
    case 'back': {
      const oh = ROOF_OVERHANG;
      const roofSpan = D + oh * 2;
      const slopeH = pitchToHeight(roofSpan, pitchDeg);
      const yLowWall  = H + slopeH * oh / roofSpan;
      const yHighWall = H + slopeH * (D + oh) / roofSpan;

      const frontZ =  halfD;
      const backZ  = -halfD;
      // For 'front': +Z is high, for 'back': -Z is high
      const yFront = slopeType === 'front' ? yHighWall : yLowWall;
      const yBack  = slopeType === 'front' ? yLowWall  : yHighWall;

      // Left and right wall fills: trapezoids on X-planes
      const leftRight = merge([
        wallQuad([backZ, H], [frontZ, H], [frontZ, yFront], [backZ, yBack], 'x', -halfW, -1),
        wallQuad([frontZ, H], [backZ, H], [backZ, yBack], [frontZ, yFront], 'x', halfW, 1),
      ]);

      // High-side wall fill: rectangle on the Z-plane at the high end
      const highZ   = slopeType === 'front' ?  halfD : -halfD;
      const highDir = slopeType === 'front' ?  1     : -1;
      const highY   = slopeType === 'front' ? yFront : yBack;
      const highWall = wallQuad(
        [-halfW, H], [halfW, H], [halfW, highY], [-halfW, highY],
        'z', highZ, highDir,
      );

      return merge([leftRight, highWall]);
    }
    default:
      return null;
  }
}

/**
 * Build a single triangle on a wall plane.
 * @param p0,p1,p2  2D coords [axis, Y] — the axis is X for z-plane walls, Z for x-plane walls
 * @param plane     'z' = triangle lies on a Z=const plane, 'x' = on X=const plane
 * @param planeVal  the constant coordinate value (e.g. D/2 for front wall)
 * @param faceDir   +1 or -1 for outward normal direction
 * @param spanW     world width of the triangle base (for UV)
 * @param spanH     world height of the triangle (for UV)
 */
function wallTriangle(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  plane: 'z' | 'x',
  planeVal: number,
  faceDir: number,
): THREE.BufferGeometry {
  const toV3 = (p: [number, number]) =>
    plane === 'z'
      ? new THREE.Vector3(p[0], p[1], planeVal)
      : new THREE.Vector3(planeVal, p[1], p[0]);

  const v0 = toV3(p0);
  const v1 = toV3(p1);
  const v2 = toV3(p2);

  const normal = plane === 'z'
    ? new THREE.Vector3(0, 0, faceDir)
    : new THREE.Vector3(faceDir, 0, 0);

  // UV: U normalized to left edge of the shape; V absolute so texture continues from the wall below.
  const baseMin = Math.min(p0[0], p1[0], p2[0]);
  const u0 = uv(p0[0] - baseMin), tv0 = uv(p0[1]);
  const u1 = uv(p1[0] - baseMin), tv1 = uv(p1[1]);
  const u2 = uv(p2[0] - baseMin), tv2 = uv(p2[1]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z,
  ], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([
    u0, tv0, u1, tv1, u2, tv2,
  ], 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute([
    normal.x, normal.y, normal.z,
    normal.x, normal.y, normal.z,
    normal.x, normal.y, normal.z,
  ], 3));
  geo.setIndex([0, 1, 2]);
  return geo;
}

/**
 * Build a quad on a wall plane (for trapezoid fills under single-slope roofs).
 * p0..p3 are 2D [axis, Y] coords in winding order.
 */
function wallQuad(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  plane: 'z' | 'x',
  planeVal: number,
  faceDir: number,
): THREE.BufferGeometry {
  const toV3 = (p: [number, number]) =>
    plane === 'z'
      ? new THREE.Vector3(p[0], p[1], planeVal)
      : new THREE.Vector3(planeVal, p[1], p[0]);

  const normal = plane === 'z'
    ? new THREE.Vector3(0, 0, faceDir)
    : new THREE.Vector3(faceDir, 0, 0);

  const pts = [p0, p1, p2, p3];
  const axisMin = Math.min(...pts.map(p => p[0]));

  // Use absolute Y so the texture continues seamlessly from the rectangular wall below.
  const uvCoords: [number, number, number, number, number, number, number, number] = [
    uv(p0[0] - axisMin), uv(p0[1]),
    uv(p1[0] - axisMin), uv(p1[1]),
    uv(p2[0] - axisMin), uv(p2[1]),
    uv(p3[0] - axisMin), uv(p3[1]),
  ];

  return quad([toV3(p0), toV3(p1), toV3(p2), toV3(p3)], uvCoords, normal);
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
