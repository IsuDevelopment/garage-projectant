'use client';

import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useSpriteMaterial, effectiveMaterial } from '@/features/materials/hooks/useSpriteMaterial';
import { GateConfig } from '@/store/types';
import { useUIStore } from '@/store/useUIStore';
import { useConfigStore } from '@/store/useConfigStore';

interface GateModelProps {
  gate: GateConfig;
  garageWidth: number;
  garageHeight: number;
  garageDepth: number;
}

function GateFrame({ width, height }: { width: number; height: number }) {
  const frameThickness = 0.05;
  const frameDepth = 0.025;

  return (
    <group position={[0, 0, 0.012]}>
      <mesh position={[0, height / 2 + frameThickness / 2, 0]} castShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[0, -height / 2 - frameThickness / 2, 0]} castShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[-width / 2 - frameThickness / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[width / 2 + frameThickness / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.15} />
      </mesh>
    </group>
  );
}

function GateHinges({ width, height }: { width: number; height: number }) {
  const hingeW = 0.03;
  const hingeH = 0.16;
  const hingeD = 0.03;
  const z = 0.02;

  const yTop = height * 0.23;
  const yBottom = -height * 0.23;

  return (
    <group>
      <mesh position={[-width / 2 + hingeW * 0.65, yTop, z]} castShadow>
        <boxGeometry args={[hingeW, hingeH, hingeD]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[-width / 2 + hingeW * 0.65, yBottom, z]} castShadow>
        <boxGeometry args={[hingeW, hingeH, hingeD]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[width / 2 - hingeW * 0.65, yTop, z]} castShadow>
        <boxGeometry args={[hingeW, hingeH, hingeD]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[width / 2 - hingeW * 0.65, yBottom, z]} castShadow>
        <boxGeometry args={[hingeW, hingeH, hingeD]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.45} metalness={0.55} />
      </mesh>
    </group>
  );
}

function GateHandle({ width, height, type }: { width: number; height: number; type: GateConfig['type'] }) {
  const z = 0.022;
  const baseColor = '#2a2020';

  if (type === 'tilt' || type === 'sectional') {
    return (
      <group position={[0, -height * 0.14, z]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.34, 0.03]} />
          <meshStandardMaterial color={baseColor} roughness={0.55} metalness={0.1} />
        </mesh>
      </group>
    );
  }

  const handleX = width * 0.14;
  const handleY = -height * 0.14;

  return (
    <group position={[handleX, handleY, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.05, 0.26, 0.03]} />
        <meshStandardMaterial color={baseColor} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0.045, -0.095, 0]} castShadow>
        <boxGeometry args={[0.08, 0.045, 0.03]} />
        <meshStandardMaterial color={baseColor} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[-0.015, 0.07, -0.004]} castShadow>
        <boxGeometry args={[0.035, 0.07, 0.02]} />
        <meshStandardMaterial color={baseColor} roughness={0.6} metalness={0.08} />
      </mesh>
      <mesh position={[-0.015, -0.07, -0.004]} castShadow>
        <boxGeometry args={[0.035, 0.07, 0.02]} />
        <meshStandardMaterial color={baseColor} roughness={0.6} metalness={0.08} />
      </mesh>
    </group>
  );
}

function SectionalStrips({ width, height }: { width: number; height: number }) {
  const stripCount = Math.max(4, Math.floor(height / 0.32));
  const step = height / stripCount;
  const stripThickness = 0.018;
  const z = 0.016;

  return (
    <group>
      {Array.from({ length: stripCount - 1 }).map((_, i) => {
        const y = -height / 2 + step * (i + 1);
        return (
          <mesh key={`strip-${i}`} position={[0, y, z]} castShadow>
            <boxGeometry args={[width * 0.96, stripThickness, 0.018]} />
            <meshStandardMaterial color="#6b7280" roughness={0.85} metalness={0.08} />
          </mesh>
        );
      })}
    </group>
  );
}

function wallTransform(
  gate: GateConfig,
  W: number,
  D: number,
): { position: [number, number, number]; rotationY: number } {
  const cx = gate.positionX + gate.width / 2 - W / 2;
  const y = gate.height / 2;

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

export default function GateModel({ gate, garageWidth: W, garageDepth: D }: GateModelProps) {
  const { selectedGateId, setSelectedGate } = useUIStore();
  const globalMat = useConfigStore(s => s.config.construction.material);

  const isSelected = selectedGateId === gate.id;
  const matConfig = effectiveMaterial(gate.material, { ...globalMat, color: gate.color });

  const left = useSpriteMaterial({ config: matConfig, worldWidth: gate.width / 2, worldHeight: gate.height });
  const right = useSpriteMaterial({ config: matConfig, worldWidth: gate.width / 2, worldHeight: gate.height });
  const single = useSpriteMaterial({ config: matConfig, worldWidth: gate.width, worldHeight: gate.height });

  const { position, rotationY } = wallTransform(gate, W, D);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    setSelectedGate(isSelected ? null : gate.id);
  }

  if (gate.type === 'double-wing') {
    const hw = gate.width / 2;
    return (
      <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
        <GateFrame width={gate.width} height={gate.height} />
        <mesh position={[-hw / 2, 0, 0]} castShadow>
          <planeGeometry args={[hw, gate.height]} />
          <primitive object={left} attach="material" />
        </mesh>
        <mesh position={[hw / 2, 0, 0]} castShadow>
          <planeGeometry args={[hw, gate.height]} />
          <primitive object={right} attach="material" />
        </mesh>
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(gate.width + 0.05, gate.height + 0.05, 0.02)]} />
            <lineBasicMaterial color="#ffcc00" linewidth={2} />
          </lineSegments>
        )}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.04, gate.height, 0.02]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <GateHinges width={gate.width} height={gate.height} />
        <GateHandle width={gate.width} height={gate.height} type={gate.type} />
      </group>
    );
  }

  if (gate.type === 'sectional') {
    return (
      <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
        <GateFrame width={gate.width} height={gate.height} />
        <mesh castShadow>
          <planeGeometry args={[gate.width, gate.height]} />
          <primitive object={single} attach="material" />
        </mesh>
        <SectionalStrips width={gate.width} height={gate.height} />
        <GateHandle width={gate.width} height={gate.height} type={gate.type} />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(gate.width + 0.05, gate.height + 0.05, 0.02)]} />
            <lineBasicMaterial color="#ffcc00" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
      <GateFrame width={gate.width} height={gate.height} />
      <mesh castShadow>
        <planeGeometry args={[gate.width, gate.height]} />
        <primitive object={single} attach="material" />
      </mesh>
      <GateHandle width={gate.width} height={gate.height} type={gate.type} />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(gate.width + 0.05, gate.height + 0.05, 0.02)]} />
          <lineBasicMaterial color="#ffcc00" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
