import { MaterialType, RoofSlopeType, GateType, ProfileType } from '@/store/types';
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

  availableMaterials: MaterialType[];
  availableRoofSlopes: RoofSlopeType[];
  availableGateTypes: GateType[];
  availableProfiles: ProfileType[];

  roofPitch: Record<'single' | 'double', RoofPitchLimits>;

  gate: GateDimensionLimits;

  customSprites?: Record<string, { name: string; url: string }>;

  /** Ground plane appearance — swap per instance (grass, asphalt, concrete, …) */
  ground?: GroundConfig;
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

// ─── Default settings (sourced from JSON for future API loading) ─────────────
export const DEFAULT_SETTINGS: ConfiguratorSettings = defaultSettingsJson as ConfiguratorSettings;

/** Convenience re-export for components that only need ground defaults. */
export const DEFAULT_GROUND: GroundConfig = DEFAULT_SETTINGS.ground!;

// ─── Material display info ────────────────────────────────────────────────────
export const MATERIAL_LABELS: Record<string, string> = {
  trapez:          'Trapez',
  blachodachowka:  'Blachodachówka',
  rabek:           'Rąbek',
};

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
