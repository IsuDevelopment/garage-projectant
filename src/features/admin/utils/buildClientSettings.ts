import type { ConfiguratorSettings } from '@/config/settings';
import { DEFAULT_SETTINGS } from '@/config/settings';
import type { Feature } from '@prisma/client';

/**
 * Map enabled client features to a ConfiguratorSettings object.
 * Supports both the legacy (availableGateTypes / dimensions) schema and the
 * new (gates.types / construction.sizes) schema introduced in the phase-2 refactor.
 */
export function buildClientSettings(
  clientName: string,
  clientId: string,
  enabledFeatures: Feature[],
): ConfiguratorSettings {
  const keys = new Set(enabledFeatures.map(f => f.key));

  const materials = DEFAULT_SETTINGS.materials.filter(m => keys.has(`material_${m.slug}`));

  // ── Legacy roof / gate / profile arrays (kept for backward compat) ────────
  const availableRoofSlopes: ConfiguratorSettings['availableRoofSlopes'] = [];
  if (keys.has('roof_single')) availableRoofSlopes.push('right', 'left', 'front', 'back');
  if (keys.has('roof_double')) availableRoofSlopes.push('double');
  if (keys.has('roof_double_front_back')) availableRoofSlopes.push('double-front-back');

  const availableGateTypes: ConfiguratorSettings['availableGateTypes'] = [];
  if (keys.has('gate_tilt'))        availableGateTypes.push('tilt');
  if (keys.has('gate_double_wing')) availableGateTypes.push('double-wing');
  if (keys.has('gate_sectional'))   availableGateTypes.push('sectional');

  const availableProfiles: ConfiguratorSettings['availableProfiles'] = [];
  if (keys.has('profile_30x30')) availableProfiles.push('30x30');
  if (keys.has('profile_30x40')) availableProfiles.push('30x40');

  // ── New schema: per-type gate catalog ─────────────────────────────────────
  const allGateTypeDefs = DEFAULT_SETTINGS.gates?.types ?? [];
  const filteredGateTypeDefs = allGateTypeDefs.filter(t => {
    if (t.slug === 'tilt')        return keys.has('gate_tilt');
    if (t.slug === 'double-wing') return keys.has('gate_double_wing');
    if (t.slug === 'sectional')   return keys.has('gate_sectional');
    return true; // unknown types default to included
  });

  const gates: ConfiguratorSettings['gates'] = {
    maxCount: DEFAULT_SETTINGS.gates?.maxCount ?? DEFAULT_SETTINGS.gate.maxCount,
    types: filteredGateTypeDefs.length ? filteredGateTypeDefs : allGateTypeDefs,
  };

  // ── New schema: construction / dimension sizes ────────────────────────────
  const dimensions = keys.has('dimension_extended')
    ? {
        width:  { ...DEFAULT_SETTINGS.dimensions.width,  max: 20 },
        height: { ...DEFAULT_SETTINGS.dimensions.height, max: 6  },
        depth:  { ...DEFAULT_SETTINGS.dimensions.depth,  max: 25 },
      }
    : DEFAULT_SETTINGS.dimensions;

  // Extended construction sizes (widths/depths up to 2000 cm, height up to 600 cm)
  const construction: ConfiguratorSettings['construction'] = keys.has('dimension_extended')
    ? {
        ...DEFAULT_SETTINGS.construction!,
        sizes: {
          width:  buildExtendedSizes(DEFAULT_SETTINGS.construction?.sizes.width ?? [], 1250, 2000, 50),
          depth:  buildExtendedSizes(DEFAULT_SETTINGS.construction?.sizes.depth ?? [], 1250, 2500, 50),
          height: buildExtendedSizes(DEFAULT_SETTINGS.construction?.sizes.height ?? [], 323, 600, 10),
        },
      }
    : DEFAULT_SETTINGS.construction;

  return {
    ...DEFAULT_SETTINGS,
    id:                  clientId,
    name:                clientName,
    companyId:           clientId,
    dimensions,
    construction,
    gates,
    materials:           materials.length           ? materials           : DEFAULT_SETTINGS.materials,
    availableRoofSlopes: availableRoofSlopes.length ? availableRoofSlopes : DEFAULT_SETTINGS.availableRoofSlopes,
    availableGateTypes:  availableGateTypes.length  ? availableGateTypes  : DEFAULT_SETTINGS.availableGateTypes,
    availableProfiles:   availableProfiles.length   ? availableProfiles   : DEFAULT_SETTINGS.availableProfiles,
    ground: DEFAULT_SETTINGS.ground,
  };
}

function buildExtendedSizes(existing: number[], extendFrom: number, extendTo: number, step: number): number[] {
  const result = [...existing];
  for (let v = extendFrom; v <= extendTo; v += step) {
    if (!result.includes(v)) result.push(v);
  }
  return result;
}
