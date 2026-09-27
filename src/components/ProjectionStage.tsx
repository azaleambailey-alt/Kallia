import React, { useEffect, useRef, useState } from 'react';
import { ActiveAlert } from '../types.ts';
import { WaterRenderer, WaterMotionMode, WaterShapeMode } from './WaterSimulation.ts';
import { 
  Maximize2, 
  SlidersHorizontal,
  Navigation,
  Palette,
  ExternalLink,
  Sparkles,
  Baby,
  Volume2,
  Bell,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { saveProjectorState } from '../utils/projectorSync.ts';

interface ProjectionStageProps {
  activeAlert: ActiveAlert | null;
  onClearAlert: () => void;
  onOpenProjectorWindow: () => void;
  naturalColor?: string;
  onUpdateNaturalColor?: (color: string) => void;
  onTriggerSimulation?: (key: string) => void;
}

export const ProjectionStage: React.FC<ProjectionStageProps> = ({
  activeAlert,
  onClearAlert,
  onOpenProjectorWindow,
  naturalColor = '#FFFFFF',
  onUpdateNaturalColor,
  onTriggerSimulation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterRendererRef = useRef<WaterRenderer>(new WaterRenderer());

  const [circleRadiusScale, setCircleRadiusScale] = useState(0.42);
  const [waveSpeed, setWaveSpeed] = useState(0.35); // 0.05x to 4.0x
  const [waveIntensity, setWaveIntensity] = useState(0.75);
  const [shapeMode, setShapeMode] = useState<WaterShapeMode>('fluid_amoeba');
  const [morphIntensity, setMorphIntensity] = useState(0.80);
  const [enableKineticDrift, setEnableKineticDrift] = useState(true);
  const [motionMode, setMotionMode] = useState<WaterMotionMode>('zen_pool');
  const [showTuning, setShowTuning] = useState(false);
  const [localNaturalColor, setLocalNaturalColor] = useState(naturalColor);

  const [hasSpawnedDrop, setHasSpawnedDrop] = useState(false);

  useEffect(() => {
    setLocalNaturalColor(naturalColor);
  }, [naturalColor]);

  const spawnDrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasSpawnedDrop(true);
    setTimeout(() => setHasSpawnedDrop(false), 500);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    // Add prominent concentric ripples radiating outwards
    waterRendererRef.current.addRipple(cx, cy, 1.8, Math.min(canvas.width, canvas.height) * 0.48);
    setTimeout(() => {
      waterRendererRef.current.addRipple(cx + 15, cy - 10, 1.4, Math.min(canvas.width, canvas.height) * 0.44);
    }, 120);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1 && Math.random() > 0.3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dist = Math.hypot(x - cx, y - cy);
    const maxRadius = Math.min(canvas.width, canvas.height) * circleRadiusScale;

    if (dist <= maxRadius * 1.15) {
      waterRendererRef.current.addRipple(x, y, 0.7, maxRadius * 0.7);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dist = Math.hypot(x - cx, y - cy);
    const maxRadius = Math.min(canvas.width, canvas.height) * circleRadiusScale;

    if (dist <= maxRadius * 1.15) {
      waterRendererRef.current.addRipple(x, y, 1.0, maxRadius);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;

      waterRendererRef.current.render(
        ctx,
        width,
        height,
        time,
        activeAlert,
        {
          radiusScale: circleRadiusScale,
          waveSpeed,
          waveIntensity,
          shapeMode,
          morphIntensity,
          enableKineticDrift,
          motionMode,
          naturalColor: localNaturalColor,
        }
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    circleRadiusScale,
    waveSpeed,
    waveIntensity,
    shapeMode,
    morphIntensity,
    enableKineticDrift,
    motionMode,
    activeAlert,
    localNaturalColor,
  ]);

  // Synchronize live parameters with the extended display projector tab
  useEffect(() => {
    saveProjectorState({
      shapeMode,
      naturalColor: localNaturalColor,
      circleRadiusScale,
      waveSpeed,
      waveIntensity,
      morphIntensity,
      enableKineticDrift,
      activeAlert,
    });
  }, [
    shapeMode,
    localNaturalColor,
    circleRadiusScale,
    waveSpeed,
    waveIntensity,
    morphIntensity,
    enableKineticDrift,
    activeAlert,
  ]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-stone-200/80 shadow-sm flex flex-col">
      {/* Calm, Zen Stage Header */}
      <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <h2 className="text-xs font-medium tracking-wide text-stone-700">
            Customize Your Uninterrupted State
          </h2>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-1.5">
          {/* Subtle Shapes */}
          <div className="flex items-center bg-stone-200/60 p-0.5 rounded-full text-[11px]">
            <button
              onClick={() => setShapeMode('fluid_amoeba')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                shapeMode === 'fluid_amoeba'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Organic
            </button>
            <button
              onClick={() => setShapeMode('pure_circle')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                shapeMode === 'pure_circle'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Circle
            </button>
            <button
              onClick={() => setShapeMode('oval_pond')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                shapeMode === 'oval_pond'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Oval
            </button>
            <button
              onClick={() => setShapeMode('droplet_tear')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                shapeMode === 'droplet_tear'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Tear
            </button>
          </div>

          {/* Natural State Preset Colors Section (Only preset colors, no custom picker) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200/50 border border-stone-200/80">
            <span className="text-[11px] font-medium text-stone-600 hidden sm:inline pl-0.5">
              Natural:
            </span>

            {/* Curated Preset Swatches */}
            {[
              { label: 'Pure White', color: '#FFFFFF' },
              { label: 'Warm Cream', color: '#FDFBF7' },
              { label: 'Soft Pink', color: '#FBCFE8' },
              { label: 'Blush Peach', color: '#FED7AA' },
              { label: 'Gentle Lavender', color: '#DDD6FE' },
              { label: 'Powder Sky', color: '#BAE6FD' },
              { label: 'Sage Mint', color: '#A7F3D0' },
              { label: 'Muted Coral', color: '#FCA5A5' },
            ].map((preset) => {
              const isSelected = localNaturalColor.toUpperCase() === preset.color.toUpperCase();
              return (
                <button
                  key={preset.color}
                  onClick={() => {
                    setLocalNaturalColor(preset.color);
                    onUpdateNaturalColor?.(preset.color);
                  }}
                  title={`Natural State: ${preset.label}`}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    isSelected
                      ? 'border-stone-900 scale-125 ring-2 ring-stone-400/80 shadow-xs'
                      : 'border-stone-300 hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.color }}
                />
              );
            })}
          </div>

          {/* Toggle tuning sliders */}
          <button
            onClick={() => setShowTuning(!showTuning)}
            title="Adjust movement"
            className={`p-1.5 rounded-full transition ${
              showTuning
                ? 'bg-stone-300/80 text-stone-900'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Open Clean Extended Display Tab (Pure Canvas, Zero Controls) */}
          <a
            href={`${window.location.origin}${window.location.pathname}?projector=true`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Clean Screen on Extended Projector Tab (Zero Controls)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs ml-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </a>

          {/* Fullscreen clean presentation */}
          <button
            onClick={onOpenProjectorWindow}
            title="Project onto wall (In-App Overlay)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 transition shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Project</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport with Pure Black Wall Backdrop */}
      <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* Minimal Quiet Alert Indicator (soft pill) */}
        {activeAlert && (
          <div className="absolute top-4 left-4 pointer-events-auto">
            <div className="flex items-center gap-2.5 bg-stone-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-700/50 shadow-md text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeAlert.primaryColor }}
              />
              <span className="text-stone-200 font-medium">
                {activeAlert.triggerName}
              </span>
              <button
                onClick={onClearAlert}
                className="text-stone-400 hover:text-stone-100 text-[11px] underline underline-offset-2 ml-1"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Subtle Zen Tuning Drawer (only visible when toggled) */}
        {showTuning && (
          <div className="absolute bottom-4 right-4 bg-stone-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-800 shadow-xl text-xs text-stone-200 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px]">Speed</span>
              <input
                type="range"
                min="0.10"
                max="2.00"
                step="0.05"
                value={waveSpeed}
                onChange={(e) => setWaveSpeed(parseFloat(e.target.value))}
                className="w-20 accent-stone-300 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px]">Size</span>
              <input
                type="range"
                min="0.25"
                max="0.48"
                step="0.01"
                value={circleRadiusScale}
                onChange={(e) => setCircleRadiusScale(parseFloat(e.target.value))}
                className="w-20 accent-stone-300 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Trigger Simulation Toolbar (Direct 1-Click Simulation for Projector Display) */}
      <div className="px-5 py-3 bg-stone-50/90 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-stone-600" />
          <span className="text-xs font-semibold text-stone-800">
            Simulate Smart Trigger:
          </span>
          <span className="text-[10px] text-stone-600 hidden sm:inline">
            (Immediately blooms onto your extended projector tab)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onTriggerSimulation?.('baby_stir')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeAlert?.triggerKey === 'baby_stir'
                ? 'bg-purple-900 text-purple-100 ring-2 ring-purple-400'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-purple-50 hover:border-purple-200'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-purple-500" />
            <span>Baby Stir</span>
          </button>

          <button
            onClick={() => onTriggerSimulation?.('baby_crying')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeAlert?.triggerKey === 'baby_crying'
                ? 'bg-rose-900 text-rose-100 ring-2 ring-rose-400'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-rose-50 hover:border-rose-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Baby Cry</span>
          </button>

          <button
            onClick={() => onTriggerSimulation?.('someone_at_door')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeAlert?.triggerKey === 'someone_at_door'
                ? 'bg-amber-900 text-amber-100 ring-2 ring-amber-400'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Doorbell</span>
          </button>

          <button
            onClick={() => onTriggerSimulation?.('patio_motion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeAlert?.triggerKey === 'patio_motion'
                ? 'bg-emerald-900 text-emerald-100 ring-2 ring-emerald-400'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-emerald-50 hover:border-emerald-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
            <span>Garden Motion</span>
          </button>

          {activeAlert && (
            <button
              onClick={onClearAlert}
              title="Reset to natural unbothered state"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
