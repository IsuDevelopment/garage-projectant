'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS, type ConfiguratorSettings } from './settings';

const SettingsContext = createContext<ConfiguratorSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: ConfiguratorSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): ConfiguratorSettings {
  return useContext(SettingsContext);
}
