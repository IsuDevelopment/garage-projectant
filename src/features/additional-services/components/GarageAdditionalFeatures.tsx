'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '@/store/useConfigStore';
import { useSettingsContext } from '@/config/SettingsContext';

type Point2 = [number, number];

const BASE_HEIGHT = 0.1;
const BASE_EXTRA = 0.1;
const FOOTING_SIZE = 0.4;
const CONCRETE_FALLBACK = '#8f969f';

function createConcreteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#8f969f';
  ctx.fillRect(0, 0, size, size);

  // Deterministic pseudo-noise gives a subtle concrete-like roughness.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = ((x * 53 + y * 97) % 23) - 11;
      const alpha = 0.03 + (Math.abs(v) / 11) * 0.07;
      const shade = 132 + v;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha.toFixed(3)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

function buildConcreteMaterial(color: string, texture: THREE.Texture): THREE.MeshStandardMaterial {
  const t = texture.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.needsUpdate = true;

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    map: t,
    roughnessMap: t,
    roughness: 0.96,
    metalness: 0.02,
  });
}

function distributedAxis(
  min: number,
  max: number,
  minSpacing: number,
  maxSpacing: number,
): number[] {
  const length = max - min;
  if (length <= 0) return [min];

  const safeMinSpacing = Math.max(0.2, minSpacing);
  const safeMaxSpacing = Math.max(safeMinSpacing, maxSpacing);
  const target = (safeMinSpacing + safeMaxSpacing) / 2;

  const intervalsMin = Math.max(1, Math.ceil(length / safeMaxSpacing));
  const intervalsMax = Math.max(1, Math.floor(length / safeMinSpacing));
  let intervals = Math.round(length / target);

  intervals = Math.max(intervalsMin, intervals);
  intervals = Math.min(intervals, intervalsMax);
  if (intervals < 1) intervals = intervalsMin;

  const step = length / intervals;
  const out: number[] = [];
  for (let i = 0; i <= intervals; i++) {
    out.push(min + i * step);
  }
  return out;
}

function buildFootingPositions(
  width: number,
  depth: number,
  minSpacing: number,
  maxSpacing: number,
): Point2[] {
  const halfW = width / 2;
  const halfD = depth / 2;

  const xs = distributedAxis(-halfW, halfW, minSpacing, maxSpacing);
  const zs = distributedAxis(-halfD, halfD, minSpacing, maxSpacing);

  const points: Point2[] = [];

  xs.forEach(x => {
    points.push([x, halfD]);
    points.push([x, -halfD]);
  });

  const middleZs = zs.slice(1, -1);
  middleZs.forEach(z => {
    points.push([-halfW, z]);
    points.push([halfW, z]);
  });

  return points;
}

export default function GarageAdditionalFeatures() {
  const { width, depth } = useConfigStore(s => s.config.dimensions);
  const additionalState = useConfigStore(s => s.config.additionalFeatures.anchoring);
  const settings = useSettingsContext();

  const feature = settings.additionalFeatures?.find(item => item.slug === 'anchoring' && item.enabled !== false);
  const selectedOption = feature?.options?.find(option => option.slug === additionalState?.selectedOptionSlug)
    ?? feature?.options?.[0];

  const selectedSlug = selectedOption?.slug;
  const color = selectedOption?.allowColor
    ? (additionalState?.optionColor ?? selectedOption?.defaultColor ?? CONCRETE_FALLBACK)
    : (selectedOption?.defaultColor ?? CONCRETE_FALLBACK);

  const spacingMin = selectedOption?.spacingMin ?? 1.5;
  const spacingMax = selectedOption?.spacingMax ?? 2.0;

  const texture = useMemo(() => createConcreteTexture(), []);
  const material = useMemo(() => buildConcreteMaterial(color, texture), [color, texture]);
  const footingPositions = useMemo(
    () => buildFootingPositions(width, depth, spacingMin, spacingMax),
    [width, depth, spacingMin, spacingMax],
  );

  if (!additionalState?.enabled || !selectedSlug) return null;

  const slabWidth = width + BASE_EXTRA;
  const slabDepth = depth + BASE_EXTRA;

  if (selectedSlug === 'concrete-slab' || selectedSlug === 'concrete-foundation') {
    return (
      <group>
        <mesh position={[0, BASE_HEIGHT / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[slabWidth, BASE_HEIGHT, slabDepth]} />
          <primitive object={material} attach="material" />
        </mesh>
      </group>
    );
  }

  if (selectedSlug === 'footings') {
    return (
      <group>
        {footingPositions.map(([x, z], idx) => (
          <mesh key={`${x}-${z}-${idx}`} position={[x, BASE_HEIGHT / 2, z]} receiveShadow castShadow>
            <boxGeometry args={[FOOTING_SIZE, BASE_HEIGHT, FOOTING_SIZE]} />
            <primitive object={material} attach="material" />
          </mesh>
        ))}
      </group>
    );
  }

  return null;
}
