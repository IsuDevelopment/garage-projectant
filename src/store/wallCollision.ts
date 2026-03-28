import { GarageDimensions, WallSide } from './types';

export const SIDE_MARGIN = 0.3; // min distance from wall edge
export const GAP_BETWEEN = 0.2; // min gap between wall objects

export const WALL_LABELS: Record<WallSide, string> = {
  front: 'przód',
  back:  'tył',
  left:  'lewo',
  right: 'prawo',
};

export interface WallObjectBounds {
  id:        string;
  positionX: number;
  width:     number;
  height:    number;
  wall:      WallSide;
}

/** Returns the usable wall width for the given side. */
export function wallWidthForSide(dimensions: GarageDimensions, wall: WallSide): number {
  return wall === 'front' || wall === 'back'
    ? dimensions.width
    : dimensions.depth;
}

/**
 * Computes the valid positionX range and blocked intervals for the position slider.
 * blockedRanges are exclusive on both ends: any x with bStart < x < bEnd would cause overlap.
 */
export function computePositionBounds(
  wallWidth:       number,
  objectWidth:     number,
  sameWallObjects: WallObjectBounds[],
  objectId:        string,
  sideMargin = SIDE_MARGIN,
  gapBetween = GAP_BETWEEN,
): { min: number; max: number; blockedRanges: [number, number][] } {
  const min = sideMargin;
  const max = wallWidth - sideMargin - objectWidth;

  const others = sameWallObjects.filter(o => o.id !== objectId);
  const blockedRanges: [number, number][] = others.map(o => [
    o.positionX - gapBetween - objectWidth, // if our x > this, our right edge encroaches
    o.positionX + o.width + gapBetween,     // if our x < this, our left edge encroaches
  ]);

  return { min, max, blockedRanges };
}

/**
 * Snaps desiredX to the nearest valid positionX outside blocked ranges.
 * blockedRanges are exclusive: bStart < x < bEnd is forbidden.
 */
export function snapToNearestValid(
  desiredX:     number,
  blockedRanges: [number, number][],
  min:           number,
  max:           number,
): number {
  let x = Math.min(Math.max(desiredX, min), max);

  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (const [bStart, bEnd] of blockedRanges) {
      if (x > bStart && x < bEnd) {
        const distToStart = x - bStart;
        const distToEnd   = bEnd - x;
        x = distToStart <= distToEnd
          ? Math.max(bStart, min)
          : Math.min(bEnd, max);
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }

  return Math.min(Math.max(x, min), max);
}

/**
 * Returns objects that would be out-of-bounds or height-clipped after a dimension change.
 */
export function findDimensionCollisions(
  objects:       WallObjectBounds[],
  newDimensions: GarageDimensions,
): WallObjectBounds[] {
  return objects.filter(obj => {
    const wallW = wallWidthForSide(newDimensions, obj.wall);
    return (
      obj.positionX + obj.width > wallW - SIDE_MARGIN ||
      obj.positionX < SIDE_MARGIN ||
      obj.height > newDimensions.height - 0.2
    );
  });
}

/**
 * Checks if a gate of extraWidth fits on a wall alongside existing gate widths.
 */
export function gatesFitOnWall(
  dimensions:     GarageDimensions,
  wall:           WallSide,
  existingWidths: number[],
  extraWidth:     number,
  sideMargin  = SIDE_MARGIN,
  gapBetween  = GAP_BETWEEN,
): boolean {
  const available    = wallWidthForSide(dimensions, wall);
  const totalWidth   = existingWidths.reduce((s, w) => s + w, 0) + extraWidth;
  const gaps         = sideMargin * 2 + gapBetween * existingWidths.length;
  return totalWidth + gaps <= available;
}
