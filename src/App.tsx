import React, { useState } from 'react';
import { ActiveAlert } from './types.ts';
import { ProjectionStage } from './components/ProjectionStage.tsx';
import { ProjectorModal } from './components/ProjectorModal.tsx';
import { OnePagerModal } from './components/OnePagerModal.tsx';
import { PureProjectorView } from './components/PureProjectorView.tsx';
import { saveProjectorState } from './utils/projectorSync.ts';
import {
  Tv,
  RotateCcw,
  Plus,
  Wifi,
  Radio,
  Palette,
  Sparkles,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Droplets,
  Layers,
  FileText,
  Copy,
} from 'lucide-react';

interface SmartDevice {
  id: string;
  name: string;
  category: string;
  brand: string;
  connected: boolean;
  defaultEvent: string;
  colorKey: string;
}

export default function App() {
  // First thing the user sees is the living amorphous blob canvas
  const [activeTab, setActiveTab] = useState<'canvas' | 'connect' | 'palette'>('canvas');
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isOnePagerOpen, setIsOnePagerOpen] = useState(false);
  const [naturalColor, setNaturalColor] = useState<string>('#FFFFFF');

  // Smart Home Devices
  const [devices, setDevices] = useState<SmartDevice[]>([
    {
      id: 'baby_cam',
      name: 'Nursery Baby Monitor',
      category: 'Baby & Sound',
      brand: 'Nanit / Owlet',
      connected: true,
      defaultEvent: 'Wakes up or stirs',
      colorKey: 'baby_awake',
    },
    {
      id: 'doorbell',
      name: 'Front Porch Doorbell',
      category: 'Security & Door',
      brand: 'Ring / Nest',
      connected: true,
      defaultEvent: 'Doorbell ring or motion',
      colorKey: 'someone_at_door',
    },
    {
      id: 'baby_cry',
      name: 'Crib Sound Sensor',
      category: 'Audio Monitor',
      brand: 'Cubo AI',
      connected: false,
      defaultEvent: 'Crying or fussing detected',
      colorKey: 'baby_crying',
    },
    {
      id: 'patio_motion',
      name: 'Garden & Patio Sensor',
      category: 'Perimeter',
      brand: 'Philips Hue Outdoor',
      connected: false,
      defaultEvent: 'Evening motion detected',
      colorKey: 'patio_motion',
    },
  ]);

  // Streamlined color mapping for alerts
  const [inputColors, setInputColors] = useState<Record<string, { label: string; primaryColor: string }>>({
    natural: {
      label: 'Natural Resting Light',
      primaryColor: '#FFFFFF',
    },
    baby_awake: {
      label: 'Baby Woke Up',
      primaryColor: '#DDD6FE', // Gentle Lavender
    },
    baby_crying: {
      label: 'Baby Crying',
      primaryColor: '#FDA4AF', // Soft Peach Rose
    },
    someone_at_door: {
      label: 'Front Doorbell',
      primaryColor: '#F87171', // Soft Coral
    },
    patio_motion: {
      label: 'Garden Motion',
      primaryColor: '#A7F3D0', // Sage Mint
    },
  });

  // Serene pastel palette presets
  const serenePalette = [
    { name: 'Pure White', hex: '#FFFFFF' },
    { name: 'Warm Cream', hex: '#FDFBF7' },
    { name: 'Soft Pink', hex: '#FBCFE8' },
    { name: 'Blush Peach', hex: '#FED7AA' },
    { name: 'Gentle Lavender', hex: '#DDD6FE' },
    { name: 'Powder Sky', hex: '#BAE6FD' },
    { name: 'Sage Mint', hex: '#A7F3D0' },
    { name: 'Muted Coral', hex: '#FCA5A5' },
  ];

  // Standalone projector window mode (e.g. ?projector=true) for secondary/extended displays
  const isStandaloneProjector =
    typeof window !== 'undefined' && window.location.search.includes('projector=true');

  if (isStandaloneProjector) {
    return <PureProjectorView />;
  }

  const toggleDeviceConnection = (id: string) => {
    setDevices((prev) =>
      prev.map((dev) => (dev.id === id ? { ...dev, connected: !dev.connected } : dev))
    );
  };

  const handleTestInput = (key: string) => {
    if (key === 'natural') {
      setActiveAlert(null);
      return;
    }

    const item = inputColors[key];
    if (!item) return;

    setActiveAlert({
      id: String(Date.now()),
      deviceId: key,
      triggerKey: key,
      deviceName: 'Smart Home Device',
      triggerName: item.label,
      severity: 'info',
      timestamp: new Date().toISOString(),
      expiresAt: Date.now() + 15000,
      primaryColor: item.primaryColor,
      secondaryColor: '#FFFFFF',
      animationPattern: 'wave',
      intensity: 1.0,
      speed: 1.0,
      madMapperCueName: item.label,
      madMapperOscAddress: `/sensor/${key}`,
    });
  };

  const handleColorUpdate = (key: string, newHex: string) => {
    if (key === 'natural') {
      setNaturalColor(newHex);
    }
    setInputColors((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        primaryColor: newHex,
      },
    }));

    if (activeAlert?.triggerKey === key) {
      setActiveAlert((prev) => (prev ? { ...prev, primaryColor: newHex } : null));
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 flex flex-col font-sans selection:bg-stone-300">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-stone-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-100 via-stone-100 to-sky-100 border border-stone-200 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-stone-900">
              Kallia
            </h1>
            <p className="text-[11px] text-stone-400 font-normal">
              Art that Notices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOnePagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-white border border-stone-200/90 hover:bg-stone-50 transition shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>One-Pager</span>
          </button>

          <a
            href={`${typeof window !== 'undefined' ? window.location.origin : ''}${typeof window !== 'undefined' ? window.location.pathname : ''}?projector=true`}
            target="_blank"
            rel="noopener noreferrer"
            title="Populate clean projection into a new tab for your extended display (0 controls)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white" />
            <span>Open in New Tab</span>
          </a>

          <button
            onClick={() => setIsProjectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 transition shadow-xs"
          >
            <Tv className="w-3.5 h-3.5 text-stone-300" />
            <span>Project on Wall</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Left-hand navigation tabs + Right-hand view */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* LEFT-SIDE NAVIGATION TABS */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-2.5 shadow-xs space-y-1">
            <p className="px-3 pt-2 pb-1.5 text-[10px] uppercase tracking-wider font-semibold text-stone-400">
              Navigation
            </p>

            {/* Tab 1: Living Canvas (The Art) */}
            <button
              onClick={() => setActiveTab('canvas')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                activeTab === 'canvas'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
              }`}
            >
              <Droplets className={`w-4 h-4 ${activeTab === 'canvas' ? 'text-teal-300' : 'text-stone-400'}`} />
              <div className="flex-1 min-w-0">
                <span className="block font-semibold">Living Canvas</span>
                <span className={`text-[10px] block truncate ${activeTab === 'canvas' ? 'text-stone-300' : 'text-stone-400'}`}>
                  The Art
                </span>
              </div>
            </button>

            {/* Tab 2: Connect Smart Home Devices */}
            <button
              onClick={() => setActiveTab('connect')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                activeTab === 'connect'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
              }`}
            >
              <Wifi className={`w-4 h-4 ${activeTab === 'connect' ? 'text-teal-300' : 'text-stone-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">Connect Devices</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'connect' ? 'bg-stone-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    2 Active
                  </span>
                </div>
                <span className={`text-[10px] block truncate ${activeTab === 'connect' ? 'text-stone-300' : 'text-stone-400'}`}>
                  Smart monitors & bells
                </span>
              </div>
            </button>

            {/* Tab 3: Color Tones Palette */}
            <button
              onClick={() => setActiveTab('palette')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                activeTab === 'palette'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
              }`}
            >
              <Palette className={`w-4 h-4 ${activeTab === 'palette' ? 'text-teal-300' : 'text-stone-400'}`} />
              <div className="flex-1 min-w-0">
                <span className="block font-semibold">Color Tones</span>
                <span className={`text-[10px] block truncate ${activeTab === 'palette' ? 'text-stone-300' : 'text-stone-400'}`}>
                  Customize light hues
                </span>
              </div>
            </button>
          </div>

          {/* Quick Resting State Color Swatches in sidebar */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-stone-200/70 p-3.5 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-stone-500">
                Natural Resting Glow
              </span>
              {activeAlert && (
                <button
                  onClick={() => setActiveAlert(null)}
                  className="text-[10px] text-stone-500 hover:text-stone-900 underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {serenePalette.map((swatch) => {
                const isSelected = naturalColor.toUpperCase() === swatch.hex.toUpperCase();
                return (
                  <button
                    key={swatch.hex}
                    onClick={() => handleColorUpdate('natural', swatch.hex)}
                    title={swatch.name}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      isSelected
                        ? 'border-stone-900 scale-120 ring-1.5 ring-stone-400 shadow-xs'
                        : 'border-stone-300 hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick One-Pager Card */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-3.5 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[11px] text-stone-200">Kallia Brief</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">1-Pager</span>
            </div>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              Product summary, IoT trigger mapping, and MadMapper OSC specs.
            </p>
            <button
              onClick={() => setIsOnePagerOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 transition"
            >
              <Copy className="w-3 h-3 text-stone-400" />
              <span>View & Copy 1-Pager</span>
            </button>
          </div>
        </aside>

        {/* RIGHT-SIDE CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: THE AMORPHOUS BLOB LIVING CANVAS (DEFAULT FIRST VIEW) */}
          {activeTab === 'canvas' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <ProjectionStage
                activeAlert={activeAlert}
                onClearAlert={() => setActiveAlert(null)}
                onOpenProjectorWindow={() => setIsProjectorOpen(true)}
                naturalColor={naturalColor}
                onUpdateNaturalColor={setNaturalColor}
                onTriggerSimulation={handleTestInput}
              />
            </div>
          )}

          {/* TAB 2: CONNECT SMART HOME DEVICES */}
          {activeTab === 'connect' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-7 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">
                      Connect Your Smart Home Devices
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Link your nursery monitors, doorbells, and sensors. When an event happens, Kallia gently blooms the amorphous light pool instead of sounding loud alarms.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      2 Connected
                    </span>
                  </div>
                </div>

                {/* Device Cards */}
                <div className="mt-5 space-y-3">
                  {devices.map((device) => {
                    const mappedColor = inputColors[device.colorKey]?.primaryColor || '#FFFFFF';

                    return (
                      <div
                        key={device.id}
                        className="p-4 rounded-2xl border border-stone-200/70 bg-stone-50/50 hover:bg-white hover:border-stone-300 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-stone-200"
                            style={{ backgroundColor: `${mappedColor}33` }}
                          >
                            <span
                              className="w-4 h-4 rounded-full shadow-xs"
                              style={{ backgroundColor: mappedColor }}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-stone-900">
                                {device.name}
                              </h3>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200/60 text-stone-600 font-medium">
                                {device.brand}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Notices: {device.defaultEvent}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleTestInput(device.colorKey);
                              setActiveTab('canvas');
                            }}
                            className="text-xs text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition"
                          >
                            Test Visual
                          </button>

                          <button
                            onClick={() => toggleDeviceConnection(device.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                              device.connected
                                ? 'bg-stone-900 text-stone-50 hover:bg-stone-800'
                                : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            {device.connected ? 'Connected' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Integration Banner */}
                <div className="mt-5 p-4 rounded-2xl border border-dashed border-stone-300/80 bg-stone-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-stone-800">
                        Add New Smart Home Device
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        Apple Home, Google Home, Matter, Ring, Nanit, Philips Hue, or Home Assistant
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Smart Home auto-discovery is scanning your local Wi-Fi network for Matter & HomeKit devices.')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  >
                    Pair Device
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR TONES MAPPING */}
          {activeTab === 'palette' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-stone-800">
                      Color Tones
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Choose the light tone for your natural resting state and notifications. Click any pastel circle.
                    </p>
                  </div>

                  {activeAlert && (
                    <button
                      onClick={() => setActiveAlert(null)}
                      className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-medium px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Natural</span>
                    </button>
                  )}
                </div>

                {/* Clean, Elegant Color Rows */}
                <div className="divide-y divide-stone-100">
                  {Object.entries(inputColors).map(([key, item]) => {
                    const isSelected = (key === 'natural' && !activeAlert) || (activeAlert?.triggerKey === key);

                    return (
                      <div
                        key={key}
                        className={`py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 rounded-2xl px-3 transition-colors ${
                          isSelected ? 'bg-stone-100/60' : 'hover:bg-stone-50/50'
                        }`}
                      >
                        {/* Left: Swatch + Label */}
                        <div className="flex items-center gap-3">
                          {key === 'natural' ? (
                            <div
                              className="w-8 h-8 rounded-full border border-stone-300/80 shadow-xs shrink-0"
                              style={{ backgroundColor: item.primaryColor }}
                              title="Current Natural Color"
                            />
                          ) : (
                            <label
                              className="relative w-8 h-8 rounded-full border border-stone-300/80 shadow-xs cursor-pointer shrink-0 transition-transform hover:scale-105"
                              style={{ backgroundColor: item.primaryColor }}
                            >
                              <input
                                type="color"
                                value={item.primaryColor}
                                onChange={(e) => handleColorUpdate(key, e.target.value)}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                title="Pick alert hue"
                              />
                            </label>
                          )}

                          <div>
                            <span className="text-xs font-medium text-stone-800 block">
                              {item.label}
                            </span>
                            <button
                              onClick={() => {
                                handleTestInput(key);
                                setActiveTab('canvas');
                              }}
                              className="text-[11px] text-stone-400 hover:text-stone-700 transition"
                            >
                              {key === 'natural' ? 'Preview resting state' : 'Preview on living canvas →'}
                            </button>
                          </div>
                        </div>

                        {/* Right: Pastel Swatches */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {serenePalette.map((swatch) => (
                            <button
                              key={swatch.hex}
                              onClick={() => {
                                handleColorUpdate(key, swatch.hex);
                                handleTestInput(key);
                              }}
                              title={swatch.name}
                              className={`w-6 h-6 rounded-full border transition-all ${
                                item.primaryColor.toUpperCase() === swatch.hex.toUpperCase()
                                  ? 'border-stone-800 scale-110 shadow-xs ring-2 ring-stone-300/60'
                                  : 'border-stone-200/90 hover:scale-105'
                              }`}
                              style={{ backgroundColor: swatch.hex }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* External / Fullscreen Projector Modal */}
      <ProjectorModal
        isOpen={isProjectorOpen}
        activeAlert={activeAlert}
        onClose={() => setIsProjectorOpen(false)}
        naturalColor={naturalColor}
        onUpdateNaturalColor={setNaturalColor}
      />

      {/* 1-Pager Modal with 1-click Copy */}
      <OnePagerModal
        isOpen={isOnePagerOpen}
        onClose={() => setIsOnePagerOpen(false)}
        onOpenProjector={() => {
          setIsOnePagerOpen(false);
          setIsProjectorOpen(true);
        }}
      />
    </div>
  );
}
