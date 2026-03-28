import { MaterialType, MaterialDefinition, RoofSlopeType, GateType, ProfileType } from '@/store/types';
import defaultSettingsJson from './default-settings.json';

// ─── Dimension bounds ─────────────────────────────────────────────────────────
export interface DimensionLimits {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  label: string;
}

/**
 * Roof pitch control: either a fixed set of allowed values (stepped picker)
 * or a continuous min/max range (integer steps only).
 */
export type RoofPitchLimits =
  | { mode: 'values'; values: number[]; default: number; unit: string; label: string }
  | { mode: 'range';  min: number; max: number; default: number; unit: string; label: string };

export interface GateDimensionLimits {
  width: DimensionLimits;
  height: DimensionLimits;
  maxCount: number;
}

// ─── Color system ─────────────────────────────────────────────────────────────

/**
 * A named color preset.
 * `textures` — when set, this color only appears when the active material type matches.
 * Omit or leave empty to show for all materials.
 */
export interface ColorPreset {
  slug: string;              // stable identifier, language-independent (e.g. "galvanized")
  name: string;
  color: string;             // hex e.g. "#c0c8d0"
  textures?: MaterialType[]; // restrict to specific material types
  price?: number;            // [future] optional surcharge for this colour
}

export interface ColorConfig {
  set: ColorPreset[];
  allowCustomColor: boolean;
}

// ─── Configurator settings (static Phase 1, from API Phase 2) ─────────────────
export interface ConfiguratorSettings {
  id: string;
  name: string;
  companyId?: string;

  dimensions: {
    width: DimensionLimits;
    height: DimensionLimits;
    depth: DimensionLimits;
  };

  materials: MaterialDefinition[];
  availableRoofSlopes: RoofSlopeType[];
  availableGateTypes: GateType[];
  availableProfiles: ProfileType[];

  roofPitch: Record<'single' | 'double', RoofPitchLimits>;

  gate: GateDimensionLimits;

  customSprites?: Record<string, { name: string; url: string }>;

  /** Global color palette and custom-color policy for this instance */
  colors: ColorConfig;

  /** Ground plane appearance — swap per instance (grass, asphalt, concrete, …) */
  ground?: GroundConfig;

  /** Visual environment around the garage scene */
  visual?: VisualEnvironmentConfig;

  /** Roof felt underlay feature — optional; absent = feature hidden */
  roofFelt?: RoofFeltSettings;

  /** Additional paid services rendered in a dedicated section when available */
  additionalFeatures?: AdditionalFeatureDefinition[];
}

// ─── Roof Felt feature settings ─────────────────────────────────────────────
export interface RoofFeltSettings {
  /** Whether this feature is available for this client instance */
  enabled: boolean;
  /** Explanatory text shown in the configurator UI */
  description: string;
  /** Optional preview image path (from /public/), displayed next to the toggle */
  previewImage?: string;
}

// ─── Additional services feature settings ──────────────────────────────────
export interface AdditionalFeatureOption {
  slug: string;
  name: string;
  price?: number;
  info?: string;
  defaultColor?: string;
  allowColor?: boolean;
  /** Optional spacing range for repeated support elements (in metres). */
  spacingMin?: number;
  spacingMax?: number;
}

export interface AdditionalFeatureDefinition {
  slug: string;
  name: string;
  enabled?: boolean;
  price?: number;
  description?: string;
  details?: string;
  options?: AdditionalFeatureOption[];
}

// ─── Ground config ────────────────────────────────────────────────────────────
export interface GroundConfig {
  /** Path to the sprite texture (from /public/) */
  spriteUrl: string;
  /** Size of one texture tile in world-space metres */
  tileSize: number;
  /** Total side length of the ground plane in metres */
  planeSize: number;
  /** Hex tint applied on top of the texture (e.g. '#ffffff' = no tint) */
  color: string;
}

export interface SkyGradientConfig {
  /** Dome radius in world units */
  radius: number;
  /** Strongest blue at the top of the dome */
  topColor: string;
  /** Transition blue in the middle band */
  midColor: string;
  /** Lightest blue near the horizon */
  horizonColor: string;
}

export interface CloudVisualConfig {
  seed: number;
  bounds: [number, number, number];
  volume: number;
  color: string;
  opacity: number;
  speed: number;
  position: [number, number, number];
}

export interface CloudMotionConfig {
  /** Horizontal drift speed range in world units per second */
  driftMin: number;
  driftMax: number;
  /** Vertical bob amplitude range in world units */
  bounceMin: number;
  bounceMax: number;
  /** Vertical bob frequency range */
  bobSpeedMin: number;
  bobSpeedMax: number;
  /** Half-width of the wrap zone on X axis */
  wrapHalfWidth: number;
}

export interface TreeVisualConfig {
  type: 'conifer' | 'deciduous';
  position: [number, number, number];
  scale?: number;
  crownColor?: string;
  trunkColor?: string;
}

export interface VisualEnvironmentConfig {
  /** Canvas clear color used behind the 3D sky dome */
  backgroundColor: string;
  sky: SkyGradientConfig;
  clouds: CloudVisualConfig[];
  trees: TreeVisualConfig[];
  cloudMotion?: CloudMotionConfig;
}

// ─── Default settings (sourced from JSON for future API loading) ─────────────
export const DEFAULT_SETTINGS: ConfiguratorSettings = defaultSettingsJson as ConfiguratorSettings;

/** Convenience re-export for components that only need ground defaults. */
export const DEFAULT_GROUND: GroundConfig = DEFAULT_SETTINGS.ground!;

// ─── Material display info ────────────────────────────────────────────────────
export const MATERIAL_LABELS: Record<string, string> = DEFAULT_SETTINGS.materials.reduce(
  (acc, mat) => {
    acc[mat.slug] = mat.name;
    return acc;
  },
  {} as Record<string, string>,
);

export function getMaterialDefinition(
  settings: ConfiguratorSettings,
  slug: MaterialType,
): MaterialDefinition | undefined {
  return settings.materials.find(m => m.slug === slug);
}

// ─── Roof slope display info ──────────────────────────────────────────────────
export const ROOF_SLOPE_LABELS: Record<string, string> = {
  right:  'Prawy',
  left:   'Lewy',
  back:   'Tylni',
  front:  'Przedni',
  double: 'Dwuspadowy (kalenica wzdłuż)',
  'double-front-back': 'Dwuspadowy (kalenica wszerz)',
};

// ─── Gate type display info ───────────────────────────────────────────────────
export const GATE_TYPE_LABELS: Record<string, string> = {
  tilt:        'Uchylna',
  'double-wing': 'Dwuskrzydłowa',
  sectional:   'Segmentowa',
};

// ─── Profile display ─────────────────────────────────────────────────────────
export const PROFILE_LABELS: Record<string, string> = {
  '30x30': '30×30 mm',
  '30x40': '30×40 mm',
};
