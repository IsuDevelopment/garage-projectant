'use client';

import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useSpriteMaterial, effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { GateConfig } from '@/store/types';
import { useUIStore } from '@/store/useUIStore';
import { useConfigStore } from '@/store/useConfigStore';

interface GateModelProps {
  gate: GateConfig;
  garageWidth:  number;
  garageHeight: number;
  garageDepth:  number;
}

/** Returns position and rotation of the gate mesh based on which wall it's on */
function wallTransform(
  gate: GateConfig,
  W: number,
  H: number,
  D: number,
): { position: [number, number, number]; rotationY: number } {
  const cx = gate.positionX + gate.width / 2 - W / 2; // centred offset on wall
  const y  = gate.height / 2;

  switch (gate.wall) {
    case 'front':
      return { position: [cx, y, D / 2 + 0.01], rotationY: 0 };
    case 'back':
      return { position: [-cx, y, -D / 2 - 0.01], rotationY: Math.PI };
    case 'left':
      return { position: [-W / 2 - 0.01, y, cx], rotationY: Math.PI / 2 };
    case 'right':
      return { position: [W / 2 + 0.01, y, -cx], rotationY: -Math.PI / 2 };
  }
}

export default function GateModel({ gate, garageWidth: W, garageHeight: H, garageDepth: D }: GateModelProps) {
  const { selectedGateId, setSelectedGate } = useUIStore();
  const globalMat = useConfigStore(s => s.config.construction.material);

  const isSelected = selectedGateId === gate.id;
  const matConfig  = effectiveMaterial(gate.material, { ...globalMat, color: gate.color });

  const left  = useSpriteMaterial({ config: matConfig, worldWidth: gate.width / 2, worldHeight: gate.height });
  const right = useSpriteMaterial({ config: matConfig, worldWidth: gate.width / 2, worldHeight: gate.height });
  const single = useSpriteMaterial({ config: matConfig, worldWidth: gate.width, worldHeight: gate.height });

  const { position, rotationY } = wallTransform(gate, W, H, D);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    setSelectedGate(isSelected ? null : gate.id);
  }

  if (gate.type === 'double-wing') {
    const hw = gate.width / 2;
    return (
      <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
        {/* Left wing */}
        <mesh position={[-hw / 2, 0, 0]} castShadow>
          <planeGeometry args={[hw, gate.height]} />
          <primitive object={left} attach="material" />
        </mesh>
        {/* Right wing */}
        <mesh position={[hw / 2, 0, 0]} castShadow>
          <planeGeometry args={[hw, gate.height]} />
          <primitive object={right} attach="material" />
        </mesh>
        {/* Selection highlight border */}
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(gate.width + 0.05, gate.height + 0.05, 0.02)]} />
            <lineBasicMaterial color="#ffcc00" linewidth={2} />
          </lineSegments>
        )}
        {/* Divider line */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.04, gate.height, 0.02]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    );
  }

  // Tilt (uchylna) — single panel
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
      <mesh castShadow>
        <planeGeometry args={[gate.width, gate.height]} />
        <primitive object={single} attach="material" />
      </mesh>
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(gate.width + 0.05, gate.height + 0.05, 0.02)]} />
          <lineBasicMaterial color="#ffcc00" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
