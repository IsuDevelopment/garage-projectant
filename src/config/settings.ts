import { MaterialType, RoofSlopeType, GateType, ProfileType } from '@/store/types';

// ─── Dimension bounds ─────────────────────────────────────────────────────────
export interface DimensionLimits {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  label: string;
}

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

  roofPitch: DimensionLimits;

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

export const DEFAULT_GROUND: GroundConfig = {
  spriteUrl: '/textures/grass.png',
  tileSize: 1,
  planeSize: 60,
  color: '#ffffff',
};

// ─── Default settings ─────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: ConfiguratorSettings = {
  id: 'default',
  name: 'Konfigurator Garażu',

  dimensions: {
    width:  { min: 3,   max: 12,  step: 0.1, default: 6,   unit: 'm', label: 'Szerokość' },
    height: { min: 2,   max: 4.5, step: 0.1, default: 2.5, unit: 'm', label: 'Wysokość' },
    depth:  { min: 3,   max: 15,  step: 0.1, default: 6,   unit: 'm', label: 'Głębokość' },
  },

  availableMaterials: ['trapez', 'blachodachowka', 'rabek'],
  availableRoofSlopes: ['right', 'left', 'back', 'front', 'double'],
  availableGateTypes: ['tilt', 'double-wing'],
  availableProfiles: ['30x30', '30x40'],

  roofPitch: { min: 5, max: 40, step: 1, default: 20, unit: '°', label: 'Kąt dachu' },

  gate: {
    width:    { min: 1.5, max: 4.5, step: 0.1, default: 2.4, unit: 'm', label: 'Szerokość bramy' },
    height:   { min: 1.8, max: 3,   step: 0.1, default: 2.1, unit: 'm', label: 'Wysokość bramy' },
    maxCount: 4,
  },

  ground: DEFAULT_GROUND,
};

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
  double: 'Podwójny',
};

// ─── Gate type display info ───────────────────────────────────────────────────
export const GATE_TYPE_LABELS: Record<string, string> = {
  tilt:        'Uchylna',
  'double-wing': 'Dwuskrzydłowa',
};

// ─── Profile display ─────────────────────────────────────────────────────────
export const PROFILE_LABELS: Record<string, string> = {
  '30x30': '30×30 mm',
  '30x40': '30×40 mm',
};
