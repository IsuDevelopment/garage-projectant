'use client';

import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useSettingsContext } from '@/config/SettingsContext';
import { getWindowFinishes, getWindowGlazings } from '@/config/settings';
import { WindowConfig } from '@/store/types';
import { useUIStore } from '@/store/useUIStore';

interface WindowModelProps {
  windowObj: WindowConfig;
  garageWidth: number;
  garageDepth: number;
}

function windowTransform(
  windowObj: WindowConfig,
  W: number,
  D: number,
): { position: [number, number, number]; rotationY: number } {
  const span = windowObj.wall === 'front' || windowObj.wall === 'back' ? W : D;
  const cx = windowObj.positionX + windowObj.width / 2 - span / 2;
  const y = windowObj.sillHeight + windowObj.height / 2;

  switch (windowObj.wall) {
    case 'front': return { position: [cx, y, D / 2 + 0.012], rotationY: 0 };
    case 'back': return { position: [-cx, y, -D / 2 - 0.012], rotationY: Math.PI };
    case 'left': return { position: [-W / 2 - 0.012, y, cx], rotationY: Math.PI / 2 };
    case 'right': return { position: [W / 2 + 0.012, y, -cx], rotationY: -Math.PI / 2 };
  }
}

export default function WindowModel({ windowObj, garageWidth: W, garageDepth: D }: WindowModelProps) {
  const { selectedWindowId, setSelectedWindow } = useUIStore();
  const settings = useSettingsContext();

  const isSelected = selectedWindowId === windowObj.id;
  const isDouble = windowObj.typeSlug === 'double';

  const finish = getWindowFinishes(settings).find(f => f.slug === windowObj.finish);
  const color = finish?.colors.find(c => c.slug === windowObj.colorSlug)?.color ?? '#4a4a4a';
  const glazing = getWindowGlazings(settings).find(g => g.slug === windowObj.glazingSlug);

  const { position, rotationY } = windowTransform(windowObj, W, D);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    setSelectedWindow(isSelected ? null : windowObj.id);
  }

  const frameDepth = 0.04;
  const frameThickness = 0.05;
  const fauxGlassDepth = 0.006;
  const fauxGlassColor = glazing?.chambers === 3 ? '#9fb9d8' : '#8fb4dd';
  // Keep the whole window assembly fully in front of the wall to prevent side strips
  // from clipping/z-fighting with the wall mesh at grazing camera angles.
  const frameZ = frameDepth / 2 + 0.002;

  const innerW = Math.max(0.1, windowObj.width - frameThickness * 2);
  const innerH = Math.max(0.1, windowObj.height - frameThickness * 2);

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
      {/* Frame only: four strips with a real hole in the middle */}
      <mesh position={[0, windowObj.height / 2 - frameThickness / 2, frameZ]} castShadow>
        <boxGeometry args={[windowObj.width, frameThickness, frameDepth]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={windowObj.finish === 'aluminium' ? 0.45 : 0.18} />
      </mesh>
      <mesh position={[0, -windowObj.height / 2 + frameThickness / 2, frameZ]} castShadow>
        <boxGeometry args={[windowObj.width, frameThickness, frameDepth]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={windowObj.finish === 'aluminium' ? 0.45 : 0.18} />
      </mesh>
      <mesh position={[-windowObj.width / 2 + frameThickness / 2, 0, frameZ]} castShadow>
        <boxGeometry args={[frameThickness, innerH, frameDepth]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={windowObj.finish === 'aluminium' ? 0.45 : 0.18} />
      </mesh>
      <mesh position={[windowObj.width / 2 - frameThickness / 2, 0, frameZ]} castShadow>
        <boxGeometry args={[frameThickness, innerH, frameDepth]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={windowObj.finish === 'aluminium' ? 0.45 : 0.18} />
      </mesh>

      {/* Lightweight fake glass panel (opaque, no transparency cost) */}
      <mesh position={[0, 0, frameZ + frameDepth / 2 - fauxGlassDepth / 2]} receiveShadow>
        <boxGeometry args={[innerW * 0.96, innerH * 0.96, fauxGlassDepth]} />
        <meshStandardMaterial color={fauxGlassColor} roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Vertical divider for double-wing window */}
      {isDouble && (
        <mesh position={[0, 0, frameZ + frameDepth / 2 - 0.004]} castShadow>
          <boxGeometry args={[0.04, innerH * 0.98, 0.02]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={windowObj.finish === 'aluminium' ? 0.45 : 0.18} />
        </mesh>
      )}

      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(windowObj.width + 0.06, windowObj.height + 0.06, frameDepth + 0.02)]} />
          <lineBasicMaterial color="#ffcc00" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
