'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '@/store/useConfigStore';
import { buildRoofGeometry } from '../utils/geometry';

/** Pre-computes roof BufferGeometry whenever relevant config changes */
export function useGarageGeometry() {
  const dim      = useConfigStore(s => s.config.dimensions);
  const roof     = useConfigStore(s => s.config.roof);

  const roofGeo = useMemo(
    () => buildRoofGeometry(dim, roof.slopeType, roof.pitch),
    [dim, roof.slopeType, roof.pitch],
  );

  return { dim, roof, roofGeo };
}
