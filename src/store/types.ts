// ─── Material Types ────────────────────────────────────────────────────────────
export type MaterialType = 'trapez' | 'blachodachowka' | 'rabek';

export interface MaterialConfig {
  type: MaterialType;
  color: string; // hex — tinted onto the sprite texture
  customSpriteUrl?: string; // [Phase 2] per-company custom sprite
}

// ─── Roof ─────────────────────────────────────────────────────────────────────
export type RoofSlopeType = 'right' | 'left' | 'back' | 'front' | 'double' | 'double-front-back';

export interface RoofConfig {
  slopeType: RoofSlopeType;
  pitch: number; // angle in degrees (roof height as % of span)
  material: MaterialConfig | null; // null = inherit from construction.material
}

// ─── Gate ─────────────────────────────────────────────────────────────────────
export type GateType = 'tilt' | 'double-wing' | 'sectional';
export type WallSide = 'front' | 'back' | 'left' | 'right';
export type OpenDirection = 'left' | 'right';

export interface GateConfig {
  id: string;
  type: GateType;
  width: number;
  height: number;
  positionX: number; // offset from left edge of that wall
  wall: WallSide;
  openDirection: OpenDirection;
  color: string; // hex
  material: MaterialConfig | null; // null = inherit from construction.material
}

// ─── Construction ─────────────────────────────────────────────────────────────
export type ProfileType = '30x30' | '30x40';

export interface ConstructionConfig {
  material: MaterialConfig; // global material — applied everywhere unless overridden
  profileType: ProfileType;
  galvanized: boolean;
}

// ─── Gutters ──────────────────────────────────────────────────────────────────
export type GutterDrainSide = 'front' | 'back';
export type GutterDownspout = 'both' | 'left' | 'right';

export interface GutterConfig {
  enabled: boolean;
  color: string;               // hex — independent of global material (metal gutters)
  drainSide: GutterDrainSide;  // which wall the trough drains toward
  downspout: GutterDownspout;  // location of vertical pipe(s)
}

// ─── Roof Felt ───────────────────────────────────────────────────────────────
export interface RoofFeltConfig {
  enabled: boolean; // whether felt underlay is selected by user
}

// ─── Dimensions ───────────────────────────────────────────────────────────────
export interface GarageDimensions {
  width: number; // X axis
  height: number; // Y axis (wall height, not incl. roof peak)
  depth: number; // Z axis
}

// ─── Full Config ──────────────────────────────────────────────────────────────
export interface GarageConfig {
  dimensions: GarageDimensions;
  roof: RoofConfig;
  gates: GateConfig[];
  construction: ConstructionConfig;
  gutters: GutterConfig;
  feltRoof: RoofFeltConfig;
}
