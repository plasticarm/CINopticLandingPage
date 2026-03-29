import React, { useState } from 'react';
import { ShaderConfig } from '../types';
import { Settings2, Play, Pause, RotateCcw, Code, Check, Info, ExternalLink } from 'lucide-react';
import { shaderRegistry } from '../shaderRegistry';

interface ControlsProps {
  configs: ShaderConfig[];
  onUpdate: (id: string, updates: Partial<ShaderConfig>) => void;
}

export default function Controls({ configs, onUpdate }: ControlsProps) {
  const [copied, setCopied] = React.useState(false);
  const [showEmbedInfo, setShowEmbedInfo] = React.useState(false);
  const [customEmbedUrl, setCustomEmbedUrl] = React.useState('');

  const getEmbedUrl = () => {
    const baseUrl = customEmbedUrl || `${window.location.origin}${window.location.pathname}`;
    const url = new URL(baseUrl);
    url.searchParams.set('hideUI', 'true');
    
    // Serialize configs to URL parameter
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
        text: c.text
      }));
      url.searchParams.set('config', JSON.stringify(serializedConfigs));
    } catch (e) {
      console.error('Failed to serialize configs', e);
    }
    
    return url.toString();
  };

  const copyEmbedCode = () => {
    const embedUrl = getEmbedUrl();
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`;
    
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

  return (
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

          <button 
            onClick={copyEmbedCode}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={14} />
                COPIED!
              </>
            ) : (
              <>
                <Code size={14} />
                COPY IFRAME CODE
              </>
            )}
          </button>
        </div>
      )}

      {configs.map((config, index) => {
        const availableShaders = shaderRegistry[config.id] || shaderRegistry.final;
        return (
        <div key={config.id} className="mb-8 last:mb-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-white/40">0{index + 1}.</span>
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">{config.name}</h3>
          </div>

          <div className="space-y-4">
            {availableShaders.length > 1 && (
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-white/60">
                  <label>SHADER VARIANT</label>
                </div>
                <select
                  value={config.shaderId || '0'}
                  onChange={(e) => onUpdate(config.id, { shaderId: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80 text-xs focus:outline-none focus:border-blue-500/50"
                >
                  {availableShaders.map((shader, i) => (
                    <option key={i} value={i.toString()}>{shader.name}</option>
                  ))}
                </select>
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
          </div>
        </div>
      )})}

      <div className="mt-6 pt-4 border-t border-white/10 text-[9px] text-white/30 text-center uppercase tracking-widest">
        Scroll to animate • Drag sliders to adjust
      </div>
    </div>
  );
}
