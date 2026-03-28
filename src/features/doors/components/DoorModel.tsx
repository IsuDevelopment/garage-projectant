'use client';

import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useSpriteMaterial, effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { DoorConfig } from '@/store/types';
import { useUIStore } from '@/store/useUIStore';
import { useConfigStore } from '@/store/useConfigStore';

interface DoorModelProps {
  door: DoorConfig;
  garageWidth: number;
  garageDepth: number;
}

// Same coordinate logic as GateModel — positionX from left edge of wall when viewed from outside.
function doorTransform(
  door: DoorConfig,
  W: number,
  D: number,
): { position: [number, number, number]; rotationY: number } {
  // Use the span of the wall this door sits on for correct centering
  const span = door.wall === 'front' || door.wall === 'back' ? W : D;
  const cx = door.positionX + door.width / 2 - span / 2;
  const y  = door.height / 2;

  switch (door.wall) {
    case 'front':  return { position: [ cx, y,  D / 2 + 0.01], rotationY: 0 };
    case 'back':   return { position: [-cx, y, -D / 2 - 0.01], rotationY: Math.PI };
    case 'left':   return { position: [-W / 2 - 0.01, y,  cx], rotationY:  Math.PI / 2 };
    case 'right':  return { position: [ W / 2 + 0.01, y, -cx], rotationY: -Math.PI / 2 };
  }
}

function DoorFrame({ width, height }: { width: number; height: number }) {
  const ft = 0.05;
  const fd = 0.025;
  return (
    <group position={[0, 0, 0.012]}>
      {/* Top */}
      <mesh position={[0, height / 2 + ft / 2, 0]} castShadow>
        <boxGeometry args={[width + ft * 2, ft, fd]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -height / 2 - ft / 2, 0]} castShadow>
        <boxGeometry args={[width + ft * 2, ft, fd]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Left jamb */}
      <mesh position={[-width / 2 - ft / 2, 0, 0]} castShadow>
        <boxGeometry args={[ft, height, fd]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Right jamb */}
      <mesh position={[width / 2 + ft / 2, 0, 0]} castShadow>
        <boxGeometry args={[ft, height, fd]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
    </group>
  );
}

function DoorHinge({ x, y, z = 0.02 }: { x: number; y: number; z?: number }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[0.025, 0.12, 0.025]} />
      <meshStandardMaterial color="#c0c0c0" roughness={0.4} metalness={0.6} />
    </mesh>
  );
}

function DoorHandle({ x, y }: { x: number; y: number }) {
  const z = 0.024;
  return (
    <group position={[x, y, z]}>
      {/* Vertical grip */}
      <mesh castShadow>
        <boxGeometry args={[0.02, 0.13, 0.025]} />
        <meshStandardMaterial color="#818181" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Horizontal lever */}
      <mesh position={[0.038, -0.055, 0]} castShadow>
        <boxGeometry args={[0.06, 0.02, 0.025]} />
        <meshStandardMaterial color="#818181" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

export default function DoorModel({ door, garageWidth: W, garageDepth: D }: DoorModelProps) {
  const { selectedDoorId, setSelectedDoor } = useUIStore();
  const globalMat = useConfigStore(s => s.config.construction.material);

  const isSelected  = selectedDoorId === door.id;
  const isDouble    = door.typeSlug === 'double';
  const panelW      = isDouble ? door.width / 2 : door.width;
  const matConfig   = effectiveMaterial(door.material, { ...globalMat, color: door.color });

  const leftMat  = useSpriteMaterial({ config: matConfig, worldWidth: panelW, worldHeight: door.height });
  // For single doors only one panel is rendered; the hook must still be called unconditionally.
  const rightMat = useSpriteMaterial({ config: matConfig, worldWidth: panelW, worldHeight: door.height });

  const { position, rotationY } = doorTransform(door, W, D);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    setSelectedDoor(isSelected ? null : door.id);
  }

  const hingeTopY = door.height * 0.3;
  const hingeBotY = -door.height * 0.3;

  if (isDouble) {
    const hw = door.width / 2;
    return (
      <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
        <DoorFrame width={door.width} height={door.height} />
        {/* Left leaf */}
        <mesh position={[-hw / 2, 0, 0]} castShadow>
          <planeGeometry args={[hw, door.height]} />
          <primitive object={leftMat} attach="material" />
        </mesh>
        {/* Right leaf */}
        <mesh position={[hw / 2, 0, 0]} castShadow>
          <planeGeometry args={[hw, door.height]} />
          <primitive object={rightMat} attach="material" />
        </mesh>
        {/* Center strip */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.03, door.height, 0.015]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        {/* Hinges — outer edges */}
        <DoorHinge x={-door.width / 2 + 0.025} y={hingeTopY} />
        <DoorHinge x={-door.width / 2 + 0.025} y={hingeBotY} />
        <DoorHinge x={door.width / 2 - 0.025} y={hingeTopY} />
        <DoorHinge x={door.width / 2 - 0.025} y={hingeBotY} />
        {/* Handles near center */}
        <DoorHandle x={-0.07} y={0} />
        <DoorHandle x={0.07}  y={0} />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(door.width + 0.06, door.height + 0.06, 0.02)]} />
            <lineBasicMaterial color="#ffcc00" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  // Single door — hinges on left, handle on right side
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
      <DoorFrame width={door.width} height={door.height} />
      <mesh position={[0, 0, 0]} castShadow>
        <planeGeometry args={[door.width, door.height]} />
        <primitive object={leftMat} attach="material" />
      </mesh>
      <DoorHinge x={-door.width / 2 + 0.025} y={hingeTopY} />
      <DoorHinge x={-door.width / 2 + 0.025} y={hingeBotY} />
      <DoorHandle x={door.width * 0.35} y={0} />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(door.width + 0.06, door.height + 0.06, 0.02)]} />
          <lineBasicMaterial color="#ffcc00" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
