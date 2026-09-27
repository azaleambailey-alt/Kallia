import React, { useState, useEffect } from 'react';
import { IoTDevice, ActiveAlert, TriggerMappingRule } from '../types.ts';
import {
  Baby,
  BellRing,
  ShieldAlert,
  Play,
  Pause,
  Wifi,
  Battery,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Clock,
  Send,
  Zap,
} from 'lucide-react';

interface DeviceTriggerDeckProps {
  devices: IoTDevice[];
  mappings: Record<string, TriggerMappingRule>;
  activeAlert: ActiveAlert | null;
  onTriggerEvent: (deviceId: string, triggerKey: string) => Promise<void>;
  onClearAlert: () => Promise<void>;
}

export const DeviceTriggerDeck: React.FC<DeviceTriggerDeckProps> = ({
  devices,
  mappings,
  activeAlert,
  onTriggerEvent,
  onClearAlert,
}) => {
  const [triggeringKey, setTriggeringKey] = useState<string | null>(null);
  const [isAutoDemoRunning, setIsAutoDemoRunning] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);

  // Demo sequence presets for the auto loop
  const demoSequence = [
    { deviceId: 'ring_doorbell', triggerKey: 'someone_at_door', duration: 10 },
    { deviceId: 'baby_monitor', triggerKey: 'baby_awake', duration: 12 },
    { deviceId: 'security_system', triggerKey: 'window_open', duration: 10 },
    { deviceId: 'ring_doorbell', triggerKey: 'doorbell_ring', duration: 8 },
    { deviceId: 'baby_monitor', triggerKey: 'baby_crying', duration: 12 },
  ];

  // Auto demo loop runner
  useEffect(() => {
    if (!isAutoDemoRunning) return;

    const currentStep = demoSequence[demoStepIndex];
    onTriggerEvent(currentStep.deviceId, currentStep.triggerKey);

    const timer = setTimeout(() => {
      setDemoStepIndex((prev) => (prev + 1) % demoSequence.length);
    }, currentStep.duration * 1000 + 4000); // Trigger duration + pause

    return () => clearTimeout(timer);
  }, [isAutoDemoRunning, demoStepIndex]);

  const handleManualTrigger = async (deviceId: string, triggerKey: string) => {
    setTriggeringKey(triggerKey);
    try {
      await onTriggerEvent(deviceId, triggerKey);
    } finally {
      setTimeout(() => setTriggeringKey(null), 600);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'baby_monitor':
        return <Baby className="w-5 h-5 text-purple-400" />;
      case 'ring_doorbell':
        return <BellRing className="w-5 h-5 text-red-400" />;
      case 'security_system':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      default:
        return <Radio className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Deck Header & Auto-Demo Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              IoT Device Trigger Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              3 Simulated Devices Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Simulate realistic IoT signals from your baby monitor, smart doorbell, or home security sensors.
            Signals are processed on the backend and dispatched instantly to your projection mapping wall & MadMapper.
          </p>
        </div>

        {/* Auto Demo Loop Sequencer Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAutoDemoRunning(!isAutoDemoRunning);
              if (!isAutoDemoRunning) setDemoStepIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg ${
              isAutoDemoRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30 ring-2 ring-rose-400/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
            }`}
          >
            {isAutoDemoRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Stop Auto Demo Loop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Auto Demo Loop (15s Cycles)</span>
              </>
            )}
          </button>

          {activeAlert && (
            <button
              onClick={onClearAlert}
              className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Reset Wall
            </button>
          )}
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((device) => {
          const isBaby = device.type === 'baby_monitor';
          const isDoorbell = device.type === 'ring_doorbell';
          const isSecurity = device.type === 'security_system';

          return (
            <div
              key={device.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                activeAlert?.deviceId === device.id
                  ? 'bg-slate-900/95 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Device Ambient Color Glow in corner */}
              <div
                className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{
                  backgroundColor: isBaby ? '#C084FC' : isDoorbell ? '#EF4444' : '#F59E0B',
                }}
              />

              {/* Device Info Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {device.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{device.room}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>

                {/* Device Telemetry Pills */}
                <div className="grid grid-cols-3 gap-2 py-3 text-[11px] text-slate-400 border-b border-slate-800/60 font-mono">
                  <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded">
                    <Wifi className="w-3 h-3 text-slate-400" />
                    <span>{device.wifiSignalDbm} dBm</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded">
                    <Battery className="w-3 h-3 text-slate-400" />
                    <span>{device.batteryPercent}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded text-right justify-end">
                    <span className="text-slate-300 truncate">{device.brand}</span>
                  </div>
                </div>

                {/* Simulated Device Status Banner */}
                <div className="my-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs">
                  {isBaby && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Crib State:</span>
                        <strong className="text-purple-300 font-mono">
                          {activeAlert?.triggerKey === 'baby_awake' ? 'Motion / Stirring' : 'Asleep'}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Acoustic Monitor:</span>
                        <span className="font-mono">
                          {activeAlert?.triggerKey === 'baby_crying' ? '🚨 74 dB (Crying)' : '38 dB (Quiet)'}
                        </span>
                      </div>
                    </div>
                  )}

                  {isDoorbell && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>3D Radar Zone:</span>
                        <strong className="text-red-300 font-mono">
                          {activeAlert?.deviceId === 'ring_doorbell' ? 'Zone 1 (Porch Tripped)' : 'Clear (No Motion)'}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Chime State:</span>
                        <span className="font-mono">
                          {activeAlert?.triggerKey === 'doorbell_ring' ? '🔔 Button Pressed!' : 'Standby'}
                        </span>
                      </div>
                    </div>
                  )}

                  {isSecurity && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Perimeter Status:</span>
                        <strong className="text-amber-300 font-mono">
                          {activeAlert?.deviceId === 'security_system' ? '⚠️ Contact Tripped' : 'Arm Home (Secure)'}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Monitored Sensors:</span>
                        <span className="font-mono">12 Contact / 4 Motion</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trigger Buttons List */}
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Simulate Backend Triggers:
                  </span>

                  {device.triggers.map((trigger) => {
                    const rule = mappings[trigger.key];
                    const isCurrentlyActive = activeAlert?.triggerKey === trigger.key;
                    const isPending = triggeringKey === trigger.key;
                    const primaryColor = rule?.primaryColor || trigger.defaultColor;

                    return (
                      <button
                        key={trigger.key}
                        onClick={() => handleManualTrigger(device.id, trigger.key)}
                        disabled={isPending}
                        className={`w-full group text-left p-3 rounded-xl border transition-all relative overflow-hidden flex items-center justify-between gap-3 ${
                          isCurrentlyActive
                            ? 'bg-slate-800 border-amber-400/70 shadow-md ring-1 ring-amber-400/40'
                            : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Color indicator pip */}
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110"
                            style={{ backgroundColor: primaryColor }}
                          />

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                {trigger.name}
                              </span>
                              {trigger.severity === 'critical' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 uppercase font-bold">
                                  Critical
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {trigger.description}
                            </p>
                          </div>
                        </div>

                        {/* Trigger button action */}
                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                              isCurrentlyActive
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            {isCurrentlyActive ? 'Firing' : 'Trigger'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer info showing MadMapper Cue mapping */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>OSC Target: MadMapper 8010</span>
                <span className="text-slate-400 truncate">
                  {device.triggers.length} Mapped Cues
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
