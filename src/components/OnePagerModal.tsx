import React, { useState } from 'react';
import { Copy, Check, FileText, Sparkles, X, Tv } from 'lucide-react';

interface OnePagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjector: () => void;
}

export const ONE_PAGER_RAW_TEXT = `# Kallia — Art that Notices
Smart Home Ambient Projection Mapping Hub

## Executive Summary
Kallia transforms domestic walls and ceilings into an organic, liquid kinetic light portal. Instead of jarring notification chimes, blaring alarms, or harsh rectangular screens, Kallia seamlessly integrates domestic smart-home devices (nursery baby monitors, crib sound sensors, video doorbells, perimeter alarms) with living, meditative art.

---

## The Problem
- Notification Fatigue & Sleep Disruption: Blaring smartphone chimes and harsh screen glare at 2:00 AM spike cortisol levels for parents and homeowners.
- Complex AV Overhead: Traditional projection mapping tools (MadMapper, TouchDesigner, QLab) require complex software routing and high technical barrier to entry.
- Sterile Smart Home Displays: Most smart home displays are clutter-heavy dashboards with text, camera feeds, and menus that don't fit into calm, restorative living spaces.

---

## How It Works
1. Smart Home IoT Detection:
   - Nursery Baby Cam / Nanit: Senses when baby stirs or wakes up.
   - Crib Sound Sensor: Senses crying or distress.
   - Front Porch Doorbell: Detects motion or doorbell chime.
   - Security Perimeter: Senses evening garden or patio presence.

2. Organic Projection Engine:
   - Pure pitch-black (#000000) canvas masking: Only the liquid portal illuminates the wall; no rectangular projector borders.
   - Fluid shape morphing: Fluid Amoeba, Pure Circle, Oval Pond, Droplet Tear, and Liquid Blob.
   - Procedural caustics & dynamic water ripples responding to touch or incoming IoT events.

3. Ambient Light Shift (Subtle Glanceability):
   - Resting State: Champagne pearl & warm white gentle kinetic drift.
   - Baby Waking: Organic shift to calming lavender pulse.
   - Baby Crying: Soothing transition to blush peach / rose glow.
   - Doorbell / Visitor: Warm coral shimmer.

4. Pro AV & MadMapper Integration:
   - Transmits real-time Open Sound Control (OSC 1.0) UDP packets to 127.0.0.1:8010.
   - Coordinates architectural DMX lighting, professional stage rigs, and secondary projectors.

---

## Architecture & Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS, Lucide Icons, HTML5 2D Canvas physics.
- Backend: Express on Node 22 (ESM) with instant health probes (/health, /api/health).
- Protocols: REST API, Server-Sent Events, Open Sound Control (OSC 1.0 UDP).
- AI Intelligence: Gemini 2.5 (@google/genai) for dynamic cue generation and mood palettes.
- Deployment: Containerized for Google Cloud Run (listening on 0.0.0.0:PORT).
`;

export const OnePagerModal: React.FC<OnePagerModalProps> = ({
  isOpen,
  onClose,
  onOpenProjector,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ONE_PAGER_RAW_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy for older environments
      const textArea = document.createElement('textarea');
      textArea.value = ONE_PAGER_RAW_TEXT;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-stone-100 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Kallia One-Pager</h2>
              <p className="text-[11px] text-stone-400">Copy-ready product summary & technical specifications</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy One-Pager'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-700 text-xs leading-relaxed selection:bg-stone-200 font-mono">
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 whitespace-pre-wrap font-sans text-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h1 className="text-lg font-bold text-stone-900">Kallia — Art that Notices</h1>
                <p className="text-xs text-stone-500">Smart Home Ambient Projection Mapping Hub</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200/80 font-mono text-stone-700">
                1-PAGE BRIEF
              </span>
            </div>

            <section>
              <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
                Executive Summary
              </h3>
              <p className="text-stone-600 text-xs leading-normal font-sans">
                Kallia transforms domestic walls and ceilings into an organic, liquid kinetic light portal.
                Instead of jarring notification chimes, blaring alarms, or harsh rectangular screens,
                Kallia seamlessly integrates domestic smart-home devices (nursery baby monitors, crib sound sensors, video doorbells, perimeter alarms) with living, meditative art.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
                The Problem
              </h3>
              <ul className="list-disc list-inside space-y-1 text-stone-600 font-sans">
                <li><strong className="text-stone-800">Notification Fatigue & Sleep Disruption:</strong> Blaring chimes and screen glare at 2:00 AM spike cortisol levels for parents.</li>
                <li><strong className="text-stone-800">Complex AV Overhead:</strong> Traditional projection mapping (MadMapper, TouchDesigner) requires high technical barrier.</li>
                <li><strong className="text-stone-800">Sterile Smart Displays:</strong> Most screens are clutter-heavy dashboards with menus that disrupt peaceful living spaces.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
                Key Features & Ambient Triggers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80">
                  <span className="font-semibold block text-stone-900">Baby Monitor / Nanit</span>
                  <span className="text-stone-500">Organic lavender wave when baby stirs or wakes up.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80">
                  <span className="font-semibold block text-stone-900">Crib Sound Sensor</span>
                  <span className="text-stone-500">Gentle blush peach / rose glow for crying or distress.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80">
                  <span className="font-semibold block text-stone-900">Front Doorbell / Ring</span>
                  <span className="text-stone-500">Soft warm coral shimmer upon visitor motion or ring.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80">
                  <span className="font-semibold block text-stone-900">Zero-Border Light Puddle</span>
                  <span className="text-stone-500">True #000000 mask leaves surrounding wall completely dark.</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
                Technical Architecture
              </h3>
              <p className="text-stone-600 text-xs font-sans">
                <strong>Full Stack:</strong> React 19 + HTML5 Canvas water simulation + Express on Node 22 (ESM).<br />
                <strong>Hardware OSC Engine:</strong> Transmits Open Sound Control 1.0 UDP packets to MadMapper / DMX fixtures.<br />
                <strong>Cloud Native:</strong> Instantaneous startup and port binding for Google Cloud Run health checks.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <button
            onClick={onOpenProjector}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            <Tv className="w-3.5 h-3.5 text-stone-500" />
            <span>Launch Wall Projection</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
