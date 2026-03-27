import { create } from 'zustand';

interface UIState {
  selectedGateId: string | null;
  activePanel: 'dimensions' | 'roof' | 'gates' | 'construction';
  hideRoof: boolean;
  setSelectedGate: (id: string | null) => void;
  setActivePanel:  (panel: UIState['activePanel']) => void;
  setHideRoof:     (hide: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedGateId: null,
  activePanel: 'dimensions',
  hideRoof: false,
  setSelectedGate: (id) => set({ selectedGateId: id }),
  setActivePanel:  (panel) => set({ activePanel: panel }),
  setHideRoof:     (hide) => set({ hideRoof: hide }),
}));
