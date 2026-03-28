'use client';

import { Suspense } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { useUIStore } from '@/store/useUIStore';
import GarageWalls from './GarageWalls';
import GarageRoof from './GarageRoof';
import GateModel from '@/features/gate/components/GateModel';
import DoorModel from '@/features/doors/components/DoorModel';
import GarageGutters from '@/features/gutters/components/GarageGutters';
import GarageAdditionalFeatures from '@/features/additional-services/components/GarageAdditionalFeatures';

export default function GarageModel() {
  const config   = useConfigStore(s => s.config);
  const hideRoof = useUIStore(s => s.hideRoof);
  const { width: W, height: H, depth: D } = config.dimensions;

  return (
    <group>
      <Suspense fallback={null}>
        <GarageWalls />
      </Suspense>
      {!hideRoof && (
        <Suspense fallback={null}>
          <GarageRoof />
        </Suspense>
      )}
      {config.gates.map(gate => (
        <Suspense key={gate.id} fallback={null}>
          <GateModel
            gate={gate}
            garageWidth={W}
            garageHeight={H}
            garageDepth={D}
          />
        </Suspense>
      ))}
            {config.doors.map(door => (
              <Suspense key={door.id} fallback={null}>
                <DoorModel
                  door={door}
                  garageWidth={W}
                  garageDepth={D}
                />
              </Suspense>
            ))}
      <Suspense fallback={null}>
        <GarageGutters />
      </Suspense>
      <Suspense fallback={null}>
        <GarageAdditionalFeatures />
      </Suspense>
    </group>
  );
}
