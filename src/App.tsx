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
import { shaderRegistry } from './shaderRegistry';

const INITIAL_CONFIGS: ShaderConfig[] = [
  {
    id: 'cosmos',
    name: 'Cosmos',
    duration: 500,
    speed: 0.1,
    startOffset: 0,
    stickyRange: 0.14,
    scrollRange: 0.025,
    shaderId: '0',
    text: 'From the vastness of the cosmos...',
  },
  {
    id: 'planet',
    name: 'Planet',
    duration: 370,
    speed: 0.1,
    startOffset: 0.165,
    stickyRange: 0.14,
    scrollRange: 0.025,
    shaderId: '0',
    text: '...to the worlds we build and explore...',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    duration: 200,
    speed: 0.1,
    startOffset: 0.33,
    stickyRange: 0.14,
    scrollRange: 0.025,
    shaderId: '0',
    text: '...diving into the uncharted depths of imagination...',
  },
  {
    id: 'luminescence',
    name: 'Luminescence',
    duration: 250,
    speed: 0.1,
    startOffset: 0.495,
    stickyRange: 0.14,
    scrollRange: 0.025,
    shaderId: '0',
    text: '...depths that demand to be experienced...',
  },
  {
    id: 'microscopic',
    name: 'Microscopic',
    duration: 200,
    speed: 0.1,
    startOffset: 0.66,
    stickyRange: 0.14,
    scrollRange: 0.025,
    shaderId: '0',
    text: '...down to the hidden architecture of reality itself.',
  },
  {
    id: 'final',
    name: 'Final Resolve',
    duration: 100,
    speed: 0.1,
    startOffset: 0.825,
    stickyRange: 0.14,
    scrollRange: 0.025,
    shaderId: '0',
    text: 'We make the invisible, immersive. Welcome to CINoptic.',
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
  
  // Check for hideUI parameter
  const hideUI = new URLSearchParams(window.location.search).has('hideUI');

  const handleUpdate = (id: string, updates: Partial<ShaderConfig>) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {!hideUI && <Controls configs={configs} onUpdate={handleUpdate} />}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ScrollControls pages={12} damping={0.2}>
          {configs.map((config, index) => {
            const shaderList = shaderRegistry[config.id] || shaderRegistry.final;
            const shaderIndex = parseInt(config.shaderId || '0', 10);
            const selectedShader = shaderList[shaderIndex] || shaderList[0];
            
            return (
              <ShaderStage 
                key={`${config.id}-${config.shaderId || '0'}`} 
                config={config} 
                fragmentShader={selectedShader.code} 
              />
            );
          })}
          
          <Scroll html>
            {configs.map((config, index) => (
              <div 
                key={`text-${config.id}`}
                style={{ 
                  position: 'absolute', 
                  top: `${134 + index * 198}vh`, 
                  left: '0', 
                  width: '100vw', 
                  textAlign: 'center', 
                  color: 'white', 
                  fontSize: '1.5rem', 
                  fontFamily: 'var(--font-julius)', 
                  pointerEvents: 'none', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.2em', 
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {config.text}
              </div>
            ))}
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}
