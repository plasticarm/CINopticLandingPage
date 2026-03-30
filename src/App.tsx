/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import ShaderStage from './components/ShaderStage';
import Controls from './components/Controls';
import { ShaderConfig } from './types';
import { shaderRegistry, allShaders } from './shaderRegistry';

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
                transform: 'translateY(-50%)'
              }}
            >
              {introText}
            </div>
            {configs.map((config, index) => (
              <div 
                key={`text-${config.id}`}
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
                  transform: 'translateY(-50%)'
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
            ))}
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}
