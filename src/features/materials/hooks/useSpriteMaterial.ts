'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { MaterialConfig } from '@/store/types';
import { useSettingsContext } from '@/config/SettingsContext';

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
  const settings = useSettingsContext();
  const fromSettings = settings.materials.find(m => m.slug === config.type)?.texture;
  const path = config.customSpriteUrl ?? fromSettings ?? SPRITE_PATHS[config.type] ?? SPRITE_PATHS['trapez'];
  const embossOrientation = config.subOptions?.orientation;
  const texture = useLoader(TextureLoader, path);

  return useMemo(() => {
    const t = texture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    const repeatX = worldWidth / tileSize;
    const repeatY = worldHeight / tileSize;

    // Trapez sub-feature: "horizontal" means rotate embossing by 90 degrees.
    if (config.type === 'trapez' && embossOrientation === 'horizontal') {
      t.center.set(0.5, 0.5);
      t.rotation = Math.PI / 2;
      // After rotation, swap tiling axes to preserve world-scale of the pattern.
      t.repeat.set(repeatY, repeatX);
    } else {
      t.repeat.set(repeatX, repeatY);
    }
    t.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map: t,
      color: new THREE.Color(config.color),
      side,
      metalness: 0.3,
      roughness: 0.7,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, config.type, embossOrientation, config.color, config.customSpriteUrl, worldWidth, worldHeight, tileSize, side]);
}

/** Resolve effective material: element-level overrides global */
export function effectiveMaterial(
  elementMat: MaterialConfig | null,
  globalMat: MaterialConfig,
): MaterialConfig {
  return elementMat ?? globalMat;
}
