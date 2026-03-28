// ─── Material Types ────────────────────────────────────────────────────────────
export type MaterialType = 'trapez' | 'blachodachowka' | 'rabek';

export type MaterialElement = 'walls' | 'roof' | 'gates';

export interface MaterialConfig {
  type: MaterialType;
  color: string; // hex — tinted onto the sprite texture
  customSpriteUrl?: string; // per-company custom sprite
  /** Selected values for material-specific sub-features */
  subOptions?: Record<string, string | number>;
}

export interface MaterialColorPreset {
  name: string;
  color: string;
}

export interface MaterialSubFeature {
  slug: string;
  name: string;
  type: 'select' | 'slider';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: string | number;
}

export interface MaterialSubFeatureDefinition extends MaterialSubFeature {
  /** Optional surcharge used by future pricing engine */
  price?: number;
}

export interface MaterialDefinition {
  /** Material feature slug; also used as texture/material key */
  slug: MaterialType;
  name: string;
  description?: string;
  texture: string;
  previewImage?: string;
  defaultColor: string;
  appliesTo: MaterialElement[];
  /** Restriction used when material is applied to roof */
  allowedSlopes?: RoofSlopeType[];
  isPremium?: boolean;
  allowColors: boolean;
  colorSet?: MaterialColorPreset[];
  /** Legacy inline feature definitions (kept for compatibility) */
  subFeatures?: MaterialSubFeature[];
  /** Preferred: references to global sub-feature registry */
  subFeatureSlugs?: string[];
  price?: number;
}

export interface ColorDefinition {
  slug: string;
  name: string;
  color: string;
  price?: number;
  isPremium?: boolean;
  restrictToMaterials?: MaterialType[];
}

export interface ElementMaterialOverride {
  disabledSubFeatures?: string[];
  forcedValues?: Record<string, string | number>;
}

export interface ElementMaterialBinding {
  allowedMaterials: MaterialType[];
  /** Empty array means all configured global colors; false means colors disabled */
  allowedColors?: string[] | false;
  materialOverrides?: Partial<Record<MaterialType, ElementMaterialOverride>>;
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

export interface GateSizeSetCm {
  width: number[];
  height: number[];
}

export interface GateTypeDefinition {
  slug: GateType;
  name: string;
  previewImage?: string;
  isPremium?: boolean;
  sizes: GateSizeSetCm;
  allowedMaterials?: MaterialType[];
  allowedColors?: string[] | false;
  materialOverrides?: Partial<Record<MaterialType, ElementMaterialOverride>>;
}

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

// ─── Door ─────────────────────────────────────────────────────────────────────
export interface DoorConfig {
  id: string;
  typeSlug: string;       // matches WallObjectTypeDefinition.slug ('single' | 'double')
  wall: WallSide;
  positionX: number;      // offset from left edge of the wall (metres)
  width: number;          // metres
  height: number;         // metres
  openDirection?: OpenDirection;
  color: string;          // hex
  material: MaterialConfig | null; // null = inherit from construction.material
}

// ─── Window ───────────────────────────────────────────────────────────────────
export type WindowFinish = 'pcv' | 'aluminium';

export interface WindowColorDefinition {
  slug: string;
  name: string;
  color: string;
}

export interface WindowFinishDefinition {
  slug: WindowFinish;
  name: string;
  colors: WindowColorDefinition[];
}

export interface WindowGlazingDefinition {
  slug: string;
  name: string;
  chambers: 2 | 3;
  price?: number;
}

export interface WindowConfig {
  id: string;
  typeSlug: string;   // matches WallObjectTypeDefinition.slug ('single' | 'double')
  wall: WallSide;
  positionX: number;  // offset from left edge of the wall (metres)
  sillHeight: number; // bottom edge of the window from floor (metres)
  width: number;      // metres
  height: number;     // metres
  glazingSlug: string;
  finish: WindowFinish;
  colorSlug: string;
}

export type WallObjectCategory = 'door' | 'window';

export interface WallObjectSizePresetCm {
  width: number;
  height: number;
  name?: string;
}

export interface WallObjectTypeDefinition {
  slug: string;
  name: string;
  category: WallObjectCategory;
  previewImage?: string;
  isPremium?: boolean;
  sizes: WallObjectSizePresetCm[];
  allowedMaterials?: MaterialType[];
  allowedColors?: string[] | false;
}

export interface ConstructionSizesCm {
  width: number[];
  depth: number[];
  height: number[];
}

export interface ConstructionDefaultsCm {
  width: number;
  depth: number;
  height: number;
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

// ─── Additional Services ────────────────────────────────────────────────────
export interface AdditionalFeatureSelection {
  enabled: boolean;
  selectedOptionSlug: string | null;
  optionColor: string;
}

export type AdditionalFeaturesConfig = Record<string, AdditionalFeatureSelection>;

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
  doors: DoorConfig[];
  windows: WindowConfig[];
  construction: ConstructionConfig;
  gutters: GutterConfig;
  feltRoof: RoofFeltConfig;
  additionalFeatures: AdditionalFeaturesConfig;
}
