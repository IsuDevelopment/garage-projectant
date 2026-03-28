import { create } from 'zustand';
import { GarageDimensions } from './types';

export interface CollisionConflict {
  id:   string;
  name: string;
}

interface CollisionDialogState {
  open:               boolean;
  pendingDimensions:  GarageDimensions | null;
  conflicts:          CollisionConflict[];
}

interface UIState {
  selectedGateId: string | null;
  activePanel: 'dimensions' | 'roof' | 'gates' | 'construction';
  hideRoof: boolean;
  showSky: boolean;
  showClouds: boolean;
  showTrees: boolean;
  collisionDialog: CollisionDialogState;
  setSelectedGate:      (id: string | null) => void;
  setActivePanel:       (panel: UIState['activePanel']) => void;
  setHideRoof:          (hide: boolean) => void;
  setShowSky:           (show: boolean) => void;
  setShowClouds:        (show: boolean) => void;
  setShowTrees:         (show: boolean) => void;
  showCollisionDialog:  (pending: GarageDimensions, conflicts: CollisionConflict[]) => void;
  closeCollisionDialog: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedGateId: null,
  activePanel: 'dimensions',
  hideRoof: false,
  showSky: true,
  showClouds: true,
  showTrees: true,
  collisionDialog: { open: false, pendingDimensions: null, conflicts: [] },
  setSelectedGate:      (id)     => set({ selectedGateId: id }),
  setActivePanel:       (panel)  => set({ activePanel: panel }),
  setHideRoof:          (hide)   => set({ hideRoof: hide }),
  setShowSky:           (show)   => set({ showSky: show }),
  setShowClouds:        (show)   => set({ showClouds: show }),
  setShowTrees:         (show)   => set({ showTrees: show }),
  showCollisionDialog:  (pending, conflicts) =>
    set({ collisionDialog: { open: true, pendingDimensions: pending, conflicts } }),
  closeCollisionDialog: () =>
    set({ collisionDialog: { open: false, pendingDimensions: null, conflicts: [] } }),
}));
