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

export interface ExpandGarageDialogState {
  open:              boolean;
  /** Which garage dimension needs to grow */
  dimension:         'width' | 'depth' | 'height' | null;
  /** The new value to set (in metres) */
  requiredMeters:    number;
  /** The current garage dimension value (in metres) for display */
  currentMeters:     number;
  /** Gate being edited */
  gateId:            string | null;
  /** Gate type slug to apply after expansion (string to avoid circular import) */
  pendingGateType:   string | null;
  /** Gate width in metres to apply after expansion */
  pendingGateWidth:  number | null;
  /** Gate height in metres to apply after expansion */
  pendingGateHeight: number | null;
}

interface UIState {
  selectedGateId: string | null;
  selectedDoorId: string | null;
  activePanel: 'dimensions' | 'roof' | 'gates' | 'construction';
  hideRoof: boolean;
  showSky: boolean;
  showClouds: boolean;
  showTrees: boolean;
  collisionDialog: CollisionDialogState;
  expandGarageDialog: ExpandGarageDialogState;
  setSelectedGate:        (id: string | null) => void;
  setSelectedDoor:        (id: string | null) => void;
  setActivePanel:         (panel: UIState['activePanel']) => void;
  setHideRoof:            (hide: boolean) => void;
  setShowSky:             (show: boolean) => void;
  setShowClouds:          (show: boolean) => void;
  setShowTrees:           (show: boolean) => void;
  showCollisionDialog:    (pending: GarageDimensions, conflicts: CollisionConflict[]) => void;
  closeCollisionDialog:   () => void;
  showExpandGarageDialog: (params: Omit<ExpandGarageDialogState, 'open'>) => void;
  closeExpandGarageDialog:() => void;
}

const EXPAND_CLOSED: ExpandGarageDialogState = {
  open: false, dimension: null, requiredMeters: 0, currentMeters: 0,
  gateId: null, pendingGateType: null, pendingGateWidth: null, pendingGateHeight: null,
};

export const useUIStore = create<UIState>()((set) => ({
  selectedGateId: null,
  selectedDoorId: null,
  activePanel: 'dimensions',
  hideRoof: false,
  showSky: true,
  showClouds: true,
  showTrees: true,
  collisionDialog: { open: false, pendingDimensions: null, conflicts: [] },
  expandGarageDialog: { ...EXPAND_CLOSED },
  setSelectedGate:      (id)     => set({ selectedGateId: id }),
  setSelectedDoor:      (id)     => set({ selectedDoorId: id }),
  setActivePanel:       (panel)  => set({ activePanel: panel }),
  setHideRoof:          (hide)   => set({ hideRoof: hide }),
  setShowSky:           (show)   => set({ showSky: show }),
  setShowClouds:        (show)   => set({ showClouds: show }),
  setShowTrees:         (show)   => set({ showTrees: show }),
  showCollisionDialog:  (pending, conflicts) =>
    set({ collisionDialog: { open: true, pendingDimensions: pending, conflicts } }),
  closeCollisionDialog: () =>
    set({ collisionDialog: { open: false, pendingDimensions: null, conflicts: [] } }),
  showExpandGarageDialog: (params) =>
    set({ expandGarageDialog: { open: true, ...params } }),
  closeExpandGarageDialog: () =>
    set({ expandGarageDialog: { ...EXPAND_CLOSED } }),
}));
