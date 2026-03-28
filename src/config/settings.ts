import {
  ColorDefinition,
  ConstructionDefaultsCm,
  ConstructionSizesCm,
  ElementMaterialBinding,
  GateTypeDefinition,
  MaterialDefinition,
  MaterialSubFeatureDefinition,
  MaterialType,
  RoofSlopeType,
  GateType,
  ProfileType,
  MaterialElement,
  WallObjectTypeDefinition,
} from '@/store/types';
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
  /** New registry format used by per-element color allowlists */
  definitions?: ColorDefinition[];
}

export interface ConstructionConfigSettings {
  sizes: ConstructionSizesCm;
  defaults: ConstructionDefaultsCm;
  profiles: ProfileType[];
}

export interface RoofElementSettings extends ElementMaterialBinding {
  availableSlopes: RoofSlopeType[];
  pitch: Record<'single' | 'double', RoofPitchLimits>;
}

export interface ElementSettings {
  walls: ElementMaterialBinding;
  roof: RoofElementSettings;
  gates: ElementMaterialBinding;
}

export interface GateSettings {
  maxCount: number;
  types: GateTypeDefinition[];
}

export interface DoorSettings {
  maxCount: number;
  types: WallObjectTypeDefinition[];
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

  /** New production constraints in centimetres (used by discrete sliders) */
  construction?: ConstructionConfigSettings;

  /** New per-element material bindings with overrides */
  elements?: ElementSettings;

  /** New gate catalog with per-type discrete size sets */
  gates?: GateSettings;

  /** Door catalog with per-type preset sizes */
  doors?: DoorSettings;

  /** Global sub-feature registry referenced by materials via slugs */
  subFeatures?: MaterialSubFeatureDefinition[];

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
export const DEFAULT_SETTINGS: ConfiguratorSettings = defaultSettingsJson as unknown as ConfiguratorSettings;

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

export function cmToMeters(valueCm: number): number {
  return valueCm / 100;
}

export function metersToCm(valueMeters: number): number {
  return Math.round(valueMeters * 100);
}

export function getConstructionSizeValuesCm(
  settings: ConfiguratorSettings,
  axis: keyof ConstructionSizesCm,
): number[] {
  const values = settings.construction?.sizes?.[axis];
  if (values?.length) return values;

  if (axis === 'width') {
    const { min, max, step } = settings.dimensions.width;
    return buildRangeCm(min, max, step);
  }
  if (axis === 'depth') {
    const { min, max, step } = settings.dimensions.depth;
    return buildRangeCm(min, max, step);
  }
  const { min, max, step } = settings.dimensions.height;
  return buildRangeCm(min, max, step);
}

export function getConstructionDefaultCm(
  settings: ConfiguratorSettings,
  axis: keyof ConstructionDefaultsCm,
): number {
  const explicit = settings.construction?.defaults?.[axis];
  if (typeof explicit === 'number') return explicit;

  if (axis === 'width') return Math.round(settings.dimensions.width.default * 100);
  if (axis === 'depth') return Math.round(settings.dimensions.depth.default * 100);
  return Math.round(settings.dimensions.height.default * 100);
}

export function getAvailableRoofSlopes(settings: ConfiguratorSettings): RoofSlopeType[] {
  const fromElements = settings.elements?.roof.availableSlopes;
  return fromElements?.length ? fromElements : settings.availableRoofSlopes;
}

export function getRoofPitchLimits(
  settings: ConfiguratorSettings,
  kind: 'single' | 'double',
): RoofPitchLimits {
  return settings.elements?.roof.pitch?.[kind] ?? settings.roofPitch[kind];
}

export function getAvailableProfiles(settings: ConfiguratorSettings): ProfileType[] {
  const fromConstruction = settings.construction?.profiles;
  return fromConstruction?.length ? fromConstruction : settings.availableProfiles;
}

export function getGateTypeDefinition(
  settings: ConfiguratorSettings,
  gateType: GateType,
): GateTypeDefinition | undefined {
  return settings.gates?.types.find(type => type.slug === gateType);
}

export function getGateTypes(settings: ConfiguratorSettings): GateTypeDefinition[] {
  if (settings.gates?.types?.length) return settings.gates.types;

  return settings.availableGateTypes.map(type => ({
    slug: type,
    name: GATE_TYPE_LABELS[type] ?? type,
    sizes: {
      width: buildRangeCm(settings.gate.width.min, settings.gate.width.max, settings.gate.width.step),
      height: buildRangeCm(settings.gate.height.min, settings.gate.height.max, settings.gate.height.step),
    },
  }));
}

export function getGateMaxCount(settings: ConfiguratorSettings): number {
  return settings.gates?.maxCount ?? settings.gate.maxCount;
}

export function getElementBinding(
  settings: ConfiguratorSettings,
  element: MaterialElement,
): ElementMaterialBinding {
  const fromNewSchema = settings.elements?.[element];
  if (fromNewSchema) return fromNewSchema;

  const allowedMaterials = settings.materials
    .filter(material => material.appliesTo.includes(element))
    .map(material => material.slug);

  return {
    allowedMaterials,
    allowedColors: [],
  };
}

export function getGlobalColorDefinitions(settings: ConfiguratorSettings): ColorDefinition[] {
  if (settings.colors.definitions?.length) return settings.colors.definitions;
  return settings.colors.set.map(color => ({
    slug: color.slug,
    name: color.name,
    color: color.color,
    price: color.price,
    restrictToMaterials: color.textures,
  }));
}

export function getElementColorPresets(
  settings: ConfiguratorSettings,
  element: MaterialElement,
): ColorPreset[] {
  const binding = getElementBinding(settings, element);
  const global = getGlobalColorDefinitions(settings);
  if (binding.allowedColors === false) return [];

  const allowed = binding.allowedColors;
  const list = allowed && allowed.length
    ? global.filter(color => allowed.includes(color.slug))
    : global;

  return list.map(color => ({
    slug: color.slug,
    name: color.name,
    color: color.color,
    textures: color.restrictToMaterials,
    price: color.price,
  }));
}

function buildRangeCm(minMeters: number, maxMeters: number, stepMeters: number): number[] {
  const min = Math.round(minMeters * 100);
  const max = Math.round(maxMeters * 100);
  const step = Math.max(1, Math.round(stepMeters * 100));
  const values: number[] = [];

  for (let value = min; value <= max; value += step) {
    values.push(value);
  }

  if (values[values.length - 1] !== max) {
    values.push(max);
  }

  return values;
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

// ─── Door helpers ─────────────────────────────────────────────────────────────
export function getDoorTypes(settings: ConfiguratorSettings): WallObjectTypeDefinition[] {
  return settings.doors?.types ?? [];
}

export function getDoorTypeDefinition(
  settings: ConfiguratorSettings,
  typeSlug: string,
): WallObjectTypeDefinition | undefined {
  return settings.doors?.types.find(t => t.slug === typeSlug);
}

export function getDoorMaxCount(settings: ConfiguratorSettings): number {
  return settings.doors?.maxCount ?? 4;
}
