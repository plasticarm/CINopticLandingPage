import React, { useState } from 'react';
import { ShaderConfig } from '../types';
import { Settings2, Play, Pause, RotateCcw, Code, Check, Info, ExternalLink, Download, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { shaderRegistry, allShaders } from '../shaderRegistry';

interface ControlsProps {
  configs: ShaderConfig[];
  setConfigs: React.Dispatch<React.SetStateAction<ShaderConfig[]>>;
  onUpdate: (id: string, updates: Partial<ShaderConfig>) => void;
  introText: string;
  onUpdateIntroText: (text: string) => void;
  globalTextBackground: boolean;
  onUpdateGlobalTextBackground: (value: boolean) => void;
}

export default function Controls({ configs, setConfigs, onUpdate, introText, onUpdateIntroText, globalTextBackground, onUpdateGlobalTextBackground }: ControlsProps) {
  const [copied, setCopied] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [showEmbedInfo, setShowEmbedInfo] = React.useState(false);
  const [customEmbedUrl, setCustomEmbedUrl] = React.useState('');
  const [activeTabs, setActiveTabs] = React.useState<Record<string, 'shader' | 'project'>>({});
  const [isMinimized, setIsMinimized] = React.useState(false);

  const toggleTab = (id: string, tab: 'shader' | 'project') => {
    setActiveTabs(prev => ({ ...prev, [id]: tab }));
  };

  const getEmbedUrl = () => {
    const baseUrl = customEmbedUrl || `${window.location.origin}${window.location.pathname}`;
    const url = new URL(baseUrl);
    
    try {
      // Include all properties to ensure exact match
      const serializedConfigs = configs.map(c => ({
        id: c.id,
        shaderId: c.shaderId,
        duration: c.duration,
        speed: c.speed,
        startOffset: c.startOffset,
        stickyRange: c.stickyRange,
        scrollRange: c.scrollRange,
        text: c.text,
        imageUrl: c.imageUrl,
        imageLink: c.imageLink,
        animationMode: c.animationMode,
        imageSequenceUrl: c.imageSequenceUrl,
        imageSequenceFrameCount: c.imageSequenceFrameCount,
        // Project properties
        projectMediaUrl: c.projectMediaUrl,
        projectText: c.projectText,
        projectLinkUrl: c.projectLinkUrl,
        projectParallaxSpeed: c.projectParallaxSpeed,
        projectAlignment: c.projectAlignment,
        projectDistance: c.projectDistance,
        projectHorizontalPosition: c.projectHorizontalPosition,
        projectVerticalPosition: c.projectVerticalPosition,
        projectSize: c.projectSize,
        projectVisible: c.projectVisible,
        projectFade: c.projectFade,
        projectMediaCircleMask: c.projectMediaCircleMask,
        // Secondary Graphic properties
        projectSecondaryMediaUrl: c.projectSecondaryMediaUrl,
        projectSecondaryParallaxSpeed: c.projectSecondaryParallaxSpeed,
        projectSecondaryHorizontalPosition: c.projectSecondaryHorizontalPosition,
        projectSecondaryVerticalPosition: c.projectSecondaryVerticalPosition,
        projectSecondarySize: c.projectSecondarySize,
        projectSecondaryFade: c.projectSecondaryFade,
        projectSecondaryMediaCircleMask: c.projectSecondaryMediaCircleMask
      }));

      const exportData = {
        introText,
        globalTextBackground,
        configs: serializedConfigs
      };

      // Encode as Base64 (handling unicode characters safely)
      const encodedData = btoa(encodeURIComponent(JSON.stringify(exportData)));
      url.searchParams.set('data', encodedData);
      
    } catch (e) {
      console.error('Failed to serialize configs', e);
    }
    
    return url.toString();
  };

  const copyEmbedCode = () => {
    const embedUrl = getEmbedUrl();
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
    
    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(embedCode)
        .then(onSuccess)
        .catch(() => fallbackCopy(embedCode, onSuccess));
    } else {
      fallbackCopy(embedCode, onSuccess);
    }
  };

  const copyUrlOnly = () => {
    const embedUrl = getEmbedUrl();
    
    const onSuccess = () => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    };

    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(embedUrl)
        .then(onSuccess)
        .catch(() => fallbackCopy(embedUrl, onSuccess));
    } else {
      fallbackCopy(embedUrl, onSuccess);
    }
  };

  const fallbackCopy = (text: string, cb: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Ensure it's not visible but part of the DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) cb();
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= configs.length) return;
    
    // Scroll the control panel
    const sectionEl = document.getElementById(`control-section-${index}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Scroll the 3D scene
    const targetConfig = configs[index];
    if (targetConfig) {
      window.dispatchEvent(new CustomEvent('scrollToSection', { 
        detail: { offset: targetConfig.startOffset } 
      }));
    }
  };

  const handleExport = () => {
    const data = {
      introText,
      globalTextBackground,
      configs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cinoptic-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.introText !== undefined) onUpdateIntroText(json.introText);
        if (json.globalTextBackground !== undefined) onUpdateGlobalTextBackground(json.globalTextBackground);
        if (Array.isArray(json.configs)) {
          setConfigs(json.configs);
        }
      } catch (err) {
        console.error('Failed to import settings', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {isMinimized && (
        <button 
          onClick={() => setIsMinimized(false)}
          className="fixed top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg border border-white/20 shadow-lg backdrop-blur-md text-xs font-bold tracking-wider hover:bg-white/10 transition-colors"
        >
          EDIT UI
        </button>
      )}
      
      {!isMinimized && (
        <div className="fixed left-4 top-4 z-50 w-72 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-4 text-white font-mono shadow-2xl overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Settings2 size={20} className="text-blue-400" />
              <h2 className="text-lg font-bold tracking-tight">SHADER CONTROLS</h2>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowEmbedInfo(!showEmbedInfo)}
                className={`p-1.5 rounded-lg transition-colors ${showEmbedInfo ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                title="Embed Settings"
              >
                <Code size={16} />
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                title="Reset All"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => setIsMinimized(true)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white ml-1"
                title="Hide UI"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {showEmbedInfo && (
            <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10 text-[10px] space-y-3">
              <div className="flex items-start gap-2 text-blue-300">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>For Google Sites, use the <span className="text-white font-bold">Shared App URL</span> to avoid policy blocks.</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-white/40 uppercase tracking-widest">Custom Embed URL (Optional)</label>
                <input 
                  type="text"
                  placeholder="Paste Shared URL here..."
                  value={customEmbedUrl}
                  onChange={(e) => setCustomEmbedUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={copyUrlOnly}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {copiedUrl ? (
                    <>
                      <Check size={14} />
                      COPIED!
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} />
                      COPY URL
                    </>
                  )}
                </button>
                <button 
                  onClick={copyEmbedCode}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      COPIED!
                    </>
                  ) : (
                    <>
                      <Code size={14} />
                      COPY IFRAME
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mb-8 pb-6 border-b border-white/10 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded font-bold text-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <Download size={14} />
                EXPORT
              </button>
              <button
                onClick={() => document.getElementById('import-input')?.click()}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded font-bold text-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={14} />
                IMPORT
              </button>
            </div>
            <input
              id="import-input"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-white/40">00.</span>
          <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Global Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[10px] mb-1 text-white/60">
              <label>INTRO TEXT</label>
            </div>
            <textarea
              value={introText}
              onChange={(e) => onUpdateIntroText(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white/80 text-xs focus:outline-none focus:border-blue-500/50 resize-y min-h-[60px]"
              placeholder="Enter intro text..."
            />
          </div>
          
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded px-2 py-2">
            <span className="text-[10px] text-white/60">PROJECT TEXT BACKGROUND</span>
            <button
              onClick={() => onUpdateGlobalTextBackground(!globalTextBackground)}
              className={`w-8 h-4 rounded-full transition-colors relative ${globalTextBackground ? 'bg-blue-600' : 'bg-white/20'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${globalTextBackground ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {configs.map((config, index) => {
        const activeTab = activeTabs[config.id] || 'shader';
        
        return (
        <div key={config.id} id={`control-section-${index}`} className="mb-8 pb-8 border-b border-white/10 last:border-0 last:mb-0 last:pb-0 relative pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">0{index + 1}.</span>
              <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">{config.name}</h3>
              <div className="flex gap-1 ml-2">
                <button 
                  onClick={() => scrollToSection(index - 1)} 
                  disabled={index === 0}
                  className="p-1 rounded bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors"
                  title="Previous Section"
                >
                  <ChevronUp size={14} />
                </button>
                <button 
                  onClick={() => scrollToSection(index + 1)} 
                  disabled={index === configs.length - 1}
                  className="p-1 rounded bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors"
                  title="Next Section"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button 
                onClick={() => toggleTab(config.id, 'shader')}
                className={`px-2 py-1 text-[9px] rounded-md transition-all ${activeTab === 'shader' ? 'bg-blue-600 text-white font-bold' : 'text-white/40 hover:text-white/70'}`}
              >
                SHADER
              </button>
              <button 
                onClick={() => toggleTab(config.id, 'project')}
                className={`px-2 py-1 text-[9px] rounded-md transition-all ${activeTab === 'project' ? 'bg-blue-600 text-white font-bold' : 'text-white/40 hover:text-white/70'}`}
              >
                PROJECT
              </button>
            </div>
          </div>

          {activeTab === 'shader' ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>ANIMATION MODE</label>
                </div>
                <select
                  value={config.animationMode || 'scroll'}
                  onChange={(e) => onUpdate(config.id, { animationMode: e.target.value as 'always' | 'scroll' })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                >
                  <option value="scroll">Scroll To Animate</option>
                  <option value="always">Always Animate</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>SHADER VARIANT</label>
                </div>
                <select
                  value={config.shaderId || allShaders[0].id}
                  onChange={(e) => onUpdate(config.id, { shaderId: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                >
                  {allShaders.map((shader) => (
                    <option key={shader.id} value={shader.id}>{shader.name}</option>
                  ))}
                </select>
              </div>

              {config.shaderId?.startsWith('image_sequence') && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 text-white/60">
                      <label>IMAGE SEQUENCE URL TEMPLATE</label>
                    </div>
                    <input
                      type="text"
                      value={config.imageSequenceUrl || ''}
                      onChange={(e) => onUpdate(config.id, { imageSequenceUrl: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                      placeholder="https://example.com/frames/{index}.webp"
                    />
                    <p className="text-[8px] text-white/40 mt-1">Use {'{index}'} for 1-based (1, 2, 3...) or {'{index0}'} for 0-based (0, 1, 2...). Add :N for padding, e.g. {'{index:4}'} for 0001.</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 text-white/60">
                      <label>FRAME COUNT</label>
                      <span>{config.imageSequenceFrameCount || 100}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={config.imageSequenceFrameCount || 100}
                      onChange={(e) => onUpdate(config.id, { imageSequenceFrameCount: parseInt(e.target.value) || 100 })}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>START OFFSET (SCROLL %)</label>
                  <span>{(config.startOffset * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.01"
                  value={config.startOffset}
                  onChange={(e) => onUpdate(config.id, { startOffset: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] mb-1 text-white/60">
                  <label>ANIMATION DURATION (s)</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={config.duration}
                    onChange={(e) => onUpdate(config.id, { duration: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-white/10 text-white text-right px-1 rounded border border-white/20 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <input
                  type="range"
                  min="10"
                  max="100000"
                  step="10"
                  value={config.duration}
                  onChange={(e) => onUpdate(config.id, { duration: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>SPEED MULTIPLIER</label>
                  <span>{config.speed.toFixed(3)}x</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="1"
                  step="0.001"
                  value={config.speed}
                  onChange={(e) => onUpdate(config.id, { speed: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>STICKY RANGE (SCROLL %)</label>
                  <span>{(config.stickyRange * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={config.stickyRange}
                  onChange={(e) => onUpdate(config.id, { stickyRange: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>SCROLL OUT RANGE (SCROLL %)</label>
                  <span>{(config.scrollRange * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.2"
                  step="0.01"
                  value={config.scrollRange}
                  onChange={(e) => onUpdate(config.id, { scrollRange: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>SECTION TEXT</label>
                </div>
                <textarea
                  value={config.text || ''}
                  onChange={(e) => onUpdate(config.id, { text: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white/80 text-xs focus:outline-none focus:border-blue-500/50 resize-y min-h-[60px]"
                  placeholder="Enter text for this section..."
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>IMAGE URL</label>
                </div>
                <input
                  type="text"
                  value={config.imageUrl || ''}
                  onChange={(e) => onUpdate(config.id, { imageUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>IMAGE LINK</label>
                </div>
                <input
                  type="text"
                  value={config.imageLink || ''}
                  onChange={(e) => onUpdate(config.id, { imageLink: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-white/60 uppercase tracking-widest">PROJECT VISIBLE</label>
                <button 
                  onClick={() => onUpdate(config.id, { projectVisible: !config.projectVisible })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${config.projectVisible !== false ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.projectVisible !== false ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] text-white/60 uppercase tracking-widest">FADE EFFECT</label>
                <button 
                  onClick={() => onUpdate(config.id, { projectFade: config.projectFade === false ? true : false })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${config.projectFade !== false ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.projectFade !== false ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>PROJECT MEDIA URL (IMG/VIDEO)</label>
                </div>
                <input
                  type="text"
                  value={config.projectMediaUrl || ''}
                  onChange={(e) => onUpdate(config.id, { projectMediaUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50 mb-2"
                  placeholder="https://example.com/media.mp4"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="text-[10px] text-white/60 uppercase tracking-widest">CIRCLE MASK (1:1)</label>
                  <button 
                    onClick={() => onUpdate(config.id, { projectMediaCircleMask: !config.projectMediaCircleMask })}
                    className={`w-8 h-4 rounded-full transition-colors relative ${config.projectMediaCircleMask ? 'bg-blue-600' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.projectMediaCircleMask ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>PROJECT LINK URL</label>
                </div>
                <input
                  type="text"
                  value={config.projectLinkUrl || ''}
                  onChange={(e) => onUpdate(config.id, { projectLinkUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>PROJECT TEXT</label>
                </div>
                <textarea
                  value={config.projectText || ''}
                  onChange={(e) => onUpdate(config.id, { projectText: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white/80 text-xs focus:outline-none focus:border-blue-500/50 resize-y min-h-[60px]"
                  placeholder="Enter project description..."
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>PARALLAX SPEED</label>
                  <span>{(config.projectParallaxSpeed || 0.5).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={config.projectParallaxSpeed || 0.5}
                  onChange={(e) => onUpdate(config.id, { projectParallaxSpeed: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>HORIZONTAL OFFSET (FROM CENTER)</label>
                  <span>{config.projectHorizontalPosition ?? 0}vw</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={config.projectHorizontalPosition ?? 0}
                  onChange={(e) => onUpdate(config.id, { projectHorizontalPosition: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[8px] text-white/30 mt-1">
                  <span>LEFT (-)</span>
                  <span>CENTER (0)</span>
                  <span>RIGHT (+)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>VERTICAL OFFSET</label>
                  <span>{config.projectVerticalPosition ?? 0}vh</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={config.projectVerticalPosition ?? 0}
                  onChange={(e) => onUpdate(config.id, { projectVerticalPosition: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>PROJECT SIZE (WIDTH)</label>
                  <span>{(config.projectSize || 30)}vw</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="1"
                  value={config.projectSize || 30}
                  onChange={(e) => onUpdate(config.id, { projectSize: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Secondary Graphic</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-white/60 uppercase tracking-widest">FADE</span>
                    <button 
                      onClick={() => onUpdate(config.id, { projectSecondaryFade: config.projectSecondaryFade === false ? true : false })}
                      className={`w-8 h-4 rounded-full transition-colors relative ${config.projectSecondaryFade !== false ? 'bg-blue-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.projectSecondaryFade !== false ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60">
                    <label>SECONDARY MEDIA URL</label>
                  </div>
                  <input
                    type="text"
                    value={config.projectSecondaryMediaUrl || ''}
                    onChange={(e) => onUpdate(config.id, { projectSecondaryMediaUrl: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50 mb-2"
                    placeholder="https://example.com/logo.png"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <label className="text-[10px] text-white/60 uppercase tracking-widest">CIRCLE MASK (1:1)</label>
                    <button 
                      onClick={() => onUpdate(config.id, { projectSecondaryMediaCircleMask: !config.projectSecondaryMediaCircleMask })}
                      className={`w-8 h-4 rounded-full transition-colors relative ${config.projectSecondaryMediaCircleMask ? 'bg-blue-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.projectSecondaryMediaCircleMask ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60">
                    <label>SECONDARY PARALLAX SPEED</label>
                    <span>{(config.projectSecondaryParallaxSpeed ?? 0.5).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={config.projectSecondaryParallaxSpeed ?? 0.5}
                    onChange={(e) => onUpdate(config.id, { projectSecondaryParallaxSpeed: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60">
                    <label>SECONDARY HORIZONTAL OFFSET</label>
                    <span>{config.projectSecondaryHorizontalPosition ?? 0}vw</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={config.projectSecondaryHorizontalPosition ?? 0}
                    onChange={(e) => onUpdate(config.id, { projectSecondaryHorizontalPosition: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60">
                    <label>SECONDARY VERTICAL OFFSET</label>
                    <span>{config.projectSecondaryVerticalPosition ?? 0}vh</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={config.projectSecondaryVerticalPosition ?? 0}
                    onChange={(e) => onUpdate(config.id, { projectSecondaryVerticalPosition: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60">
                    <label>SECONDARY SIZE (WIDTH)</label>
                    <span>{(config.projectSecondarySize || 15)}vw</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={config.projectSecondarySize || 15}
                    onChange={(e) => onUpdate(config.id, { projectSecondarySize: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-4">
            <button 
              onClick={() => scrollToSection(index - 1)} 
              disabled={index === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors text-xs font-bold"
            >
              <ChevronUp size={14} />
              PREV
            </button>
            <button 
              onClick={() => scrollToSection(index + 1)} 
              disabled={index === configs.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors text-xs font-bold"
            >
              NEXT
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      )})}

      <div className="mt-6 pt-4 border-t border-white/10 text-[9px] text-white/30 text-center uppercase tracking-widest">
        Scroll to animate • Drag sliders to adjust
      </div>
    </div>
    )}
    </>
  );
}
