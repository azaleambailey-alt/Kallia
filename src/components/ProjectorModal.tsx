import React, { useEffect, useRef, useState } from 'react';
import { ActiveAlert } from '../types.ts';
import { WaterRenderer, WaterMotionMode, WaterShapeMode } from './WaterSimulation.ts';
import {
  Minimize2,
  Maximize2,
  X,
  Crosshair,
  Sliders,
  ExternalLink,
  Droplet,
  Tv,
  Circle,
  Sparkles,
  Waves,
  Wind,
  Navigation,
  Shapes,
  Gauge,
  Eye,
  EyeOff,
  ArrowLeft,
  LayoutDashboard,
  Palette,
} from 'lucide-react';

interface ProjectorModalProps {
  isOpen: boolean;
  activeAlert: ActiveAlert | null;
  onClose: () => void;
  isStandalone?: boolean;
  naturalColor?: string;
  onUpdateNaturalColor?: (color: string) => void;
}

export const ProjectorModal: React.FC<ProjectorModalProps> = ({
  isOpen,
  activeAlert,
  onClose,
  isStandalone = false,
  naturalColor = '#FFFFFF',
  onUpdateNaturalColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waterRendererRef = useRef<WaterRenderer>(new WaterRenderer());

  const [showCalibrationGrid, setShowCalibrationGrid] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [circleRadiusScale, setCircleRadiusScale] = useState(0.42); // 0.20 to 0.50
  const [waveSpeed, setWaveSpeed] = useState(0.45); // Expanded Range: 0.05 to 4.0
  const [waveIntensity, setWaveIntensity] = useState(0.75); // Clean & soft
  const [shapeMode, setShapeMode] = useState<WaterShapeMode>('fluid_amoeba');
  const [morphIntensity, setMorphIntensity] = useState(0.65);
  const [enableKineticDrift, setEnableKineticDrift] = useState(true); // water sways on wall
  const [motionMode, setMotionMode] = useState<WaterMotionMode>('zen_pool');
  const [localNaturalColor, setLocalNaturalColor] = useState(naturalColor);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudManuallyRevealed, setHudManuallyRevealed] = useState(false); // Clean projector by default, no buttons popping up

  // Sync isFullscreen with real browser fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (active) {
        setShowControls(false); // Close drawers when going fullscreen
        setHudManuallyRevealed(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts: F for fullscreen, H to toggle HUD, C for calibration, S for shape, W for drop, D for drift, ESC to exit
  useEffect(() => {
    if (!isOpen && !isStandalone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'h' || e.key === 'H') {
        setHudManuallyRevealed((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCalibrationGrid((prev) => !prev);
      } else if (e.key === 'd' || e.key === 'D') {
        setEnableKineticDrift((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        cycleShapeMode();
      } else if (e.key === 'w' || e.key === 'W') {
        spawnCenterDrop();
      } else if (e.key === '+' || e.key === '=') {
        setCircleRadiusScale((prev) => Math.min(0.49, prev + 0.02));
      } else if (e.key === '-' || e.key === '_') {
        setCircleRadiusScale((prev) => Math.max(0.2, prev - 0.02));
      } else if (e.key === 'Escape' && !isStandalone) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isStandalone, shapeMode]);

  const cycleShapeMode = () => {
    const modes: WaterShapeMode[] = ['pure_circle', 'fluid_amoeba', 'oval_pond', 'droplet_tear', 'liquid_blob'];
    const idx = modes.indexOf(shapeMode);
    setShapeMode(modes[(idx + 1) % modes.length]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const spawnCenterDrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    waterRendererRef.current.addRipple(canvas.width / 2, canvas.height / 2, 1.2, 420);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1 && e.pressure === 0 && Math.random() > 0.3) return;
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
      waterRendererRef.current.addRipple(x, y, 0.65, maxRadius * 0.7);
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
      waterRendererRef.current.addRipple(x, y, 1.1, maxRadius);
    }
  };

  const openInNewWindow = () => {
    const url = `${window.location.origin}${window.location.pathname}?projector=true`;
    window.open(url, 'LuminaWaterProjector', 'width=1920,height=1080,menubar=no,toolbar=no,location=no');
  };

  // Canvas loop rendering moving water output
  useEffect(() => {
    if (!isOpen && !isStandalone) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;

      // Calibration Focus Test Pattern
      if (showCalibrationGrid) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(2, 2, width - 4, height - 4);

        ctx.strokeStyle = 'rgba(0, 255, 102, 0.25)';
        for (let x = 0; x <= width; x += width * 0.1) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += height * 0.1) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const targetRadius = Math.min(width, height) * circleRadiusScale;
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, targetRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00FF66';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillText(`PROJECTOR WATER SHAPE CALIBRATION (${width}x${height})`, 40, 50);
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillText(`Focus projector lens until sharp. Press 'C' to return to pure water pool.`, 40, 80);

        ctx.restore();
        animationId = requestAnimationFrame(render);
        return;
      }

      // Render Hyper-Fluid Moving Water
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

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [
    isOpen,
    isStandalone,
    activeAlert,
    showCalibrationGrid,
    circleRadiusScale,
    waveSpeed,
    waveIntensity,
    shapeMode,
    morphIntensity,
    enableKineticDrift,
    motionMode,
    localNaturalColor,
  ]);

  if (!isOpen && !isStandalone) return null;

  // By default when opening "Project on wall", keep projection completely clean (0 buttons popping up on the wall)
  // Only reveal if the user explicitly presses 'H' or hovers near top
  const hideHud = !hudManuallyRevealed;

  return (
    <div
      ref={containerRef}
      className={`${
        isStandalone ? 'w-screen h-screen' : 'fixed inset-0 z-50'
      } bg-black flex items-center justify-center overflow-hidden select-none`}
    >
      {/* Top HUD Floating Control Bar - HIDDEN BY DEFAULT ON WALL */}
      {!hideHud && (
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between opacity-90 hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 font-mono">
            <Circle className="w-4 h-4 text-cyan-300 fill-white animate-pulse" />
            <span className="font-bold text-white tracking-wide">Kallia</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 capitalize font-medium">{shapeMode.replace('_', ' ')}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-bold">{waveSpeed.toFixed(2)}x Velocity</span>
            {enableKineticDrift && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Drifting
              </span>
            )}
          </div>

          {/* Action Tool Buttons */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 text-xs">
            {/* Shape Selector Button */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setShapeMode('pure_circle')}
                title="Perfect Geometric Circle"
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  shapeMode === 'pure_circle'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Circle
              </button>
              <button
                onClick={() => setShapeMode('fluid_amoeba')}
                title="Living Fluid Amoeba (Morphing Shape)"
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  shapeMode === 'fluid_amoeba'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Amoeba
              </button>
              <button
                onClick={() => setShapeMode('oval_pond')}
                title="Oval Water Pond"
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  shapeMode === 'oval_pond'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Oval
              </button>
              <button
                onClick={() => setShapeMode('droplet_tear')}
                title="Teardrop Water Pool"
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  shapeMode === 'droplet_tear'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Teardrop
              </button>
              <button
                onClick={() => setShapeMode('liquid_blob')}
                title="Multi-Lobe Liquid Blob"
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  shapeMode === 'liquid_blob'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Blob
              </button>
            </div>

            {/* Quick Drop Splash */}
            <button
              onClick={spawnCenterDrop}
              title="Create Water Ripple Splash [W]"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Droplet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Drop Splash [W]</span>
            </button>

            {/* Toggle Kinetic Floating Drift */}
            <button
              onClick={() => setEnableKineticDrift(!enableKineticDrift)}
              title="Toggle Floating Drift on Wall [D]"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                enableKineticDrift
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Drift [D]</span>
            </button>

            {/* Toggle Sliders Panel */}
            <button
              onClick={() => setShowControls(!showControls)}
              title="Velocity & Shape Morph Controls"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                showControls
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Controls</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen [F]"
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Launch Clean Extended Display Tab */}
            <a
              href={`${window.location.origin}${window.location.pathname}?projector=true`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Clean Screen on Extended Projector Tab (Zero Controls)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Extended Display Tab</span>
            </a>

            {/* Return to User Dashboard Button */}
            {isStandalone ? (
              <a
                href={window.location.pathname}
                title="Return to User Dashboard Page"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </a>
            ) : (
              <button
                onClick={onClose}
                title="Return to User Dashboard Page (ESC)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={onClose}
                title="Close (ESC)"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Controls Drawer */}
      {!hideHud && showControls && (
        <div className="absolute top-16 right-4 z-50 bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 shadow-2xl text-xs space-y-4 w-84 text-slate-200">
          <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Water Velocity & Shape Morphing
            </span>
            <button
              onClick={() => setShowControls(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Natural Color Selector */}
          <div>
            <div className="flex justify-between text-slate-400 text-[11px] mb-1.5">
              <span>Natural State Color</span>
              <span className="font-mono text-cyan-300 font-bold uppercase">{localNaturalColor}</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { name: 'White', color: '#F8FAFC' },
                { name: 'Pink', color: '#F472B6' },
                { name: 'Lavender', color: '#A78BFA' },
                { name: 'Sky', color: '#38BDF8' },
                { name: 'Mint', color: '#34D399' },
                { name: 'Amber', color: '#FBBF24' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => {
                    setLocalNaturalColor(swatch.color);
                    onUpdateNaturalColor?.(swatch.color);
                  }}
                  title={swatch.name}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    localNaturalColor === swatch.color
                      ? 'border-white scale-110 shadow-md'
                      : 'border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
              <input
                type="color"
                value={localNaturalColor.startsWith('#') ? localNaturalColor : '#FFFFFF'}
                onChange={(e) => {
                  setLocalNaturalColor(e.target.value);
                  onUpdateNaturalColor?.(e.target.value);
                }}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                title="Custom Color Picker"
              />
            </div>
          </div>

          {/* Velocity Range */}
          <div>
            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
              <span>Velocity</span>
              <span className="font-mono text-cyan-300 font-bold">{waveSpeed.toFixed(2)}x Speed</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="4.00"
              step="0.05"
              value={waveSpeed}
              onChange={(e) => setWaveSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Shape Morph Intensity */}
          <div>
            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
              <span>Morph Flex Amplitude</span>
              <span className="font-mono text-amber-300 font-bold">{Math.round(morphIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={morphIntensity}
              onChange={(e) => setMorphIntensity(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Size Scale */}
          <div>
            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
              <span>Water Pool Size on Wall</span>
              <span className="font-mono text-white">{Math.round(circleRadiusScale * 200)}%</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.49"
              step="0.01"
              value={circleRadiusScale}
              onChange={(e) => setCircleRadiusScale(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Canvas rendering to the physical projector */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        onClick={handleCanvasClick}
        onPointerMove={handlePointerMove}
        className="w-full h-full object-contain cursor-none"
      />

      {/* Tiny quiet ESC / Exit pill in bottom corner that fades away */}
      <div className="absolute bottom-3 right-4 z-30 opacity-20 hover:opacity-100 transition-opacity">
        <button
          onClick={onClose}
          className="text-[11px] text-stone-500 hover:text-stone-300 font-mono bg-stone-950/80 px-2.5 py-1 rounded-full border border-stone-800"
        >
          ESC to exit
        </button>
      </div>
    </div>
  );
};
