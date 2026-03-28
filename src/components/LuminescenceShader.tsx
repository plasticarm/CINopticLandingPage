import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { fragmentShader } from './LuminescenceShaderCode';

export default function LuminescenceShader({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
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
    const animationDuration = 250.0; 
    
    // 0.0 to 0.58: Hidden below
    // 0.58 to 0.66: Scrolls up to y=0
    // 0.66 to 0.92: Animation plays while fixed at y=0
    // 0.92 to 1.0: Animation finishes while scrolling up
    if (scrollProgress < 0.58) {
      mesh.current.position.y = -viewport.height;
      uniforms.iTime.value = 0;
    } else if (scrollProgress < 0.66) {
      // Scroll up from -viewport.height to 0
      mesh.current.position.y = -viewport.height + ((scrollProgress - 0.58) / 0.08) * viewport.height;
      uniforms.iTime.value = 0;
    } else if (scrollProgress < 0.92) {
      // Map 0.66-0.92 to 0-90% of animation
      uniforms.iTime.value = ((scrollProgress - 0.66) / 0.26) * 0.9 * animationDuration;
      mesh.current.position.y = 0;
    } else {
      // Map 0.92-1.0 to 90-100% of animation
      uniforms.iTime.value = 0.9 * animationDuration + ((scrollProgress - 0.92) / 0.08) * 0.1 * animationDuration;
      // Scroll up from 0 to viewport.height
      mesh.current.position.y = ((scrollProgress - 0.92) / 0.08) * viewport.height;
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
