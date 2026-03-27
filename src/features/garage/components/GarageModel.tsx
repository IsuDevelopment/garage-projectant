'use client';

import { Suspense } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import GarageWalls from './GarageWalls';
import GarageRoof from './GarageRoof';
import GateModel from '@/features/gate/components/GateModel';

export default function GarageModel() {
  const config = useConfigStore(s => s.config);
  const { width: W, height: H, depth: D } = config.dimensions;

  return (
    <group>
      <Suspense fallback={null}>
        <GarageWalls />
      </Suspense>
      <Suspense fallback={null}>
        <GarageRoof />
      </Suspense>
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
    </group>
  );
}
