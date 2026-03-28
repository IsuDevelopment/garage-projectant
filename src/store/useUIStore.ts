import { create } from 'zustand';

interface UIState {
  selectedGateId: string | null;
  activePanel: 'dimensions' | 'roof' | 'gates' | 'construction';
  hideRoof: boolean;
  showSky: boolean;
  showClouds: boolean;
  showTrees: boolean;
  setSelectedGate: (id: string | null) => void;
  setActivePanel:  (panel: UIState['activePanel']) => void;
  setHideRoof:     (hide: boolean) => void;
  setShowSky:      (show: boolean) => void;
  setShowClouds:   (show: boolean) => void;
  setShowTrees:    (show: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedGateId: null,
  activePanel: 'dimensions',
  hideRoof: false,
  showSky: true,
  showClouds: true,
  showTrees: true,
  setSelectedGate: (id) => set({ selectedGateId: id }),
  setActivePanel:  (panel) => set({ activePanel: panel }),
  setHideRoof:     (hide) => set({ hideRoof: hide }),
  setShowSky:      (show) => set({ showSky: show }),
  setShowClouds:   (show) => set({ showClouds: show }),
  setShowTrees:    (show) => set({ showTrees: show }),
}));
