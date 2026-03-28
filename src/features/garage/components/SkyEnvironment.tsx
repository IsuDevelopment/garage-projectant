'use client';

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { Clouds, Cloud } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { DEFAULT_SETTINGS, type VisualEnvironmentConfig } from '@/config/settings';
import { useUIStore } from '@/store/useUIStore';

const skyVertexShader = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const skyFragmentShader = `
  varying vec3 vWorldPosition;

  uniform vec3 topColor;
  uniform vec3 midColor;
  uniform vec3 horizonColor;

  void main() {
    float heightMix = normalize(vWorldPosition + vec3(0.0, 120.0, 0.0)).y;
    float lowerBlend = smoothstep(-0.25, 0.10, heightMix);
    float upperBlend = smoothstep(0.00, 0.85, heightMix);

    vec3 color = mix(horizonColor, midColor, lowerBlend);
    color = mix(color, topColor, upperBlend);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface SkyEnvironmentProps {
  config?: VisualEnvironmentConfig;
}

function seeded01(seed: number, offset: number) {
  const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

export default function SkyEnvironment({ config = DEFAULT_SETTINGS.visual! }: SkyEnvironmentProps) {
  const showSky    = useUIStore(s => s.showSky);
  const showClouds = useUIStore(s => s.showClouds);
  const sky = config.sky;
  const cloudRefs = useRef<Array<THREE.Group | null>>([]);
  const cloudMotion = config.cloudMotion;
  const halfTravel = cloudMotion?.wrapHalfWidth ?? 70;

  const motion = useMemo(() => {
    const driftMin = cloudMotion?.driftMin ?? 0.7;
    const driftMax = cloudMotion?.driftMax ?? 1.5;
    const bounceMin = cloudMotion?.bounceMin ?? 0.08;
    const bounceMax = cloudMotion?.bounceMax ?? 0.25;
    const bobSpeedMin = cloudMotion?.bobSpeedMin ?? 0.25;
    const bobSpeedMax = cloudMotion?.bobSpeedMax ?? 0.6;

    return config.clouds.map((cloud, index) => ({
      index,
      baseX: cloud.position[0],
      baseY: cloud.position[1],
      z: cloud.position[2],
      driftSpeed: driftMin + seeded01(cloud.seed, 1) * Math.max(0, driftMax - driftMin),
      phase: seeded01(cloud.seed, 2) * Math.PI * 2,
      bobAmplitude: bounceMin + seeded01(cloud.seed, 3) * Math.max(0, bounceMax - bounceMin),
      bobSpeed: bobSpeedMin + seeded01(cloud.seed, 4) * Math.max(0, bobSpeedMax - bobSpeedMin),
    }));
  }, [config.clouds, cloudMotion]);

  useFrame(({ clock }) => {
    if (!showClouds) {
      return;
    }

    const t = clock.getElapsedTime();

    for (const item of motion) {
      const group = cloudRefs.current[item.index];
      if (!group) {
        continue;
      }

      const wrappedX = ((item.baseX + t * item.driftSpeed + halfTravel) % (halfTravel * 2)) - halfTravel;
      const y = item.baseY + Math.sin(t * item.bobSpeed + item.phase) * item.bobAmplitude;

      group.position.set(wrappedX, y, item.z);
    }
  });

  return (
    <>
      {showSky && (
        <mesh scale={sky.radius} frustumCulled={false}>
          <sphereGeometry args={[1, 48, 32]} />
          <shaderMaterial
            side={THREE.BackSide}
            depthWrite={false}
            vertexShader={skyVertexShader}
            fragmentShader={skyFragmentShader}
            uniforms={{
              topColor: { value: new THREE.Color(sky.topColor) },
              midColor: { value: new THREE.Color(sky.midColor) },
              horizonColor: { value: new THREE.Color(sky.horizonColor) },
            }}
          />
        </mesh>
      )}

      {showClouds && (
        <Clouds material={THREE.MeshLambertMaterial}>
          {config.clouds.map((cloud, index) => (
            <group
              key={`${cloud.seed}-${cloud.position.join('-')}`}
              ref={(node) => {
                cloudRefs.current[index] = node;
              }}
              position={cloud.position}
            >
              <Cloud
                seed={cloud.seed}
                bounds={cloud.bounds}
                volume={cloud.volume}
                color={cloud.color}
                opacity={cloud.opacity}
                speed={cloud.speed}
              />
            </group>
          ))}
        </Clouds>
      )}
    </>
  );
}
