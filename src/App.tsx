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

// Import shader codes
import { fragmentShader as planetCode } from './components/PlanetShaderCode';
import { fragmentShader as seascapeCode } from './components/SeascapeShaderCode';
import { fragmentShader as luminescenceCode } from './components/LuminescenceShaderCode';

const INITIAL_CONFIGS: ShaderConfig[] = [
  {
    id: 'planet',
    name: 'Planet',
    duration: 370,
    speed: 0.1,
    startOffset: 0,
    stickyRange: 0.25,
    scrollRange: 0.08,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    duration: 200,
    speed: 0.1,
    startOffset: 0.33,
    stickyRange: 0.25,
    scrollRange: 0.08,
  },
  {
    id: 'luminescence',
    name: 'Luminescence',
    duration: 250,
    speed: 0.1,
    startOffset: 0.66,
    stickyRange: 0.26,
    scrollRange: 0.08,
  },
];

export default function App() {
  const [configs, setConfigs] = useState<ShaderConfig[]>(INITIAL_CONFIGS);
  
  // Check for hideUI parameter
  const hideUI = new URLSearchParams(window.location.search).has('hideUI');

  const handleUpdate = (id: string, updates: Partial<ShaderConfig>) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {!hideUI && <Controls configs={configs} onUpdate={handleUpdate} />}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ScrollControls pages={6} damping={0.2}>
          <ShaderStage key={configs[0].id} config={configs[0]} fragmentShader={planetCode} />
          <ShaderStage key={configs[1].id} config={configs[1]} fragmentShader={seascapeCode} />
          <ShaderStage key={configs[2].id} config={configs[2]} fragmentShader={luminescenceCode} />
          
          <Scroll html>
            <div style={{ position: 'absolute', top: '0vh', left: '20vw', color: 'white', fontSize: '2rem', fontFamily: 'monospace', pointerEvents: 'none', opacity: 0.5 }}>01. PLANET</div>
            <div style={{ position: 'absolute', top: '200vh', left: '20vw', color: 'white', fontSize: '2rem', fontFamily: 'monospace', pointerEvents: 'none', opacity: 0.5 }}>02. OCEAN</div>
            <div style={{ position: 'absolute', top: '400vh', left: '20vw', color: 'white', fontSize: '2rem', fontFamily: 'monospace', pointerEvents: 'none', opacity: 0.5 }}>03. LUMINESCENCE</div>
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}
