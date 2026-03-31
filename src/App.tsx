/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll } from '@react-three/drei';
import ShaderStage from './components/ShaderStage';
import Controls from './components/Controls';
import { ShaderConfig } from './types';
import { shaderRegistry, allShaders } from './shaderRegistry';

function ProjectItem({ config, pages, index, globalTextBackground }: { config: ShaderConfig; pages: number; index: number; globalTextBackground: boolean }) {
  const scroll = useScroll();
  const ref = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  
  const parallaxSpeed = config.projectParallaxSpeed || 0.5;
  const secondaryParallaxSpeed = config.projectSecondaryParallaxSpeed ?? 0.5;
  
  // Use horizontal offset if provided, otherwise default to 0 (centered)
  const horizontalOffset = config.projectHorizontalPosition !== undefined 
    ? config.projectHorizontalPosition 
    : 0;
  const verticalOffset = config.projectVerticalPosition ?? 0;
  const fadePrimary = config.projectFade !== false;

  const secondaryHorizontalOffset = config.projectSecondaryHorizontalPosition ?? 0;
  const secondaryVerticalOffset = config.projectSecondaryVerticalPosition ?? 0;
  const fadeSecondary = config.projectSecondaryFade !== false;
    
  const size = config.projectSize || 30;
  const secondarySize = config.projectSecondarySize || 15;
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const actualSize = isMobile ? Math.min(size * 2.5, 90) : size;
  const actualSecondarySize = isMobile ? Math.min(secondarySize * 2.5, 90) : secondarySize;
  
  useFrame(() => {
    // Calculate the base position in scroll percentage (0-100)
    const baseTop = (config.startOffset + (config.stickyRange ?? 0.14) / 2) * (pages - 1) * 100;
    
    // Current scroll position in same units
    const scrollOffset = scroll.offset * (pages - 1) * 100;
    
    // Fade out based on distance from center of viewport
    // distance is in vh units
    const distance = Math.abs(scrollOffset - baseTop);
    const fadeRange = 45; // vh range for full fade
    
    const primaryOpacity = fadePrimary ? Math.max(0, 1 - Math.pow(distance / fadeRange, 2)) : 1;
    const secondaryOpacity = fadeSecondary ? Math.max(0, 1 - Math.pow(distance / fadeRange, 2)) : 1;
    
    if (ref.current) {
      // Vertical parallax offset
      const parallaxOffset = (scrollOffset - baseTop) * (1 - parallaxSpeed);
      
      // Apply styles directly for performance
      ref.current.style.opacity = primaryOpacity.toString();
      ref.current.style.visibility = primaryOpacity <= 0 ? 'hidden' : 'visible';
      
      // Use a single transform to avoid conflicts
      // Base translate(-50%, -50%) centers the element on its top/left anchor
      ref.current.style.transform = `translate(-50%, -50%) translateX(${horizontalOffset}vw) translateY(calc(${parallaxOffset}vh + ${verticalOffset}vh))`;
    }

    if (secondaryRef.current) {
      const secondaryParallaxOffset = (scrollOffset - baseTop) * (1 - secondaryParallaxSpeed);
      secondaryRef.current.style.opacity = secondaryOpacity.toString();
      secondaryRef.current.style.visibility = secondaryOpacity <= 0 ? 'hidden' : 'visible';
      secondaryRef.current.style.transform = `translate(-50%, -50%) translateX(${secondaryHorizontalOffset}vw) translateY(calc(${secondaryParallaxOffset}vh + ${secondaryVerticalOffset}vh))`;
    }
  });

  if (config.projectVisible === false) return null;
  if (!config.projectMediaUrl && !config.projectText && !config.projectSecondaryMediaUrl) return null;

  // Helper to convert Google Drive share links to direct image links
  const getDirectMediaUrl = (url: string) => {
    if (!url) return url;
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }
    return url;
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const mediaUrl = config.projectMediaUrl ? getDirectMediaUrl(config.projectMediaUrl) : undefined;
  const youtubeId = config.projectMediaUrl ? getYouTubeId(config.projectMediaUrl) : null;
  
  // Check if it's explicitly a video or if the original URL had a video extension
  const isVideo = config.projectMediaUrl?.match(/\.(mp4|webm|ogg)$/i);

  const secondaryMediaUrl = config.projectSecondaryMediaUrl ? getDirectMediaUrl(config.projectSecondaryMediaUrl) : undefined;
  const secondaryYoutubeId = config.projectSecondaryMediaUrl ? getYouTubeId(config.projectSecondaryMediaUrl) : null;
  const isSecondaryVideo = config.projectSecondaryMediaUrl?.match(/\.(mp4|webm|ogg)$/i);

  return (
    <>
      <div 
        ref={ref}
      style={{ 
        position: 'absolute', 
        // Base position is vertically centered in its section
        top: `${(config.startOffset + (config.stickyRange ?? 0.14) / 2) * (pages - 1) * 100 + 50}vh`, 
        left: '50vw',
        width: `${actualSize}vw`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white', 
        fontFamily: 'var(--font-julius)', 
        pointerEvents: 'auto', 
        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        zIndex: 10,
        transition: 'opacity 0.1s ease-out', // Smooth out the opacity changes
      }}
    >
      {mediaUrl && (
        <a 
          href={config.projectLinkUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            width: '100%',
            pointerEvents: 'auto',
            display: 'block',
            transition: 'transform 0.3s ease',
            borderRadius: config.projectMediaCircleMask ? '50%' : '8px',
            aspectRatio: config.projectMediaCircleMask ? '1 / 1' : 'auto',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.0)',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            ...(config.projectMediaCircleMask ? {
              WebkitMaskImage: 'radial-gradient(circle closest-side, black calc(100% - 2px), transparent 100%)',
              maskImage: 'radial-gradient(circle closest-side, black calc(100% - 2px), transparent 100%)'
            } : {})
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1&disablekb=1`}
              style={{ 
                width: '100%', 
                height: config.projectMediaCircleMask ? '100%' : 'auto',
                aspectRatio: config.projectMediaCircleMask ? '1 / 1' : '16/9', 
                objectFit: config.projectMediaCircleMask ? 'cover' : 'fill',
                border: 'none', 
                display: 'block', 
                pointerEvents: 'none', // Prevents interaction with the iframe, allowing the parent <a> tag to handle clicks
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
              allow="autoplay; encrypted-media"
              title="Project Video"
            />
          ) : isVideo ? (
            <video 
              src={mediaUrl} 
              autoPlay 
              muted 
              loop 
              playsInline
              style={{ 
                width: '100%', 
                height: config.projectMediaCircleMask ? '100%' : 'auto', 
                aspectRatio: config.projectMediaCircleMask ? '1 / 1' : 'auto',
                objectFit: config.projectMediaCircleMask ? 'cover' : 'fill',
                display: 'block',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt="Project media" 
              style={{ 
                width: '100%', 
                height: config.projectMediaCircleMask ? '100%' : 'auto', 
                aspectRatio: config.projectMediaCircleMask ? '1 / 1' : 'auto',
                objectFit: config.projectMediaCircleMask ? 'cover' : 'fill',
                display: 'block',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
              referrerPolicy="no-referrer"
            />
          )}
        </a>
      )}
      {config.projectText && (
        <div style={{ 
          marginTop: '1rem', 
          fontSize: '0.9rem', 
          textAlign: 'center', 
          background: globalTextBackground ? 'rgba(0,0,0,0.4)' : 'transparent',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          backdropFilter: globalTextBackground ? 'blur(4px)' : 'none',
          width: '100%',
          letterSpacing: '0.1em'
        }}>
          {config.projectText}
        </div>
      )}
      </div>

      {secondaryMediaUrl && (
        <div
          ref={secondaryRef}
          style={{
            position: 'absolute',
            top: `${(config.startOffset + (config.stickyRange ?? 0.14) / 2) * (pages - 1) * 100 + 50}vh`, 
            left: '50vw',
            width: `${actualSecondarySize}vw`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none', 
            zIndex: 11,
            transition: 'opacity 0.1s ease-out',
          }}
        >
          {secondaryYoutubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${secondaryYoutubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${secondaryYoutubeId}&modestbranding=1&rel=0&playsinline=1&disablekb=1`}
              style={{ 
                width: '100%', 
                height: config.projectSecondaryMediaCircleMask ? '100%' : 'auto',
                aspectRatio: config.projectSecondaryMediaCircleMask ? '1 / 1' : '16/9', 
                objectFit: config.projectSecondaryMediaCircleMask ? 'cover' : 'fill',
                borderRadius: config.projectSecondaryMediaCircleMask ? '50%' : '8px',
                border: 'none', 
                display: 'block', 
                pointerEvents: 'none',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                overflow: 'hidden',
                ...(config.projectSecondaryMediaCircleMask ? {
                  WebkitMaskImage: 'radial-gradient(circle closest-side, black calc(100% - 2px), transparent 100%)',
                  maskImage: 'radial-gradient(circle closest-side, black calc(100% - 2px), transparent 100%)'
                } : {})
              }}
              allow="autoplay; encrypted-media"
              title="Secondary Project Video"
            />
          ) : isSecondaryVideo ? (
            <video 
              src={secondaryMediaUrl} 
              autoPlay 
              muted 
              loop 
              playsInline
              style={{ 
                width: '100%', 
                height: config.projectSecondaryMediaCircleMask ? '100%' : 'auto', 
                aspectRatio: config.projectSecondaryMediaCircleMask ? '1 / 1' : 'auto',
                objectFit: config.projectSecondaryMediaCircleMask ? 'cover' : 'fill',
                borderRadius: config.projectSecondaryMediaCircleMask ? '50%' : '8px',
                display: 'block',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
            />
          ) : (
            <img 
              src={secondaryMediaUrl} 
              alt="Secondary Project media" 
              style={{ 
                width: '100%', 
                height: config.projectSecondaryMediaCircleMask ? '100%' : 'auto', 
                aspectRatio: config.projectSecondaryMediaCircleMask ? '1 / 1' : 'auto',
                objectFit: config.projectSecondaryMediaCircleMask ? 'cover' : 'fill',
                borderRadius: config.projectSecondaryMediaCircleMask ? '50%' : '8px',
                display: 'block',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)'
              }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      )}
    </>
  );
}

const INITIAL_CONFIGS: ShaderConfig[] = [
  {
    id: 'cosmos',
    name: 'Cosmos',
    duration: 200,
    speed: 0.1,
    startOffset: 0,
    stickyRange: 0.14,
    scrollRange: 0.046,
    shaderId: 'cosmos-0',
    text: 'From the vastness of the cosmos...',
    projectMediaUrl: 'https://picsum.photos/seed/cosmos/800/600',
    projectText: 'Deep Space Exploration Initiative',
    projectParallaxSpeed: 0.4,
    projectHorizontalPosition: 0,
    projectSize: 35,
    projectVisible: true,
    projectSecondaryMediaUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    projectSecondaryParallaxSpeed: 0.6,
    projectSecondaryHorizontalPosition: 0,
    projectSecondaryVerticalPosition: 0,
    projectSecondarySize: 15,
  },
  {
    id: 'planet',
    name: 'Planet',
    duration: 200,
    speed: 0.1,
    startOffset: 0.186,
    stickyRange: 0.14,
    scrollRange: 0.046,
    shaderId: 'planet-0',
    text: '...to the worlds we build and explore...',
    projectMediaUrl: 'https://picsum.photos/seed/planet/800/600',
    projectText: 'Terraforming Mars Project',
    projectParallaxSpeed: 0.6,
    projectHorizontalPosition: 0,
    projectSize: 30,
    projectVisible: true,
    projectSecondaryMediaUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    projectSecondaryParallaxSpeed: 0.8,
    projectSecondaryHorizontalPosition: 0,
    projectSecondaryVerticalPosition: 0,
    projectSecondarySize: 15,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    duration: 200,
    speed: 0.1,
    startOffset: 0.372,
    stickyRange: 0.14,
    scrollRange: 0.046,
    shaderId: 'ocean-0',
    text: '...diving into the uncharted depths of imagination...',
    projectMediaUrl: 'https://www.youtube.com/watch?v=EiAQmDv1kSw',
    projectText: 'The delicate balance of nature.',
    projectParallaxSpeed: 0.3,
    projectHorizontalPosition: 0,
    projectSize: 40,
    projectVisible: true,
    projectSecondaryMediaUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    projectSecondaryParallaxSpeed: 0.5,
    projectSecondaryHorizontalPosition: 0,
    projectSecondaryVerticalPosition: 0,
    projectSecondarySize: 15,
  },
  {
    id: 'luminescence',
    name: 'Luminescence',
    duration: 200,
    speed: 0.1,
    startOffset: 0.558,
    stickyRange: 0.14,
    scrollRange: 0.046,
    shaderId: 'luminescence-0',
    text: '...depths that demand to be experienced...',
    projectMediaUrl: 'https://picsum.photos/seed/light/800/600',
    projectText: 'Bioluminescent Energy Grid',
    projectParallaxSpeed: 0.7,
    projectHorizontalPosition: 0,
    projectSize: 25,
    projectVisible: true,
    projectSecondaryMediaUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    projectSecondaryParallaxSpeed: 0.9,
    projectSecondaryHorizontalPosition: 0,
    projectSecondaryVerticalPosition: 0,
    projectSecondarySize: 15,
  },
  {
    id: 'microscopic',
    name: 'Microscopic',
    duration: 200,
    speed: 0.1,
    startOffset: 0.744,
    stickyRange: 0.14,
    scrollRange: 0.046,
    shaderId: 'microscopic-0',
    text: '...down to the hidden architecture of reality itself.',
    projectMediaUrl: 'https://picsum.photos/seed/micro/800/600',
    projectText: 'Quantum Computing Core',
    projectParallaxSpeed: 0.5,
    projectHorizontalPosition: 0,
    projectSize: 30,
    projectVisible: true,
    projectSecondaryMediaUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    projectSecondaryParallaxSpeed: 0.7,
    projectSecondaryHorizontalPosition: 0,
    projectSecondaryVerticalPosition: 0,
    projectSecondarySize: 15,
  },
  {
    id: 'final',
    name: 'Final Resolve',
    duration: 200,
    speed: 0.1,
    startOffset: 0.93,
    stickyRange: 0.14,
    scrollRange: 0.046,
    shaderId: 'final-0',
    text: 'We make the invisible, immersive. Welcome to CINoptic.',
    imageUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    imageLink: 'https://sites.google.com/view/perceptionxr/init',
    projectMediaUrl: 'https://picsum.photos/seed/final/800/600',
    projectText: 'The Future of Perception',
    projectParallaxSpeed: 0.8,
    projectHorizontalPosition: 0,
    projectSize: 20,
    projectVisible: true,
    projectSecondaryMediaUrl: 'https://raw.githubusercontent.com/plasticarm/CINopticLandingPage/main/images/Cinoptic_logo1.png',
    projectSecondaryParallaxSpeed: 1.0,
    projectSecondaryHorizontalPosition: 0,
    projectSecondaryVerticalPosition: 0,
    projectSecondarySize: 15,
  },
];

export default function App() {
  const [configs, setConfigs] = useState<ShaderConfig[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    if (configParam) {
      try {
        const parsed = JSON.parse(configParam);
        if (Array.isArray(parsed)) {
          // Merge with INITIAL_CONFIGS to ensure all properties exist
          return INITIAL_CONFIGS.map((initialConfig, i) => ({
            ...initialConfig,
            ...(parsed[i] || {})
          }));
        }
      } catch (e) {
        console.error('Failed to parse config from URL', e);
      }
    }
    return INITIAL_CONFIGS;
  });

  const [introText, setIntroText] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('introText') || "Welcome to CINoptic";
  });
  
  const [globalTextBackground, setGlobalTextBackground] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('globalTextBackground')) {
      return params.get('globalTextBackground') === 'true';
    }
    return true;
  });
  
  // Check for hideUI parameter
  const hideUI = new URLSearchParams(window.location.search).has('hideUI');

  const handleUpdate = (id: string, updates: Partial<ShaderConfig>) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const pages = 10;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {!hideUI && (
        <Controls 
          configs={configs} 
          setConfigs={setConfigs}
          onUpdate={handleUpdate} 
          introText={introText} 
          onUpdateIntroText={setIntroText} 
          globalTextBackground={globalTextBackground}
          onUpdateGlobalTextBackground={setGlobalTextBackground}
        />
      )}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ScrollControls pages={pages} damping={0.2}>
          {configs.map((config, index) => {
            const selectedShader = allShaders.find(s => s.id === config.shaderId) || allShaders[0];
            
            return (
              <ShaderStage 
                key={`${config.id}-${config.shaderId || '0'}`} 
                config={config} 
                fragmentShader={selectedShader.code} 
              />
            );
          })}
          
          <Scroll html>
            <div 
              style={{ 
                position: 'absolute', 
                top: '50vh', 
                left: '0', 
                width: '100vw', 
                textAlign: 'center', 
                color: 'white', 
                fontSize: '2rem', 
                fontFamily: 'var(--font-julius)', 
                pointerEvents: 'none', 
                textTransform: 'uppercase', 
                letterSpacing: '0.2em', 
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                whiteSpace: 'pre-wrap',
                transform: 'translateY(-50%)',
                zIndex: 20
              }}
            >
              {introText}
            </div>
            {configs.map((config, index) => (
              <React.Fragment key={`group-${config.id}`}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: `${(config.startOffset + (config.stickyRange ?? 0.14) / 2) * (pages - 1) * 100 + 50}vh`, 
                    left: '0', 
                    width: '100vw', 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white', 
                    fontFamily: 'var(--font-julius)', 
                    pointerEvents: 'auto', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.2em', 
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    whiteSpace: 'pre-wrap',
                    transform: 'translateY(-50%)',
                    zIndex: 20
                  }}
                >
                  <div style={{ fontSize: '1.5rem', textAlign: 'center', pointerEvents: 'none' }}>
                    {config.text}
                  </div>
                  {config.imageUrl && (
                    <a 
                      href={config.imageLink || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        marginTop: '2rem', 
                        pointerEvents: 'auto',
                        display: 'block',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img 
                        src={config.imageUrl} 
                        alt="Section logo" 
                        style={{ maxWidth: '200px', height: 'auto' }}
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  )}
                </div>
                <ProjectItem config={config} pages={pages} index={index} globalTextBackground={globalTextBackground} />
              </React.Fragment>
            ))}
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}
