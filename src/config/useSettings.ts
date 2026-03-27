/**
 * Settings loader — Phase 1: returns the bundled JSON defaults synchronously.
 *
 * Phase 2 (API-driven):
 *   Replace the body with a data-fetching hook, e.g. useSWR or React Query:
 *
 *   const { data } = useSWR<ConfiguratorSettings>(
 *     apiKey ? `/api/settings?apiKey=${encodeURIComponent(apiKey)}` : null,
 *     fetcher,
 *   );
 *   return data ?? DEFAULT_SETTINGS;
 */

import { DEFAULT_SETTINGS, type ConfiguratorSettings } from './settings';

export function useSettings(): ConfiguratorSettings {
  return DEFAULT_SETTINGS;
}
