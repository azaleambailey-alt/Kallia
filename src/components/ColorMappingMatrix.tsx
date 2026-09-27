import React, { useState } from 'react';
import { TriggerMappingRule, AnimationPattern } from '../types.ts';
import {
  Palette,
  Sliders,
  Sparkles,
  Zap,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ColorMappingMatrixProps {
  mappings: Record<string, TriggerMappingRule>;
  onUpdateMapping: (eventKey: string, rule: Partial<TriggerMappingRule>) => Promise<void>;
  onTestTrigger: (triggerKey: string) => Promise<void>;
}

export const ColorMappingMatrix: React.FC<ColorMappingMatrixProps> = ({
  mappings,
  onUpdateMapping,
  onTestTrigger,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const patterns: { key: AnimationPattern; label: string }[] = [
    { key: 'wave', label: 'Breathing Wave (Calm)' },
    { key: 'pulse', label: 'Harmonic Pulse (Alert)' },
    { key: 'aurora', label: 'Luminous Aurora' },
    { key: 'particles', label: 'Particle Cloud' },
    { key: 'strobe', label: 'Emergency Strobe' },
    { key: 'flood', label: 'Solid Architectural Flood' },
  ];

  const handleColorChange = async (
    eventKey: string,
    field: 'primaryColor' | 'secondaryColor',
    value: string
  ) => {
    await onUpdateMapping(eventKey, { [field]: value });
  };

  const handlePatternChange = async (eventKey: string, pattern: AnimationPattern) => {
    await onUpdateMapping(eventKey, { animationPattern: pattern });
    setSuccessKey(eventKey);
    setTimeout(() => setSuccessKey(null), 1500);
  };

  const handleSpeedChange = async (eventKey: string, speed: number) => {
    await onUpdateMapping(eventKey, { speed });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Color & Projection Mapping Rule Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure what colors, ripple patterns, and MadMapper Cues represent each IoT event.
            For example, set Baby Awake to soothing lavender and Doorbell to alerting crimson red.
          </p>
        </div>
      </div>

      {/* Rules Matrix Cards */}
      <div className="space-y-4">
        {Object.entries(mappings).map(([key, rule]) => (
          <div
            key={key}
            className="bg-slate-900/70 rounded-2xl border border-slate-800 hover:border-slate-700/80 p-5 transition-all space-y-4 relative overflow-hidden"
          >
            {/* Top row: Event Title + Device Badge + Test Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shadow-lg shrink-0"
                  style={{ backgroundColor: rule.primaryColor }}
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{rule.label}</h3>
                  <span className="text-[11px] text-slate-400">{rule.deviceName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTestTrigger(rule.eventKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-sm transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test on Wall</span>
                </button>
              </div>
            </div>

            {/* Design Rationale Callout */}
            {rule.designRationale && (
              <div className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 text-xs text-slate-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px] text-slate-300">
                  <strong className="text-slate-200">Sensory Rationale: </strong>
                  {rule.designRationale}
                </p>
              </div>
            )}

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Primary Color Picker */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Primary Alert Color
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={rule.primaryColor}
                    onChange={(e) => handleColorChange(key, 'primaryColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={rule.primaryColor.toUpperCase()}
                    onChange={(e) => handleColorChange(key, 'primaryColor', e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Secondary Accent Color Picker */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Secondary Wave Color
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={rule.secondaryColor}
                    onChange={(e) => handleColorChange(key, 'secondaryColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={rule.secondaryColor.toUpperCase()}
                    onChange={(e) => handleColorChange(key, 'secondaryColor', e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Animation Pattern Dropdown */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Visual Pattern
                </label>
                <select
                  value={rule.animationPattern}
                  onChange={(e) =>
                    handlePatternChange(key, e.target.value as AnimationPattern)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-sans text-xs focus:outline-none focus:border-indigo-500"
                >
                  {patterns.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Slider */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Pulse Speed</span>
                  <span className="text-white font-mono">{rule.speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={rule.speed}
                  onChange={(e) => handleSpeedChange(key, parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Bottom Row: MadMapper Cue & OSC Address Metadata */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">MadMapper Cue:</span>
                <span className="text-indigo-400 font-semibold">{rule.madMapperCueName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">OSC Target:</span>
                <span className="text-emerald-400">{rule.madMapperOscAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Alert Timeout:</span>
                <span className="text-slate-200">{rule.timeoutSeconds}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
