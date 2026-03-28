import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AdditionalFeaturesConfig, DoorConfig, GarageConfig, GarageDimensions, GateConfig, MaterialConfig, RoofSlopeType, ProfileType, WallSide, GutterConfig, RoofFeltConfig, WindowConfig } from './types';
import { DEFAULT_SETTINGS, cmToMeters, getConstructionDefaultCm, getDoorMaxCount, getDoorTypes, getGateMaxCount, getGateTypes, getRoofPitchLimits, getWindowFinishes, getWindowGlazings, getWindowMaxCount, getWindowMinSillHeightCm, getWindowTypes } from '@/config/settings';
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
  width:         cmToMeters(getGateTypes(DEFAULT_SETTINGS)[0]?.sizes.width[0] ?? Math.round(DEFAULT_SETTINGS.gate.width.default * 100)),
  height:        cmToMeters(getGateTypes(DEFAULT_SETTINGS)[0]?.sizes.height[0] ?? Math.round(DEFAULT_SETTINGS.gate.height.default * 100)),
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
    width:  cmToMeters(getConstructionDefaultCm(DEFAULT_SETTINGS, 'width')),
    height: cmToMeters(getConstructionDefaultCm(DEFAULT_SETTINGS, 'height')),
    depth:  cmToMeters(getConstructionDefaultCm(DEFAULT_SETTINGS, 'depth')),
  },
  roof: {
    slopeType: 'double',
    pitch: getRoofPitchLimits(DEFAULT_SETTINGS, 'double').default,
    material: null,
  },
  gates: [defaultGate],
  doors: [],
  windows: [],
  construction: {
    material: { ...defaultMaterial },
    profileType: (DEFAULT_SETTINGS.construction?.profiles[0] ?? '30x40') as ProfileType,
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

  // Doors
  addDoor:    (wall?: WallSide) => DoorConfig | null;
  updateDoor: (id: string, patch: Partial<Omit<DoorConfig, 'id'>>) => void;
  removeDoor: (id: string) => void;
  canAddDoor: (wall: WallSide, newWidth: number, excludeId?: string) => boolean;

  // Windows
  addWindow:    (wall?: WallSide) => WindowConfig | null;
  updateWindow: (id: string, patch: Partial<Omit<WindowConfig, 'id'>>) => void;
  removeWindow: (id: string) => void;
  canAddWindow: (wall: WallSide, newWidth: number, excludeId?: string) => boolean;

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
  const existingWidths = [
    ...config.gates.filter(g => g.wall === wall && g.id !== excludeId).map(g => g.width),
    ...config.doors.filter(d => d.wall === wall && d.id !== excludeId).map(d => d.width),
    ...config.windows.filter(w => w.wall === wall && w.id !== excludeId).map(w => w.width),
  ];
  return gatesFitOnWall(config.dimensions, wall, existingWidths, extraWidth);
}

function toWallObjects(gates: GateConfig[], doors: DoorConfig[], windows: WindowConfig[]): WallObjectBounds[] {
  return [
    ...gates.map(g => ({ id: g.id, positionX: g.positionX, bottomY: 0, width: g.width, height: g.height, wall: g.wall })),
    ...doors.map(d => ({ id: d.id, positionX: d.positionX, bottomY: 0, width: d.width, height: d.height, wall: d.wall })),
    ...windows.map(w => ({ id: w.id, positionX: w.positionX, bottomY: w.sillHeight, width: w.width, height: w.height, wall: w.wall })),
  ];
}

function gateName(gate: GateConfig, index: number): string {
  const typeLabels: Record<string, string> = {
    tilt: 'Uchylna', 'double-wing': 'Dwuskrzydłowa', sectional: 'Segmentowa',
  };
  return `Brama ${index + 1} — ${typeLabels[gate.type] ?? gate.type} ${gate.width.toFixed(1)}×${gate.height.toFixed(1)}m (${WALL_LABELS[gate.wall]})`;
}

function doorName(door: DoorConfig, index: number): string {
  const typeLabels: Record<string, string> = { single: 'Jednoskrzydłowe', double: 'Dwuskrzydłowe' };
  return `Drzwi ${index + 1} — ${typeLabels[door.typeSlug] ?? door.typeSlug} ${door.width.toFixed(2)}×${door.height.toFixed(2)}m (${WALL_LABELS[door.wall]})`;
}

function windowName(window: WindowConfig, index: number): string {
  const typeLabels: Record<string, string> = { single: 'Jednoskrzydłowe', double: 'Dwuskrzydłowe' };
  return `Okno ${index + 1} — ${typeLabels[window.typeSlug] ?? window.typeSlug} ${window.width.toFixed(2)}×${window.height.toFixed(2)}m (${WALL_LABELS[window.wall]})`;
}

function buildCollisionConflicts(config: GarageConfig, newDimensions: GarageDimensions) {
  const conflicts = findDimensionCollisions(toWallObjects(config.gates, config.doors, config.windows), newDimensions);
  return conflicts.map(c => {
    const idx   = config.gates.findIndex(g => g.id === c.id);
    if (idx !== -1) return { id: c.id, name: gateName(config.gates[idx], idx) };
    const dIdx = config.doors.findIndex(d => d.id === c.id);
    if (dIdx !== -1) return { id: c.id, name: doorName(config.doors[dIdx], dIdx) };
    const wIdx = config.windows.findIndex(w => w.id === c.id);
    if (wIdx !== -1) return { id: c.id, name: windowName(config.windows[wIdx], wIdx) };
    return { id: c.id, name: `Obiekt (${c.wall})` };
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
          const limits = getRoofPitchLimits(DEFAULT_SETTINGS, isDoubleSlope ? 'double' : 'single');
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
        const defaultGateType = getGateTypes(settings)[0];
        const newWidth = cmToMeters(defaultGateType?.sizes.width[0] ?? Math.round(settings.gate.width.default * 100));
        const newHeight = cmToMeters(defaultGateType?.sizes.height[0] ?? Math.round(settings.gate.height.default * 100));

        if (config.gates.length >= getGateMaxCount(settings)) return null;
        if (!gateFitsCheck(config, wall, newWidth)) return null;

        // Find first available slot on the wall
        const wallW   = wallWidthForSide(config.dimensions, wall);
        const wallObjs = toWallObjects(config.gates, config.doors, config.windows).filter(o => o.wall === wall);
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

      addDoor: (wall = 'front') => {
        const { config } = get();
        const settings = DEFAULT_SETTINGS;
        const firstType = getDoorTypes(settings)[0];
        if (!firstType) return null;
        const firstSize = firstType.sizes[0];
        if (!firstSize) return null;

        const newWidth  = cmToMeters(firstSize.width);
        const newHeight = cmToMeters(firstSize.height);

        if (config.doors.length >= getDoorMaxCount(settings)) return null;
        if (!gateFitsCheck(config, wall, newWidth)) return null;

        const wallW   = wallWidthForSide(config.dimensions, wall);
        const wallObjs = toWallObjects(config.gates, config.doors, config.windows).filter(o => o.wall === wall);
        const { min, max, blockedRanges } = computePositionBounds(wallW, newWidth, wallObjs, '__new__');
        if (max < min) return null;
        const posX = snapToNearestValid(min, blockedRanges, min, max);

        const door: DoorConfig = {
          id: uuidv4(),
          typeSlug: firstType.slug,
          width: newWidth,
          height: newHeight,
          openDirection: 'left',
          positionX: posX,
          wall,
          color: '#c0c8d0',
          material: null,
        };

        set(s => ({ config: { ...s.config, doors: [...s.config.doors, door] } }));
        return door;
      },

      updateDoor: (id, patch) =>
        set(s => ({
          config: {
            ...s.config,
            doors: s.config.doors.map(d => (d.id === id ? { ...d, ...patch } : d)),
          },
        })),

      removeDoor: (id) =>
        set(s => ({
          config: { ...s.config, doors: s.config.doors.filter(d => d.id !== id) },
        })),

      canAddDoor: (wall, newWidth, excludeId) => {
        const { config } = get();
        const allObjs = toWallObjects(config.gates, config.doors.filter(d => d.id !== excludeId), config.windows);
        const onWall  = allObjs.filter(o => o.wall === wall).map(o => o.width);
        return gatesFitOnWall(config.dimensions, wall, onWall, newWidth);
      },

      addWindow: (wall = 'front') => {
        const { config } = get();
        const settings = DEFAULT_SETTINGS;
        const firstType = getWindowTypes(settings)[0];
        const firstSize = firstType?.sizes[0];
        const firstFinish = getWindowFinishes(settings)[0];
        const firstColor = firstFinish?.colors[0];
        const firstGlazing = getWindowGlazings(settings)[0];
        if (!firstType || !firstSize || !firstFinish || !firstColor || !firstGlazing) return null;

        const newWidth  = cmToMeters(firstSize.width);
        const newHeight = cmToMeters(firstSize.height);
        const sillHeight = cmToMeters(getWindowMinSillHeightCm(settings));

        if (config.windows.length >= getWindowMaxCount(settings)) return null;
        if (!gateFitsCheck(config, wall, newWidth)) return null;

        const wallW   = wallWidthForSide(config.dimensions, wall);
        const wallObjs = toWallObjects(config.gates, config.doors, config.windows).filter(o => o.wall === wall);
        const { min, max, blockedRanges } = computePositionBounds(wallW, newWidth, wallObjs, '__new__');
        if (max < min) return null;
        const posX = snapToNearestValid(min, blockedRanges, min, max);

        const windowObj: WindowConfig = {
          id: uuidv4(),
          typeSlug: firstType.slug,
          wall,
          positionX: posX,
          sillHeight,
          width: newWidth,
          height: newHeight,
          glazingSlug: firstGlazing.slug,
          finish: firstFinish.slug,
          colorSlug: firstColor.slug,
        };

        set(s => ({ config: { ...s.config, windows: [...s.config.windows, windowObj] } }));
        return windowObj;
      },

      updateWindow: (id, patch) =>
        set(s => ({
          config: {
            ...s.config,
            windows: s.config.windows.map(w => (w.id === id ? { ...w, ...patch } : w)),
          },
        })),

      removeWindow: (id) =>
        set(s => ({
          config: { ...s.config, windows: s.config.windows.filter(w => w.id !== id) },
        })),

      canAddWindow: (wall, newWidth, excludeId) => {
        const { config } = get();
        const allObjs = toWallObjects(config.gates, config.doors, config.windows.filter(w => w.id !== excludeId));
        const onWall  = allObjs.filter(o => o.wall === wall).map(o => o.width);
        return gatesFitOnWall(config.dimensions, wall, onWall, newWidth);
      },

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
