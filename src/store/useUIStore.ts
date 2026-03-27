import { create } from 'zustand';

interface UIState {
  selectedGateId: string | null;
  activePanel: 'dimensions' | 'roof' | 'gates' | 'construction';
  setSelectedGate: (id: string | null) => void;
  setActivePanel:  (panel: UIState['activePanel']) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedGateId: null,
  activePanel: 'dimensions',
  setSelectedGate: (id) => set({ selectedGateId: id }),
  setActivePanel:  (panel) => set({ activePanel: panel }),
}));
