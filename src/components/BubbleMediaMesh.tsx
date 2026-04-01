import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { ShaderConfig } from '../types';
import { bubbleLensCode } from './BubbleLensShaderCode';

export default function BubbleMediaMesh({ config, pages, isSecondary = false }: { config: ShaderConfig, pages: number, isSecondary?: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const scroll = useScroll();
  const { size, viewport } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [texAspect, setTexAspect] = useState(1);
  const [isRendered, setIsRendered] = useState(false);

  const mediaUrl = isSecondary ? config.projectSecondaryMediaUrl : config.projectMediaUrl;
  const parallaxSpeed = isSecondary ? (config.projectSecondaryParallaxSpeed ?? 0.5) : (config.projectParallaxSpeed || 0.5);
  const horizontalOffset = isSecondary ? (config.projectSecondaryHorizontalPosition ?? 0) : (config.projectHorizontalPosition ?? 0);
  const verticalOffset = isSecondary ? (config.projectSecondaryVerticalPosition ?? 0) : (config.projectVerticalPosition ?? 0);
  const fade = isSecondary ? (config.projectSecondaryFade !== false) : (config.projectFade !== false);
  const sizeVw = isSecondary ? (config.projectSecondarySize || 15) : (config.projectSize || 30);

  const isMobile = window.innerWidth < 768;
  const actualSizeVw = isMobile ? Math.min(sizeVw * 2.5, 90) : sizeVw;

  useEffect(() => {
    if (!mediaUrl) return;
    
    const getDirectMediaUrl = (url: string) => {
      if (!url) return url;
      const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
      }
      return url;
    };

    const directUrl = getDirectMediaUrl(mediaUrl);
    const isVideo = directUrl.match(/\\.(mp4|webm|ogg)$/i);

    if (isVideo) {
      const video = document.createElement('video');
      video.src = directUrl;
      video.crossOrigin = 'Anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(e => console.error("Video play failed", e));
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
      
      video.addEventListener('loadedmetadata', () => {
        setTexAspect(video.videoWidth / video.videoHeight);
      });
    } else {
      new THREE.TextureLoader().load(directUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
        if (tex.image) {
          setTexAspect(tex.image.width / tex.image.height);
        }
      });
    }
  }, [mediaUrl]);

  const uniforms = useRef({
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    iChannel0: { value: null as THREE.Texture | null },
    opacity: { value: 1.0 }
  }).current;

  useFrame((state) => {
    if (!scroll || !mesh.current || !texture) return;

    uniforms.iTime.value = state.clock.elapsedTime;
    uniforms.iResolution.value.set(texAspect, 1.0);
    uniforms.iChannel0.value = texture;

    const baseTop = (config.startOffset + (config.stickyRange ?? 0.14) / 2) * (pages - 1) * 100;
    const scrollOffset = scroll.offset * (pages - 1) * 100;
    
    const distance = Math.abs(scrollOffset - baseTop);
    const fadeRange = 45;
    const opacity = fade ? Math.max(0, 1 - Math.pow(distance / fadeRange, 2)) : 1;
    
    const shouldRender = distance < 150 && opacity > 0;
    if (shouldRender !== isRendered) {
      setIsRendered(shouldRender);
    }

    if (!shouldRender) {
      mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;

    const yPos = -(((baseTop - scrollOffset) * parallaxSpeed + verticalOffset) / 100) * viewport.height;
    const xPos = (horizontalOffset / 100) * viewport.width;

    mesh.current.position.set(xPos, yPos, 0.1); // Slightly forward to avoid z-fighting

    const width3D = (actualSizeVw / 100) * viewport.width;
    const height3D = width3D / texAspect;
    
    mesh.current.scale.set(width3D, height3D, 1);
    
    uniforms.opacity.value = opacity;
  });

  if (!texture) return null;

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent={true}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={bubbleLensCode}
      />
    </mesh>
  );
}
