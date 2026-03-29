import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ShaderConfig } from '../types';

interface ShaderStageProps {
  config: ShaderConfig;
  fragmentShader: string;
  position?: [number, number, number];
  isLast?: boolean;
}

export default function ShaderStage({ config, fragmentShader, position = [0, 0, 0], isLast = false }: ShaderStageProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const scroll = useScroll();
  const { size, viewport } = useThree();

  // Stable uniforms ref
  const uniforms = useRef({
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    iMouse: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }).current;

  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!scroll || !mesh.current) return;
    
    // Safely get config values with defaults
    const s = typeof config.speed === 'number' ? config.speed : 0.1;
    const d = typeof config.duration === 'number' ? config.duration : 200;
    const startOffset = config.startOffset ?? 0;
    const stickyRange = config.stickyRange ?? 0.25;
    const scrollRange = config.scrollRange ?? 0.1;

    const animationMode = config.animationMode || 'scroll';

    const scrollProgress = scroll.offset;
    const startScrollIn = startOffset - scrollRange;
    const endSticky = startOffset + stickyRange;
    const endScrollOut = endSticky + scrollRange;

    // Calculate the actual range where the shader is active on the scrollbar
    // We clamp the start to 0 so that the first shader starts at exactly time 0
    const animationStart = Math.max(0, startScrollIn);
    const animationEnd = Math.min(1, endScrollOut);
    const totalVisibilityRange = animationEnd - animationStart;

    const localProgress = totalVisibilityRange > 0 
      ? Math.max(0, Math.min(1, (scrollProgress - animationStart) / totalVisibilityRange))
      : 0;

    let currentTime = 0;
    if (isLast) {
      // Indefinite animation driven by scroll
      // We use the absolute scroll progress to keep it moving
      currentTime = scrollProgress * 100.0 * s; 
    } else if (animationMode === 'always') {
      timeRef.current += delta * s * 10.0;
      currentTime = timeRef.current;
    } else {
      // iTime is now purely driven by scroll progress (scrubbing)
      // It starts at 0 and ends at (duration * speed)
      currentTime = localProgress * d * s;
    }
    
    uniforms.iTime.value = currentTime;
    uniforms.uTime.value = currentTime;
    
    uniforms.iResolution.value.set(size.width, size.height);
    uniforms.uResolution.value.set(size.width, size.height);

    mesh.current.position.x = position[0];
    mesh.current.position.z = position[2];

    // Clamp scrollProgress between 0 and 1 to prevent overscroll bouncing and gaps
    const clampedScroll = Math.max(0, Math.min(1, scrollProgress));

    // Calculate Y position for the transition effect
    if (clampedScroll < startOffset) {
      const range = startOffset - startScrollIn;
      const p = range > 0 ? Math.max(0, (clampedScroll - startScrollIn) / range) : 1;
      mesh.current.position.y = position[1] - viewport.height * (1 - p);
    } else if (clampedScroll < endSticky) {
      mesh.current.position.y = position[1];
    } else {
      const range = endScrollOut - endSticky;
      const p = range > 0 ? Math.min(1, (clampedScroll - endSticky) / range) : 1;
      mesh.current.position.y = position[1] + viewport.height * p;
    }
    
    const mouseX = ((state.mouse.x + 1) / 2) * size.width;
    const mouseY = ((state.mouse.y + 1) / 2) * size.height;
    uniforms.iMouse.value.set(mouseX, mouseY);
    uniforms.uMouse.value.set(mouseX, mouseY);
  });

  return (
    <mesh ref={mesh}>
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
