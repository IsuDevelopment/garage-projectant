'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { MaterialConfig } from '@/store/types';

/** Sprite file paths (static assets in /public/textures/) */
const SPRITE_PATHS: Record<string, string> = {
  trapez:         '/textures/trapez.png',
  blachodachowka: '/textures/blachodachowka.png',
  rabek:          '/textures/rabek.png',
};

interface SpriteMaterialProps {
  config: MaterialConfig;
  worldWidth?: number;
  worldHeight?: number;
  tileSize?: number;
  side?: THREE.Side;
}

/**
 * Returns a three.js MeshStandardMaterial with the sprite texture tinted by
 * config.color. Recreated whenever config or sizing changes.
 */
export function useSpriteMaterial({
  config,
  worldWidth = 1,
  worldHeight = 1,
  tileSize = 0.5,
  side = THREE.FrontSide,
}: SpriteMaterialProps): THREE.MeshStandardMaterial {
  const path = config.customSpriteUrl ?? SPRITE_PATHS[config.type] ?? SPRITE_PATHS['trapez'];
  const texture = useLoader(TextureLoader, path);

  return useMemo(() => {
    const t = texture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(worldWidth / tileSize, worldHeight / tileSize);
    t.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map: t,
      color: new THREE.Color(config.color),
      side,
      metalness: 0.3,
      roughness: 0.7,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, config.type, config.color, config.customSpriteUrl, worldWidth, worldHeight, tileSize, side]);
}

/** Resolve effective material: element-level overrides global */
export function effectiveMaterial(
  elementMat: MaterialConfig | null,
  globalMat: MaterialConfig,
): MaterialConfig {
  return elementMat ?? globalMat;
}
