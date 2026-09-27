import React, { useState } from 'react';
import { MadMapperSettings, OscLogEntry } from '../types.ts';
import {
  Network,
  Radio,
  Sliders,
  Terminal,
  Download,
  Copy,
  Check,
  Send,
  HelpCircle,
  ExternalLink,
  Laptop,
  Maximize2,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface MadMapperBridgeProps {
  settings: MadMapperSettings;
  oscLogs: OscLogEntry[];
  onUpdateSettings: (newSettings: Partial<MadMapperSettings>) => Promise<void>;
  onSendTestOsc: (address: string, args: (number | string | boolean)[]) => Promise<void>;
  onOpenProjectorWindow: () => void;
}

export const MadMapperBridge: React.FC<MadMapperBridgeProps> = ({
  settings,
  oscLogs,
  onUpdateSettings,
  onSendTestOsc,
  onOpenProjectorWindow,
}) => {
  const [hostInput, setHostInput] = useState(settings.host);
  const [portInput, setPortInput] = useState(settings.oscPort.toString());
  const [isSaved, setIsSaved] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customAddress, setCustomAddress] = useState('/surfaces/Wall/color');
  const [customArgs, setCustomArgs] = useState('1.0 0.0 0.0');
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'mcp' | 'osc_tester' | 'logs'>('guide');

  const mcpClaudeConfig = `{
  "mcpServers": {
    "madmapper": {
      "command": "node",
      "args": ["${typeof window !== 'undefined' ? window.location.origin : ''}/madmapper-mcp.js"],
      "env": {
        "MADMAPPER_HOST": "${settings.host}",
        "MADMAPPER_PORT": "${settings.oscPort}"
      }
    }
  }
}`;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      host: hostInput.trim(),
      oscPort: parseInt(portInput, 10) || 8010,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleQuickTest = async (address: string, args: (number | string | boolean)[]) => {
    setIsTesting(true);
    try {
      await onSendTestOsc(address, args);
    } finally {
      setTimeout(() => setIsTesting(false), 400);
    }
  };

  const handleSendCustomOsc = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedArgs: (number | string | boolean)[] = customArgs
      .split(' ')
      .filter((s) => s.length > 0)
      .map((val) => {
        if (!isNaN(Number(val))) return Number(val);
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
        return val;
      });

    await handleQuickTest(customAddress, parsedArgs);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadPresetFile = () => {
    const presetData = {
      name: 'LuminaMap MadMapper Integration',
      targetOscPort: settings.oscPort,
      targetHost: settings.host,
      cues: [
        {
          cueName: 'Doorbell_Person_Red',
          oscTrigger: '/cues/Doorbell_Alert/start',
          colorRgb: [0.937, 0.267, 0.267],
          description: 'Fired when Ring detects person at door',
        },
        {
          cueName: 'Baby_Awake_Gentle',
          oscTrigger: '/cues/Baby_Awake/start',
          colorRgb: [0.753, 0.518, 0.988],
          description: 'Fired when Baby Monitor detects awake',
        },
        {
          cueName: 'Baby_Crying_Alert',
          oscTrigger: '/cues/Baby_Crying/start',
          colorRgb: [0.984, 0.443, 0.522],
          description: 'Fired when Baby Monitor detects sound/crying',
        },
        {
          cueName: 'Window_Breach_Amber',
          oscTrigger: '/cues/Window_Breach/start',
          colorRgb: [0.961, 0.62, 0.043],
          description: 'Fired when Security System window opened',
        },
        {
          cueName: 'Ambient_Art',
          oscTrigger: '/cues/Ambient_Art/start',
          colorRgb: [0.31, 0.27, 0.9],
          description: 'Restores default ambient projection after alert times out',
        },
      ],
    };

    const blob = new Blob([JSON.stringify(presetData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'madmapper_lumina_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                MadMapper Connection & Integration Hub
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your room projector running MadMapper with IoT triggers over OSC (Port 8010) or live video feeds.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            How to Connect
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'mcp'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MadMapper MCP</span>
          </button>
          <button
            onClick={() => setActiveTab('osc_tester')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'osc_tester'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OSC Packet Tester
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Logs ({oscLogs.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Method 1: OSC (The standard MadMapper way) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Method A: OSC Control (Open Sound Control) — Recommended
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Default Port: 8010
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                MadMapper contains a built-in OSC input engine listening on UDP port <strong>8010</strong>.
                When the Ring doorbell or baby monitor fires, our backend sends binary OSC messages
                directly to MadMapper to trigger <strong>Cues</strong>, change <strong>Surface Colors</strong>,
                or switch <strong>Shaders / Medias</strong>!
              </p>

              {/* Step-by-step instructions */}
              <div className="space-y-4 text-xs text-slate-300">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
                      A
                    </span>
                    Step 1: Check MadMapper OSC Input Port
                  </div>
                  <p className="text-slate-400 pl-6">
                    In MadMapper on your computer, open <strong>Preferences &gt; DMX / OSC / MIDI</strong>. Ensure <strong>OSC Input</strong> is enabled and set to port <strong>8010</strong>.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
                      B
                    </span>
                    Step 2: Map Cues in MadMapper
                  </div>
                  <p className="text-slate-400 pl-6">
                    In MadMapper's <strong>Cue List</strong> tab, create scenes for your alerts:
                  </p>
                  <div className="pl-6 space-y-1.5 pt-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-red-400">Doorbell_Person_Red</span>
                      <span className="text-slate-500">Address: /cues/Doorbell_Alert/start</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-purple-400">Baby_Awake_Gentle</span>
                      <span className="text-slate-500">Address: /cues/Baby_Awake/start</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-amber-400">Window_Breach_Amber</span>
                      <span className="text-slate-500">Address: /cues/Window_Breach/start</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
                      C
                    </span>
                    Step 3: Or Use MadMapper "Learn OSC"
                  </div>
                  <p className="text-slate-400 pl-6">
                    In MadMapper, <strong>right-click ANY parameter</strong> (e.g. a surface's color, opacity slider, or media slot) and select <strong>"Learn OSC"</strong>. Then switch to the <em>OSC Packet Tester</em> tab here and click <strong>"Send Test Red Alert"</strong>. MadMapper will instantly auto-bind it!
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={downloadPresetFile}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MadMapper Cue Config (.json)</span>
                </button>

                <button
                  onClick={() => handleQuickTest('/cues/Doorbell_Alert/start', [1.0])}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-md shadow-red-900/20"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Send Test Red Pulse to Port 8010</span>
                </button>
              </div>
            </div>

            {/* Method 2: Video Stream / Syphon / Spout */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Method B: Live Video Feed (Syphon / Spout / Fullscreen Window)
                  </h3>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                If you prefer MadMapper to warp and projection-map the real-time visual artwork generated by LuminaMap:
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <strong>Option 1 (Direct Projector Display):</strong> Open our clean Fullscreen Projector Window on your second display / projector.
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <strong>Option 2 (MadMapper Screen Capture / Syphon):</strong> In MadMapper, go to <strong>Media &gt; + &gt; Desktop/Window Capture</strong> and select the LuminaMap Projector Window. Then map your Quads and Bezier curves in MadMapper as usual!
                </div>
              </div>

              <button
                onClick={onOpenProjectorWindow}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-md"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Open Clean Projector Window</span>
              </button>
            </div>
          </div>

          {/* Right Column: Connection Settings & Quick Cheat Sheet */}
          <div className="space-y-6">
            {/* Host & Port Form */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">MadMapper OSC Target</h3>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Host IP</label>
                  <input
                    type="text"
                    value={hostInput}
                    onChange={(e) => setHostInput(e.target.value)}
                    placeholder="127.0.0.1 or LAN IP"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Use 127.0.0.1 if running on the same machine, or your local LAN IP (e.g. 192.168.1.50).
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MadMapper OSC Input Port</label>
                  <input
                    type="number"
                    value={portInput}
                    onChange={(e) => setPortInput(e.target.value)}
                    placeholder="8010"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    MadMapper standard input is 8010.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    <span>{isSaved ? 'Settings Saved' : 'Update Connection'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* OSC Address Cheat Sheet */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>OSC Address Reference</span>
              </h3>
              <p className="text-xs text-slate-400">
                You can map these addresses to any MadMapper control or surface:
              </p>

              <div className="space-y-2 text-[11px] font-mono">
                {[
                  {
                    name: 'Doorbell Red Alert',
                    addr: '/cues/Doorbell_Alert/start',
                    val: '1.0',
                  },
                  {
                    name: 'Global Alert Color (RGB)',
                    addr: '/madmapper/alert/color',
                    val: 'r g b (floats)',
                  },
                  {
                    name: 'Baby Awake Gentle',
                    addr: '/cues/Baby_Awake/start',
                    val: '1.0',
                  },
                  {
                    name: 'Window Breach Amber',
                    addr: '/cues/Window_Breach/start',
                    val: '1.0',
                  },
                  {
                    name: 'Surface Wall Color',
                    addr: '/surfaces/Wall/color',
                    val: 'r g b',
                  },
                  {
                    name: 'Reset to Ambient Art',
                    addr: '/cues/Ambient_Art/start',
                    val: '1.0',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px]">{item.name}</span>
                      <span className="text-indigo-300">{item.addr}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.addr, idx)}
                      title="Copy Address"
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MadMapper MCP Tab */}
      {activeTab === 'mcp' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 rounded-2xl border border-purple-500/30 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    MadMapper Model Context Protocol (MCP) Server
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    Connect Claude Desktop, Cursor, or external LLMs directly to MadMapper over stdio JSON-RPC.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold">
                Protocol: JSON-RPC 2.0 (stdio)
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Yes!</strong> Because MadMapper does not provide a native MCP out-of-the-box, we built a complete, production-ready <strong>MadMapper MCP Server</strong> (<code>madmapper-mcp.js</code>).
              It translates AI tool calls (like triggering cues, adjusting wall surface colors, or firing IoT alerts) into real UDP OSC packets sent straight to MadMapper on port <strong>8010</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">1. Download MCP Script</span>
                  <a
                    href="/api/mcp/script"
                    download="madmapper-mcp.js"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download madmapper-mcp.js</span>
                  </a>
                </div>
                <p className="text-[11px] text-slate-400">
                  A self-contained Node.js script. Save it anywhere on your machine (e.g. <code>~/madmapper-mcp.js</code>).
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">2. Claude Desktop Config</span>
                  <button
                    onClick={() => copyToClipboard(mcpClaudeConfig, 999)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    {copiedIndex === 999 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy JSON Config</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Add this block into your <code>claude_desktop_config.json</code> under <code>mcpServers</code>.
                </p>
              </div>
            </div>

            {/* Config JSON display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto relative">
              <pre>{mcpClaudeConfig}</pre>
            </div>

            {/* Exposed MCP Tools List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Exposed MCP Tools Available to AI Assistants:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-indigo-300 font-mono font-bold">
                    <span>trigger_madmapper_cue</span>
                    <span className="text-[10px] text-emerald-400">OSC UDP</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Fires named MadMapper Cues: <code>Doorbell_Person_Red</code>, <code>Baby_Awake_Gentle</code>, <code>Ambient_Art</code>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-indigo-300 font-mono font-bold">
                    <span>set_surface_color</span>
                    <span className="text-[10px] text-emerald-400">RGB Floats</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Modifies surface RGB color: <code>/surfaces/Wall/color [r, g, b]</code>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-indigo-300 font-mono font-bold">
                    <span>trigger_iot_alert</span>
                    <span className="text-[10px] text-emerald-400">IoT Simulation</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Simulates Ring Doorbell detection, baby waking, or security breach in one command.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-indigo-300 font-mono font-bold">
                    <span>send_osc_message</span>
                    <span className="text-[10px] text-emerald-400">Generic OSC</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Transmits any custom OSC path and arguments directly to MadMapper port 8010.
                  </p>
                </div>
              </div>
            </div>

            {/* Note on Built-in Lumina AI */}
            <div className="p-4 bg-indigo-950/50 rounded-xl border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between gap-4">
              <div>
                <strong>Want Lumina AI to do this right now?</strong> You don't even have to install an external MCP client.
                Our built-in <em>Lumina AI</em> tab has these exact tools wired directly into the backend!
              </div>
              <button
                onClick={() => onSendTestOsc('/cues/Doorbell_Alert/start', [1.0])}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                Test Tool Trigger Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OSC Packet Tester Tab */}
      {activeTab === 'osc_tester' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Test Cards */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-3">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Doorbell Alert
              </span>
              <h4 className="text-sm font-bold text-white">Trigger Someone at Door (Red)</h4>
              <p className="text-xs text-slate-400">
                Sends cue trigger and sets RGB color to (0.94, 0.27, 0.27).
              </p>
              <button
                onClick={() =>
                  handleQuickTest('/madmapper/alert/color', [0.937, 0.267, 0.267])
                }
                disabled={isTesting}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Send Red Alert OSC</span>
              </button>
            </div>

            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Baby Monitor
              </span>
              <h4 className="text-sm font-bold text-white">Trigger Baby Awake (Lavender)</h4>
              <p className="text-xs text-slate-400">
                Sends cue trigger and sets RGB color to (0.75, 0.52, 0.99).
              </p>
              <button
                onClick={() =>
                  handleQuickTest('/madmapper/alert/color', [0.753, 0.518, 0.988])
                }
                disabled={isTesting}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-2"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Send Lavender Awake OSC</span>
              </button>
            </div>

            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Security Alarm
              </span>
              <h4 className="text-sm font-bold text-white">Trigger Window Open (Amber)</h4>
              <p className="text-xs text-slate-400">
                Sends cue trigger and sets RGB color to (0.96, 0.62, 0.04).
              </p>
              <button
                onClick={() =>
                  handleQuickTest('/madmapper/alert/color', [0.961, 0.62, 0.043])
                }
                disabled={isTesting}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-2"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Send Amber Breach OSC</span>
              </button>
            </div>
          </div>

          {/* Custom Command Sender Form */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Send Custom OSC Packet to MadMapper</span>
            </h3>
            <p className="text-xs text-slate-400">
              Target destination: <strong className="text-slate-200">{settings.host}:{settings.oscPort}</strong>
            </p>

            <form onSubmit={handleSendCustomOsc} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">OSC Address String</label>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="/cues/Doorbell_Alert/start"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Arguments (Space-separated floats, ints, or strings)
                  </label>
                  <input
                    type="text"
                    value={customArgs}
                    onChange={(e) => setCustomArgs(e.target.value)}
                    placeholder="1.0 0.0 0.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit UDP Packet</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-bold text-xs">
                MadMapper OSC Packet Stream (UDP port {settings.oscPort})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {oscLogs.length} Packets Recorded
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80 p-2">
            {oscLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No OSC packets sent yet. Click any IoT trigger or test button above to broadcast!
              </div>
            ) : (
              oscLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 hover:bg-slate-900/50 transition flex flex-wrap items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                    <span className="text-cyan-300 font-bold">{log.address}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="text-slate-500">tags: {log.types}</span>
                    <span className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {JSON.stringify(log.args)}
                    </span>
                    <span className="text-slate-500 text-[10px]">{log.destination}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
