'use client';

import * as THREE from 'three';
import { Clouds, Cloud } from '@react-three/drei';
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

export default function SkyEnvironment({ config = DEFAULT_SETTINGS.visual! }: SkyEnvironmentProps) {
  const showSky    = useUIStore(s => s.showSky);
  const showClouds = useUIStore(s => s.showClouds);
  const sky = config.sky;

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
          {config.clouds.map(cloud => (
            <Cloud
              key={`${cloud.seed}-${cloud.position.join('-')}`}
              seed={cloud.seed}
              bounds={cloud.bounds}
              volume={cloud.volume}
              color={cloud.color}
              opacity={cloud.opacity}
              speed={cloud.speed}
              position={cloud.position}
            />
          ))}
        </Clouds>
      )}
    </>
  );
}
