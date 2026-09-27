import React, { useEffect, useRef, useState } from 'react';
import { WaterRenderer } from './WaterSimulation.ts';
import {
  loadProjectorState,
  subscribeProjectorState,
  ProjectorSyncState,
  defaultProjectorState,
} from '../utils/projectorSync.ts';
import {
  Maximize2,
  Minimize2,
} from 'lucide-react';

/**
 * Pure Projector View (Extended Display / New Tab)
 * - 100% PURE CANVAS: Absolutely zero color controls or complex menus.
 * - Displays smart home simulated triggers (baby stir, cry, doorbell, garden motion) in real-time
 *   as triggered from the main dashboard app.
 * - Single Fullscreen button in top-right corner that auto-hides smoothly after 3 seconds of inactivity.
 * - Pitch-black (#000000) pure wall canvas with hidden cursor.
 */
export const PureProjectorView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waterRendererRef = useRef<WaterRenderer>(new WaterRenderer());

  const [state, setState] = useState<ProjectorSyncState>(() => loadProjectorState());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to real-time updates from the dashboard tab (alerts, triggers, motion, shape)
  useEffect(() => {
    const unsubscribe = subscribeProjectorState((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Monitor fullscreen change events (e.g. via Escape key or browser shortcut)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync canvas size dynamically on resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation render loop
  useEffect(() => {
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

      waterRendererRef.current.render(
        ctx,
        width,
        height,
        time,
        state.activeAlert,
        {
          radiusScale: state.circleRadiusScale || defaultProjectorState.circleRadiusScale,
          waveSpeed: state.waveSpeed || defaultProjectorState.waveSpeed,
          waveIntensity: state.waveIntensity || defaultProjectorState.waveIntensity,
          shapeMode: state.shapeMode || defaultProjectorState.shapeMode,
          morphIntensity: state.morphIntensity ?? defaultProjectorState.morphIntensity,
          enableKineticDrift: Boolean(state.enableKineticDrift),
          motionMode: 'zen_pool',
          naturalColor: state.naturalColor || defaultProjectorState.naturalColor,
        }
      );

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [state]);

  // Auto-hide fullscreen button after 3 seconds of inactivity, reveal on mouse move
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request error', err);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      className={`fixed inset-0 w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center p-0 m-0 ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Discreet fullscreen button in top-right corner, auto-hides for pure wall projection */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 backdrop-blur-md text-xs font-medium shadow-lg transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Extended Display)'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-emerald-400" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-neutral-200" />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {/* Main Pure Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-contain"
      />
    </div>
  );
};
