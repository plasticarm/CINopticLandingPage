import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { fragmentShader } from './PlanetShaderCode';

export default function PlanetShader({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  const scroll = useScroll();
  const { size, viewport } = useThree();

  const uniforms = useMemo(() => ({
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    iMouse: { value: new THREE.Vector2(0, 0) },
  }), [size]);

  useFrame((state) => {
    if (!scroll || !mesh.current) return;
    const scrollProgress = scroll.offset;
    const animationDuration = 370.0; 
    
    // 0.0 to 0.25: Animation plays while fixed at y=0
    // 0.25 to 0.33: Animation finishes while scrolling up
    if (scrollProgress < 0.25) {
      // Map 0.0-0.25 to 0-90% of animation
      uniforms.iTime.value = (scrollProgress / 5) * 0.9 * animationDuration;
      mesh.current.position.y = 0;
    } else if (scrollProgress < 0.33) {
      // Map 0.25-0.33 to 90-100% of animation
      uniforms.iTime.value = 0.9 * animationDuration + ((scrollProgress - 0.25) / 0.08) * 0.1 * animationDuration;
      // Scroll up from 0 to viewport.height
      mesh.current.position.y = ((scrollProgress - 0.25) / 0.08) * viewport.height;
    } else {
      uniforms.iTime.value = animationDuration;
      mesh.current.position.y = viewport.height;
    }
    
    uniforms.iResolution.value.set(size.width, size.height);
    uniforms.iMouse.value.set(((state.mouse.x + 1) / 2) * size.width, ((state.mouse.y + 1) / 2) * size.height);
  });

  return (
    <mesh ref={mesh} position={position}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}
