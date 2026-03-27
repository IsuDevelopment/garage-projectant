import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { GarageConfig, GateConfig, MaterialConfig, RoofSlopeType, ProfileType, WallSide, GutterConfig, RoofFeltConfig } from './types';
import { DEFAULT_SETTINGS } from '@/config/settings';

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
};

// ─── Store interface ───────────────────────────────────────────────────────────
interface ConfigState {
  config: GarageConfig;

  // Dimensions
  setWidth:  (v: number) => void;
  setHeight: (v: number) => void;
  setDepth:  (v: number) => void;

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
}

// ─── Gate fit validation ──────────────────────────────────────────────────────
function wallWidth(config: GarageConfig, wall: WallSide): number {
  return wall === 'front' || wall === 'back'
    ? config.dimensions.width
    : config.dimensions.depth;
}

function gatesFitOnWall(
  config: GarageConfig,
  wall: WallSide,
  extraWidth: number,
  excludeId?: string,
): boolean {
  const available = wallWidth(config, wall);
  const sideMargin = 0.3; // min gap from wall edge
  const gapBetween = 0.2; // min gap between gates
  const existing = config.gates.filter(g => g.wall === wall && g.id !== excludeId);
  const totalGateWidth = existing.reduce((s, g) => s + g.width, 0) + extraWidth;
  const gaps = sideMargin * 2 + gapBetween * existing.length;
  return totalGateWidth + gaps <= available;
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useConfigStore = create<ConfigState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      config: defaultConfig,

      setWidth:  (v) => set(s => ({ config: { ...s.config, dimensions: { ...s.config.dimensions, width:  v } } })),
      setHeight: (v) => set(s => ({ config: { ...s.config, dimensions: { ...s.config.dimensions, height: v } } })),
      setDepth:  (v) => set(s => ({ config: { ...s.config, dimensions: { ...s.config.dimensions, depth:  v } } })),

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
        if (!gatesFitOnWall(config, wall, newWidth)) return null;

        // Auto-position: place after last gate on this wall
        const wallGates = config.gates.filter(g => g.wall === wall);
        const taken = wallGates.reduce((s, g) => s + g.width, 0);
        const posX  = 0.3 + taken + 0.2 * wallGates.length;

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
        gatesFitOnWall(get().config, wall, newWidth, excludeId),

      setGutters: (patch) =>
        set(s => ({ config: { ...s.config, gutters: { ...s.config.gutters, ...patch } } })),

      setFeltRoof: (patch) =>
        set(s => ({ config: { ...s.config, feltRoof: { ...s.config.feltRoof, ...patch } } })),
    })),
    { name: 'GarageConfig' },
  ),
);
