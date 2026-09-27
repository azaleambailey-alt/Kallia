import React from 'react';
import { ActiveAlert, MadMapperSettings } from '../types.ts';
import {
  Sparkles,
  Maximize2,
  Tv,
  Radio,
  Palette,
  Network,
  Bot,
  AlertCircle,
  X,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'stage' | 'devices' | 'bridge' | 'matrix' | 'ai';
  setActiveTab: (tab: 'stage' | 'devices' | 'bridge' | 'matrix' | 'ai') => void;
  activeAlert: ActiveAlert | null;
  onClearAlert: () => void;
  settings: MadMapperSettings;
  onOpenProjector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeAlert,
  onClearAlert,
  settings,
  onOpenProjector,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                LuminaMap
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MadMapper Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              IoT Baby Monitor & Doorbell Projection Mapping Controller
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('stage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'stage'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Wall Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'devices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>IoT Demo Triggers</span>
          </button>

          <button
            onClick={() => setActiveTab('bridge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'bridge'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>MadMapper Bridge</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>Lumina AI</span>
          </button>
        </nav>

        {/* Right Status Area */}
        <div className="flex items-center gap-3">
          {/* MadMapper Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">OSC:</span>
            <span className="text-slate-200">{settings.host}:{settings.oscPort}</span>
          </div>

          {/* Active Alert Ticker */}
          {activeAlert && (
            <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/50 px-3 py-1 rounded-xl text-xs text-red-200">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span className="font-semibold truncate max-w-[140px] sm:max-w-xs">
                {activeAlert.triggerName}
              </span>
              <button
                onClick={onClearAlert}
                title="Dismiss Alert"
                className="hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={onOpenProjector}
            title="Launch Fullscreen Projector Screen"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Projector Mode</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav row */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-800/60 gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('stage')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${
            activeTab === 'stage' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Wall Canvas
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${
            activeTab === 'devices' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          IoT Triggers
        </button>
        <button
          onClick={() => setActiveTab('bridge')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${
            activeTab === 'bridge' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          MadMapper
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${
            activeTab === 'matrix' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Color Rules
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${
            activeTab === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          Lumina AI
        </button>
      </div>
    </header>
  );
};
