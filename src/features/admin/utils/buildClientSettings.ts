import type { ConfiguratorSettings } from '@/config/settings';
import { DEFAULT_SETTINGS } from '@/config/settings';
import type { Feature } from '@prisma/client';

/**
 * Map enabled client features to a ConfiguratorSettings object.
 * Only options that have a corresponding enabled feature are included.
 * Falls back to DEFAULT_SETTINGS for structural defaults (limits, pitch config, etc.).
 */
export function buildClientSettings(
  clientName: string,
  clientId: string,
  enabledFeatures: Feature[],
): ConfiguratorSettings {
  const keys = new Set(enabledFeatures.map(f => f.key));

  const availableMaterials: ConfiguratorSettings['availableMaterials'] = [];
  if (keys.has('material_trapez'))         availableMaterials.push('trapez');
  if (keys.has('material_blachodachowka')) availableMaterials.push('blachodachowka');
  if (keys.has('material_rabek'))          availableMaterials.push('rabek');

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

  // Extended dimension limits if the advanced feature is enabled
  const dimensions = keys.has('dimension_extended')
    ? {
        width:  { ...DEFAULT_SETTINGS.dimensions.width,  max: 20 },
        height: { ...DEFAULT_SETTINGS.dimensions.height, max: 6  },
        depth:  { ...DEFAULT_SETTINGS.dimensions.depth,  max: 25 },
      }
    : DEFAULT_SETTINGS.dimensions;

  return {
    ...DEFAULT_SETTINGS,
    id:                  clientId,
    name:                clientName,
    companyId:           clientId,
    dimensions,
    availableMaterials:  availableMaterials.length  ? availableMaterials  : DEFAULT_SETTINGS.availableMaterials,
    availableRoofSlopes: availableRoofSlopes.length ? availableRoofSlopes : DEFAULT_SETTINGS.availableRoofSlopes,
    availableGateTypes:  availableGateTypes.length  ? availableGateTypes  : DEFAULT_SETTINGS.availableGateTypes,
    availableProfiles:   availableProfiles.length   ? availableProfiles   : DEFAULT_SETTINGS.availableProfiles,
    ground: keys.has('custom_ground') ? DEFAULT_SETTINGS.ground : DEFAULT_SETTINGS.ground,
  };
}
