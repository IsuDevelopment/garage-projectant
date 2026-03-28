import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AdditionalFeaturesConfig, GarageConfig, GarageDimensions, GateConfig, MaterialConfig, RoofSlopeType, ProfileType, WallSide, GutterConfig, RoofFeltConfig } from './types';
import { DEFAULT_SETTINGS } from '@/config/settings';
import {
  WALL_LABELS,
  WallObjectBounds,
  wallWidthForSide,
  gatesFitOnWall,
  computePositionBounds,
  snapToNearestValid,
  findDimensionCollisions,
} from './wallCollision';
import { useUIStore } from './useUIStore';

const defaultGate: GateConfig = {
  id:            uuidv4(),
  type:          'tilt',
  wall:          'front',
  width:         DEFAULT_SETTINGS.gate.width.default,
  height:        DEFAULT_SETTINGS.gate.height.default,
  positionX:     0.3,
  openDirection: 'left',
  color:         '#c7c7c7',
  material:      null,
};

// ─── Default values ────────────────────────────────────────────────────────────
const defaultMaterialDef = DEFAULT_SETTINGS.materials[0];

const defaultMaterial: MaterialConfig = {
  type: defaultMaterialDef?.slug ?? 'trapez',
  color: defaultMaterialDef?.defaultColor ?? '#c7c7c7',
  customSpriteUrl: defaultMaterialDef?.texture,
  subOptions: defaultMaterialDef?.subFeatures?.reduce((acc, sf) => {
    acc[sf.slug] = sf.default;
    return acc;
  }, {} as Record<string, string | number>),
};

const defaultGutters: GutterConfig = {
  enabled:   true,
  color:     '#555555',
  drainSide: 'front',
  downspout: 'both',
};

const defaultFeltRoof: RoofFeltConfig = {
  enabled: false,
};

function buildDefaultAdditionalFeatures(): AdditionalFeaturesConfig {
  return (DEFAULT_SETTINGS.additionalFeatures ?? []).reduce((acc, feature) => {
    const firstOption = feature.options?.[0];
    acc[feature.slug] = {
      enabled: false,
      selectedOptionSlug: firstOption?.slug ?? null,
      optionColor: firstOption?.defaultColor ?? '#8f969f',
    };
    return acc;
  }, {} as AdditionalFeaturesConfig);
}

const defaultAdditionalFeatures = buildDefaultAdditionalFeatures();

const defaultConfig: GarageConfig = {
  dimensions: {
    width:  DEFAULT_SETTINGS.dimensions.width.default,
    height: DEFAULT_SETTINGS.dimensions.height.default,
    depth:  DEFAULT_SETTINGS.dimensions.depth.default,
  },
  roof: {
    slopeType: 'double',
    pitch: DEFAULT_SETTINGS.roofPitch.double.default,
    material: null,
  },
  gates: [defaultGate],
  construction: {
    material: { ...defaultMaterial },
    profileType: '30x40',
    galvanized: false,
  },
  gutters:  { ...defaultGutters },
  feltRoof: { ...defaultFeltRoof },
  additionalFeatures: { ...defaultAdditionalFeatures },
};

// ─── Store interface ───────────────────────────────────────────────────────────
interface ConfigState {
  config: GarageConfig;

  // Dimensions
  setWidth:              (v: number) => void;
  setHeight:             (v: number) => void;
  setDepth:              (v: number) => void;
  applyPendingDimensions:(dims: GarageDimensions) => void;

  // Roof
  setRoofSlope:    (type: RoofSlopeType) => void;
  setRoofPitch:    (deg: number) => void;
  setRoofMaterial: (m: MaterialConfig | null) => void;

  // Construction
  setConstructionMaterial: (m: MaterialConfig) => void;
  setProfileType:          (p: ProfileType) => void;
  setGalvanized:           (v: boolean) => void;

  // Gates
  addGate:    (wall?: WallSide) => GateConfig | null;
  updateGate: (id: string, patch: Partial<Omit<GateConfig, 'id'>>) => void;
  removeGate: (id: string) => void;
  canAddGate: (wall: WallSide, newWidth: number, excludeId?: string) => boolean;

  // Gutters
  setGutters: (patch: Partial<GutterConfig>) => void;

  // Roof felt
  setFeltRoof: (patch: Partial<RoofFeltConfig>) => void;

  // Additional services
  setAdditionalFeature: (
    slug: string,
    patch: Partial<AdditionalFeaturesConfig[string]>,
  ) => void;
}

// ─── Gate fit validation (delegates to wallCollision utility) ────────────────
function gateFitsCheck(config: GarageConfig, wall: WallSide, extraWidth: number, excludeId?: string): boolean {
  const existingWidths = config.gates
    .filter(g => g.wall === wall && g.id !== excludeId)
    .map(g => g.width);
  return gatesFitOnWall(config.dimensions, wall, existingWidths, extraWidth);
}

function toWallObjects(gates: GateConfig[]): WallObjectBounds[] {
  return gates.map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall }));
}

function gateName(gate: GateConfig, index: number): string {
  const typeLabels: Record<string, string> = {
    tilt: 'Uchylna', 'double-wing': 'Dwuskrzydłowa', sectional: 'Segmentowa',
  };
  return `Brama ${index + 1} — ${typeLabels[gate.type] ?? gate.type} ${gate.width.toFixed(1)}×${gate.height.toFixed(1)}m (${WALL_LABELS[gate.wall]})`;
}

function buildCollisionConflicts(config: GarageConfig, newDimensions: GarageDimensions) {
  const conflicts = findDimensionCollisions(toWallObjects(config.gates), newDimensions);
  return conflicts.map(c => {
    const idx   = config.gates.findIndex(g => g.id === c.id);
    const gate  = config.gates[idx];
    return { id: c.id, name: gateName(gate, idx) };
  });
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useConfigStore = create<ConfigState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      config: defaultConfig,

      setWidth: (v) => {
        const { config } = get();
        const newDims  = { ...config.dimensions, width: v };
        const conflicts = buildCollisionConflicts(config, newDims);
        if (conflicts.length > 0) {
          useUIStore.getState().showCollisionDialog(newDims, conflicts);
          return;
        }
        set(s => ({ config: { ...s.config, dimensions: { ...s.config.dimensions, width: v } } }));
      },

      setHeight: (v) => {
        const { config } = get();
        const newDims  = { ...config.dimensions, height: v };
        const conflicts = buildCollisionConflicts(config, newDims);
        if (conflicts.length > 0) {
          useUIStore.getState().showCollisionDialog(newDims, conflicts);
          return;
        }
        set(s => ({ config: { ...s.config, dimensions: { ...s.config.dimensions, height: v } } }));
      },

      setDepth: (v) => {
        const { config } = get();
        const newDims  = { ...config.dimensions, depth: v };
        const conflicts = buildCollisionConflicts(config, newDims);
        if (conflicts.length > 0) {
          useUIStore.getState().showCollisionDialog(newDims, conflicts);
          return;
        }
        set(s => ({ config: { ...s.config, dimensions: { ...s.config.dimensions, depth: v } } }));
      },

      applyPendingDimensions: (dims) =>
        set(s => ({ config: { ...s.config, dimensions: { ...dims } } })),

      setRoofSlope: (type) =>
        set(s => {
          const isDoubleSlope = type === 'double' || type === 'double-front-back';
          const limits = DEFAULT_SETTINGS.roofPitch[isDoubleSlope ? 'double' : 'single'];
          let pitch: number;
          if (limits.mode === 'values') {
            // snap to nearest allowed value
            pitch = limits.values.reduce((prev, cur) =>
              Math.abs(cur - s.config.roof.pitch) < Math.abs(prev - s.config.roof.pitch) ? cur : prev
            );
          } else {
            pitch = Math.min(Math.max(s.config.roof.pitch, limits.min), limits.max);
          }
          return { config: { ...s.config, roof: { ...s.config.roof, slopeType: type, pitch } } };
        }),
      setRoofPitch: (deg) =>
        set(s => ({ config: { ...s.config, roof: { ...s.config.roof, pitch: deg } } })),
      setRoofMaterial: (m) =>
        set(s => ({ config: { ...s.config, roof: { ...s.config.roof, material: m } } })),

      setConstructionMaterial: (m) =>
        set(s => ({ config: { ...s.config, construction: { ...s.config.construction, material: m } } })),
      setProfileType: (p) =>
        set(s => ({ config: { ...s.config, construction: { ...s.config.construction, profileType: p } } })),
      setGalvanized: (v) =>
        set(s => ({ config: { ...s.config, construction: { ...s.config.construction, galvanized: v } } })),

      addGate: (wall = 'front') => {
        const { config } = get();
        const settings = DEFAULT_SETTINGS;
        const newWidth  = settings.gate.width.default;
        const newHeight = settings.gate.height.default;

        if (config.gates.length >= settings.gate.maxCount) return null;
        if (!gateFitsCheck(config, wall, newWidth)) return null;

        // Find first available slot on the wall
        const wallW   = wallWidthForSide(config.dimensions, wall);
        const wallObjs = toWallObjects(config.gates.filter(g => g.wall === wall));
        const { min, max, blockedRanges } = computePositionBounds(wallW, newWidth, wallObjs, '__new__');
        if (max < min) return null;
        const posX = snapToNearestValid(min, blockedRanges, min, max);

        const gate: GateConfig = {
          id: uuidv4(),
          type: 'double-wing',
          width: newWidth,
          height: newHeight,
          positionX: posX,
          wall,
          openDirection: 'right',
          color: '#5a4a3a',
          material: null,
        };

        set(s => ({ config: { ...s.config, gates: [...s.config.gates, gate] } }));
        return gate;
      },

      updateGate: (id, patch) =>
        set(s => ({
          config: {
            ...s.config,
            gates: s.config.gates.map(g => (g.id === id ? { ...g, ...patch } : g)),
          },
        })),

      removeGate: (id) =>
        set(s => ({
          config: { ...s.config, gates: s.config.gates.filter(g => g.id !== id) },
        })),

      canAddGate: (wall, newWidth, excludeId) =>
        gateFitsCheck(get().config, wall, newWidth, excludeId),

      setGutters: (patch) =>
        set(s => ({ config: { ...s.config, gutters: { ...s.config.gutters, ...patch } } })),

      setFeltRoof: (patch) =>
        set(s => ({ config: { ...s.config, feltRoof: { ...s.config.feltRoof, ...patch } } })),

      setAdditionalFeature: (slug, patch) =>
        set(s => {
          const current = s.config.additionalFeatures[slug] ?? {
            enabled: false,
            selectedOptionSlug: null,
            optionColor: '#8f969f',
          };
          return {
            config: {
              ...s.config,
              additionalFeatures: {
                ...s.config.additionalFeatures,
                [slug]: {
                  ...current,
                  ...patch,
                },
              },
            },
          };
        }),
    })),
    { name: 'GarageConfig' },
  ),
);
