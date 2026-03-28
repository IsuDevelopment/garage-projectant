'use client';

import { DEFAULT_SETTINGS, type VisualEnvironmentConfig } from '@/config/settings';

// Low-poly conifer (spruce) trees — trunk + three stacked cones
function Conifer({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.19, 1.3, 6]} />
        <meshLambertMaterial color="#6B4226" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[1.1, 1.4, 7]} />
        <meshLambertMaterial color="#2B5F2B" />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <coneGeometry args={[0.84, 1.2, 7]} />
        <meshLambertMaterial color="#327832" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[0.58, 1.0, 7]} />
        <meshLambertMaterial color="#3A8C3A" />
      </mesh>
    </group>
  );
}

// Low-poly deciduous tree — trunk + layered sphere-ish blobs
function Deciduous({
  position,
  scale = 1,
  crownColor = '#4A9944',
  trunkColor = '#7A5230',
}: {
  position: [number, number, number];
  scale?: number;
  crownColor?: string;
  trunkColor?: string;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.6, 6]} />
        <meshLambertMaterial color={trunkColor} />
      </mesh>
      {/* Main crown */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <sphereGeometry args={[1.1, 8, 6]} />
        <meshLambertMaterial color={crownColor} />
      </mesh>
      {/* Side puffs */}
      <mesh position={[0.7, 2.4, 0.3]} castShadow>
        <sphereGeometry args={[0.75, 7, 5]} />
        <meshLambertMaterial color={crownColor} />
      </mesh>
      <mesh position={[-0.65, 2.5, -0.3]} castShadow>
        <sphereGeometry args={[0.7, 7, 5]} />
        <meshLambertMaterial color={crownColor} />
      </mesh>
      {/* Top puff */}
      <mesh position={[0.1, 3.55, 0]} castShadow>
        <sphereGeometry args={[0.6, 7, 5]} />
        <meshLambertMaterial color={crownColor} />
      </mesh>
    </group>
  );
}

interface TreeModelsProps {
  config?: VisualEnvironmentConfig;
}

export default function TreeModels({ config = DEFAULT_SETTINGS.visual! }: TreeModelsProps) {
  return (
    <>
      {config.trees.map((tree, index) => (
        tree.type === 'conifer' ? (
          <Conifer
            key={`${tree.type}-${index}`}
            position={tree.position}
            scale={tree.scale}
          />
        ) : (
          <Deciduous
            key={`${tree.type}-${index}`}
            position={tree.position}
            scale={tree.scale}
            crownColor={tree.crownColor}
            trunkColor={tree.trunkColor}
          />
        )
      ))}
    </>
  );
}
