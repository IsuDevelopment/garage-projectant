/**
 * Settings loader — reads from the public Settings API when an apiKey is available,
 * falling back to DEFAULT_SETTINGS (demo / SSR mode).
 *
 * Supports two call signatures:
 *   useSettings()              — returns DEFAULT_SETTINGS (server-side or demo)
 *   useSettings(apiKey)        — fetches /api/settings?apiKey=… via SWR, falls back to defaults
 */

'use client';

import useSWR from 'swr';
import { DEFAULT_SETTINGS, type ConfiguratorSettings } from './settings';

async function fetchSettings(url: string): Promise<ConfiguratorSettings> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
  return res.json();
}

export function useSettings(apiKey?: string | null): ConfiguratorSettings | null {
  const url = apiKey ? `/api/settings?apiKey=${encodeURIComponent(apiKey)}` : null;

  const { data } = useSWR<ConfiguratorSettings>(url, fetchSettings, {
    // No fallbackData when apiKey present — we want to wait for real settings
    fallbackData: apiKey ? undefined : DEFAULT_SETTINGS,
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
  });

  // No apiKey → default settings immediately
  if (!apiKey) return DEFAULT_SETTINGS;
  // apiKey present but not yet loaded → signal loading
  return data ?? null;
}

