'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { DEFAULT_GROUND, type GroundConfig } from '@/config/settings';

interface GroundPlaneProps {
  config?: GroundConfig;
}

export default function GroundPlane({ config = DEFAULT_GROUND }: GroundPlaneProps) {
  const texture = useLoader(TextureLoader, config.spriteUrl);

  const material = useMemo(() => {
    const t = texture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    const tiles = config.planeSize / config.tileSize;
    t.repeat.set(tiles, tiles);
    t.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map: t,
      color: new THREE.Color(config.color),
      roughness: 0.9,
      metalness: 0.0,
    });
  // spriteUrl/tileSize/planeSize/color are primitives — safe as deps
  }, [texture, config.spriteUrl, config.tileSize, config.planeSize, config.color]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.005, 0]}
      receiveShadow
    >
      <planeGeometry args={[config.planeSize, config.planeSize]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
