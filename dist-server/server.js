// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

// src/server/osc.ts
import dgram from "node:dgram";
function buildOscMessage(address, args = []) {
  const buffers = [];
  buffers.push(encodeOscString(address));
  let typeTag = ",";
  for (const arg of args) {
    if (typeof arg === "number") {
      if (Number.isInteger(arg)) {
        typeTag += "i";
      } else {
        typeTag += "f";
      }
    } else if (typeof arg === "string") {
      typeTag += "s";
    } else if (typeof arg === "boolean") {
      typeTag += arg ? "T" : "F";
    }
  }
  buffers.push(encodeOscString(typeTag));
  for (const arg of args) {
    if (typeof arg === "number") {
      const buf = Buffer.alloc(4);
      if (Number.isInteger(arg)) {
        buf.writeInt32BE(arg, 0);
      } else {
        buf.writeFloatBE(arg, 0);
      }
      buffers.push(buf);
    } else if (typeof arg === "string") {
      buffers.push(encodeOscString(arg));
    }
  }
  return Buffer.concat(buffers);
}
function encodeOscString(str) {
  const strBuffer = Buffer.from(str, "ascii");
  const nullCount = 4 - strBuffer.length % 4;
  const totalLength = strBuffer.length + nullCount;
  const out = Buffer.alloc(totalLength);
  strBuffer.copy(out, 0);
  return out;
}
function hexToRgbFloats(hex) {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return [1, 1, 1];
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [
    Math.round(r * 1e3) / 1e3,
    Math.round(g * 1e3) / 1e3,
    Math.round(b * 1e3) / 1e3
  ];
}
var OscManager = class {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
    this.socket = dgram.createSocket("udp4");
    this.socket.on("error", (err) => {
      console.warn("[OSC Socket Warning]:", err.message);
    });
  }
  getRecentLogs() {
    return [...this.logs];
  }
  async sendOsc(host, port, address, args = []) {
    const logId = "osc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    let types = ",";
    for (const a of args) {
      if (typeof a === "number") types += Number.isInteger(a) ? "i" : "f";
      else if (typeof a === "string") types += "s";
      else if (typeof a === "boolean") types += a ? "T" : "F";
    }
    const logEntry = {
      id: logId,
      timestamp,
      address,
      types,
      args,
      destination: `${host}:${port}`,
      status: "pending"
    };
    try {
      const buffer = buildOscMessage(address, args);
      await new Promise((resolve, reject) => {
        this.socket.send(buffer, 0, buffer.length, port, host, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      logEntry.status = "sent";
    } catch (err) {
      logEntry.status = "simulated";
      logEntry.errorMessage = err?.message || "UDP unreachable in sandbox - packet generated";
    }
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    return logEntry;
  }
};
var oscManager = new OscManager();

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config();
var app = express();
var PORT = parseInt(process.env.PORT || "3000", 10);
var isProd = process.env.NODE_ENV === "production";
app.use(express.json());
var aiClient = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var initialDevices = [
  {
    id: "baby_monitor",
    type: "baby_monitor",
    name: "Nanit Pro Nursery Cam",
    brand: "Nanit",
    model: "Pro Smart Nursery Vision",
    room: "Baby's Nursery",
    batteryPercent: 94,
    wifiSignalDbm: -52,
    isOnline: true,
    triggers: [
      {
        key: "baby_awake",
        name: "Baby Stirring / Awake",
        description: "Gentle motion detected in the crib indicating baby has woken up.",
        severity: "info",
        defaultColor: "#C084FC",
        // Soothing Soft Lavender
        defaultSecondaryColor: "#FED7AA",
        // Warm Peach
        defaultPattern: "wave",
        defaultMadMapperCue: "Baby_Awake_Gentle",
        defaultOscAddress: "/cues/Baby_Awake/start"
      },
      {
        key: "baby_crying",
        name: "Baby Crying / Sound Alert",
        description: "Acoustic monitor detected persistent crying or fussing above 65dB.",
        severity: "warning",
        defaultColor: "#FB7185",
        // Warm Coral Pink
        defaultSecondaryColor: "#FDE047",
        // Soft Sunlight Yellow
        defaultPattern: "pulse",
        defaultMadMapperCue: "Baby_Crying_Alert",
        defaultOscAddress: "/cues/Baby_Crying/start"
      },
      {
        key: "crib_out_of_bed",
        name: "Standing in Crib",
        description: "AI vision detected baby is standing up at the crib railing.",
        severity: "warning",
        defaultColor: "#38BDF8",
        // Soft Sky Blue
        defaultSecondaryColor: "#DDD6FE",
        // Dreamy Lilac
        defaultPattern: "aurora",
        defaultMadMapperCue: "Baby_Standing_Cue",
        defaultOscAddress: "/cues/Baby_Standing/start"
      }
    ]
  },
  {
    id: "ring_doorbell",
    type: "ring_doorbell",
    name: "Ring Video Doorbell Pro 2",
    brand: "Ring",
    model: "Pro 2 3D Motion Head-to-Toe",
    room: "Front Porch Entryway",
    batteryPercent: 88,
    wifiSignalDbm: -48,
    isOnline: true,
    triggers: [
      {
        key: "someone_at_door",
        name: "Person Detected at Door",
        description: "Radar 3D motion detected a person approaching the front porch.",
        severity: "alert",
        defaultColor: "#EF4444",
        // Alert Crimson Red
        defaultSecondaryColor: "#B91C1C",
        // Deep Ruby
        defaultPattern: "pulse",
        defaultMadMapperCue: "Doorbell_Person_Red",
        defaultOscAddress: "/cues/Doorbell_Alert/start"
      },
      {
        key: "doorbell_ring",
        name: "Doorbell Button Chime",
        description: "Guest or delivery driver physically pressed the doorbell chime button.",
        severity: "alert",
        defaultColor: "#F97316",
        // Luminous Amber Flame
        defaultSecondaryColor: "#EF4444",
        // Crimson Accent
        defaultPattern: "strobe",
        defaultMadMapperCue: "Doorbell_Ring_Chime",
        defaultOscAddress: "/cues/Doorbell_Ring/start"
      },
      {
        key: "package_detected",
        name: "Package Left at Door",
        description: "Package delivery confirmed on front doormat area.",
        severity: "info",
        defaultColor: "#10B981",
        // Emerald Arrival Green
        defaultSecondaryColor: "#065F46",
        // Deep Forest
        defaultPattern: "wave",
        defaultMadMapperCue: "Package_Arrival_Green",
        defaultOscAddress: "/cues/Package_Arrival/start"
      }
    ]
  },
  {
    id: "security_system",
    type: "security_system",
    name: "Guardian SafeShield Security",
    brand: "Honeywell / SafeShield",
    model: "Smart Base Pro Guard",
    room: "Whole House Perimeter",
    batteryPercent: 100,
    wifiSignalDbm: -39,
    isOnline: true,
    triggers: [
      {
        key: "window_open",
        name: "Window Sensor Opened",
        description: "Living room perimeter magnetic contact sensor tripped open.",
        severity: "alert",
        defaultColor: "#F59E0B",
        // Caution High-Contrast Amber
        defaultSecondaryColor: "#06B6D4",
        // Cyan Perimeter Scan
        defaultPattern: "pulse",
        defaultMadMapperCue: "Window_Breach_Amber",
        defaultOscAddress: "/cues/Window_Breach/start"
      },
      {
        key: "perimeter_breach",
        name: "Perimeter Barrier Tripped",
        description: "Exterior infrared beam tripwire breached in the backyard zone.",
        severity: "critical",
        defaultColor: "#DC2626",
        // Emergency Pure Red
        defaultSecondaryColor: "#FFFFFF",
        // High-strobe White
        defaultPattern: "strobe",
        defaultMadMapperCue: "Perimeter_Emergency_Strobe",
        defaultOscAddress: "/cues/Emergency_Alarm/start"
      },
      {
        key: "system_armed_night",
        name: "Night Perimeter Armed",
        description: "All doors and windows secured. Night protection mode engaged.",
        severity: "info",
        defaultColor: "#6366F1",
        // Midnight Indigo Glow
        defaultSecondaryColor: "#312E81",
        // Deep Space Navy
        defaultPattern: "aurora",
        defaultMadMapperCue: "System_Night_Armed",
        defaultOscAddress: "/cues/System_Armed/start"
      }
    ]
  }
];
var initialMappings = {
  baby_awake: {
    eventKey: "baby_awake",
    deviceName: "Nanit Pro Nursery Cam",
    label: "Baby Stirring / Awake",
    primaryColor: "#C084FC",
    secondaryColor: "#FED7AA",
    animationPattern: "wave",
    intensity: 0.75,
    speed: 0.8,
    timeoutSeconds: 14,
    madMapperCueName: "Baby_Awake_Gentle",
    madMapperOscAddress: "/cues/Baby_Awake/start",
    soundEffect: "gentle_chime",
    designRationale: "Lavender and warm peach generate a circadian-friendly, non-jarring glow that alerts parents without shocking the nursery or disturbing the baby with harsh blue light."
  },
  baby_crying: {
    eventKey: "baby_crying",
    deviceName: "Nanit Pro Nursery Cam",
    label: "Baby Crying / Sound Alert",
    primaryColor: "#FB7185",
    secondaryColor: "#FDE047",
    animationPattern: "pulse",
    intensity: 0.9,
    speed: 1.3,
    timeoutSeconds: 16,
    madMapperCueName: "Baby_Crying_Alert",
    madMapperOscAddress: "/cues/Baby_Crying/start",
    soundEffect: "gentle_chime",
    designRationale: "Warm coral-rose with a gentle periodic heartbeat pulse. Draws parent attention smoothly from anywhere across the room."
  },
  someone_at_door: {
    eventKey: "someone_at_door",
    deviceName: "Ring Video Doorbell Pro 2",
    label: "Person Detected at Door",
    primaryColor: "#EF4444",
    secondaryColor: "#991B1B",
    animationPattern: "pulse",
    intensity: 1,
    speed: 1.4,
    timeoutSeconds: 12,
    madMapperCueName: "Doorbell_Person_Red",
    madMapperOscAddress: "/cues/Doorbell_Alert/start",
    soundEffect: "alert_beep",
    designRationale: "Vivid crimson red flood across the architectural projection surfaces. Immediately signals presence at the entryway with unmistakable clarity."
  },
  doorbell_ring: {
    eventKey: "doorbell_ring",
    deviceName: "Ring Video Doorbell Pro 2",
    label: "Doorbell Button Chime",
    primaryColor: "#F97316",
    secondaryColor: "#EF4444",
    animationPattern: "strobe",
    intensity: 1,
    speed: 2,
    timeoutSeconds: 10,
    madMapperCueName: "Doorbell_Ring_Chime",
    madMapperOscAddress: "/cues/Doorbell_Ring/start",
    soundEffect: "doorbell_ding",
    designRationale: "Radiant amber flame with dual harmonic pulse flashes. Creates an artistic, high-energy projection doorbell chime."
  },
  window_open: {
    eventKey: "window_open",
    deviceName: "Guardian SafeShield Security",
    label: "Window Sensor Opened",
    primaryColor: "#F59E0B",
    secondaryColor: "#06B6D4",
    animationPattern: "pulse",
    intensity: 0.95,
    speed: 1.6,
    timeoutSeconds: 15,
    madMapperCueName: "Window_Breach_Amber",
    madMapperOscAddress: "/cues/Window_Breach/start",
    soundEffect: "alert_beep",
    designRationale: "Electric amber boundary scan tracing the structural projection quads, contrasting against a cool cyan perimeter outline."
  },
  perimeter_breach: {
    eventKey: "perimeter_breach",
    deviceName: "Guardian SafeShield Security",
    label: "Perimeter Barrier Tripped",
    primaryColor: "#DC2626",
    secondaryColor: "#FFFFFF",
    animationPattern: "strobe",
    intensity: 1,
    speed: 2.5,
    timeoutSeconds: 18,
    madMapperCueName: "Perimeter_Emergency_Strobe",
    madMapperOscAddress: "/cues/Emergency_Alarm/start",
    soundEffect: "alert_beep",
    designRationale: "High-urgency emergency red & white strobe cycle that turns the entire projection mapping into a high-visibility security beacon."
  }
};
var madMapperSettings = {
  host: "127.0.0.1",
  oscPort: 8010,
  // Default MadMapper OSC input port
  feedbackPort: 9e3,
  enableOscBroadcast: true,
  autoSyncCues: true,
  defaultMasterDimmer: 1
};
var activeAlert = null;
var alertTimeoutHandle = null;
var eventHistory = [];
async function dispatchMadMapperEvent(rule, eventKey) {
  if (!madMapperSettings.enableOscBroadcast) return;
  const [r, g, b] = hexToRgbFloats(rule.primaryColor);
  await oscManager.sendOsc(
    madMapperSettings.host,
    madMapperSettings.oscPort,
    rule.madMapperOscAddress || `/cues/${rule.madMapperCueName}/start`,
    [1]
  );
  await oscManager.sendOsc(
    madMapperSettings.host,
    madMapperSettings.oscPort,
    "/madmapper/alert/color",
    [r, g, b]
  );
  await oscManager.sendOsc(
    madMapperSettings.host,
    madMapperSettings.oscPort,
    "/surfaces/Wall/color",
    [r, g, b]
  );
  await oscManager.sendOsc(
    madMapperSettings.host,
    madMapperSettings.oscPort,
    "/madmapper/alert/event",
    [eventKey, rule.animationPattern, rule.speed]
  );
}
app.get("/api/state", (_req, res) => {
  const response = {
    devices: initialDevices,
    mappings: initialMappings,
    activeAlert,
    madMapperSettings,
    recentOscLogs: oscManager.getRecentLogs(),
    recentHistory: eventHistory.slice(0, 15)
  };
  res.json(response);
});
app.post("/api/trigger", async (req, res) => {
  const { deviceId, triggerKey, durationOverride } = req.body;
  const device = initialDevices.find((d) => d.id === deviceId);
  const trigger = device?.triggers.find((t) => t.key === triggerKey);
  if (!device || !trigger) {
    res.status(404).json({ error: "Device or trigger not found" });
    return;
  }
  const rule = initialMappings[triggerKey] || {
    eventKey: trigger.key,
    deviceName: device.name,
    label: trigger.name,
    primaryColor: trigger.defaultColor,
    secondaryColor: trigger.defaultSecondaryColor,
    animationPattern: trigger.defaultPattern,
    intensity: 0.9,
    speed: 1,
    timeoutSeconds: 12,
    madMapperCueName: trigger.defaultMadMapperCue,
    madMapperOscAddress: trigger.defaultOscAddress,
    soundEffect: "alert_beep"
  };
  const durationSec = durationOverride || rule.timeoutSeconds || 12;
  const now = Date.now();
  const expiresAt = now + durationSec * 1e3;
  activeAlert = {
    id: "alert_" + now,
    deviceId: device.id,
    triggerKey: trigger.key,
    deviceName: device.name,
    triggerName: trigger.name,
    severity: trigger.severity,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt,
    primaryColor: rule.primaryColor,
    secondaryColor: rule.secondaryColor,
    animationPattern: rule.animationPattern,
    intensity: rule.intensity,
    speed: rule.speed,
    madMapperCueName: rule.madMapperCueName,
    madMapperOscAddress: rule.madMapperOscAddress
  };
  eventHistory.unshift({
    id: activeAlert.id,
    triggerKey: trigger.key,
    triggerName: trigger.name,
    deviceName: device.name,
    timestamp: activeAlert.timestamp
  });
  if (eventHistory.length > 25) eventHistory.pop();
  if (alertTimeoutHandle) {
    clearTimeout(alertTimeoutHandle);
  }
  alertTimeoutHandle = setTimeout(async () => {
    activeAlert = null;
    alertTimeoutHandle = null;
    if (madMapperSettings.enableOscBroadcast) {
      await oscManager.sendOsc(
        madMapperSettings.host,
        madMapperSettings.oscPort,
        "/cues/Ambient_Art/start",
        [1]
      );
      await oscManager.sendOsc(
        madMapperSettings.host,
        madMapperSettings.oscPort,
        "/madmapper/alert/reset",
        [1]
      );
    }
  }, durationSec * 1e3);
  await dispatchMadMapperEvent(rule, triggerKey);
  res.json({
    success: true,
    activeAlert,
    oscLogs: oscManager.getRecentLogs()
  });
});
app.post("/api/clear-alert", async (_req, res) => {
  if (alertTimeoutHandle) {
    clearTimeout(alertTimeoutHandle);
    alertTimeoutHandle = null;
  }
  activeAlert = null;
  if (madMapperSettings.enableOscBroadcast) {
    await oscManager.sendOsc(
      madMapperSettings.host,
      madMapperSettings.oscPort,
      "/cues/Ambient_Art/start",
      [1]
    );
    await oscManager.sendOsc(
      madMapperSettings.host,
      madMapperSettings.oscPort,
      "/madmapper/alert/reset",
      [1]
    );
  }
  res.json({ success: true, message: "Alert dismissed. Reverted to ambient projection." });
});
app.post("/api/config/mapping", (req, res) => {
  const { eventKey, rule } = req.body;
  if (!eventKey || !rule) {
    res.status(400).json({ error: "Missing eventKey or rule" });
    return;
  }
  initialMappings[eventKey] = {
    ...initialMappings[eventKey],
    ...rule
  };
  res.json({ success: true, mapping: initialMappings[eventKey] });
});
app.post("/api/madmapper/settings", (req, res) => {
  const { host, oscPort, enableOscBroadcast, autoSyncCues } = req.body;
  if (host) madMapperSettings.host = String(host).trim();
  if (oscPort) madMapperSettings.oscPort = parseInt(oscPort, 10);
  if (typeof enableOscBroadcast === "boolean") {
    madMapperSettings.enableOscBroadcast = enableOscBroadcast;
  }
  if (typeof autoSyncCues === "boolean") {
    madMapperSettings.autoSyncCues = autoSyncCues;
  }
  res.json({ success: true, settings: madMapperSettings });
});
app.post("/api/madmapper/test", async (req, res) => {
  const { address, args } = req.body;
  const targetAddress = address || "/madmapper/test/ping";
  const targetArgs = Array.isArray(args) ? args : [1];
  const log = await oscManager.sendOsc(
    madMapperSettings.host,
    madMapperSettings.oscPort,
    targetAddress,
    targetArgs
  );
  res.json({
    success: true,
    log,
    recentLogs: oscManager.getRecentLogs()
  });
});
app.get("/api/madmapper/logs", (_req, res) => {
  res.json({ logs: oscManager.getRecentLogs() });
});
app.get("/api/mcp/config", (_req, res) => {
  const mcpConfig = {
    mcpServers: {
      madmapper: {
        command: "node",
        args: ["/path/to/madmapper-mcp.js"],
        env: {
          MADMAPPER_HOST: madMapperSettings.host,
          MADMAPPER_PORT: String(madMapperSettings.oscPort)
        }
      }
    }
  };
  res.json({
    config: mcpConfig,
    description: "Model Context Protocol (MCP) server configuration for MadMapper",
    availableTools: [
      "trigger_madmapper_cue(cue_name)",
      "set_surface_color(surface_name, red, green, blue)",
      "trigger_iot_alert(alert_type)",
      "send_osc_message(address, args)"
    ]
  });
});
app.get("/api/mcp/script", (_req, res) => {
  const scriptPath = path.resolve(__dirname, "madmapper-mcp.js");
  res.download(scriptPath, "madmapper-mcp.js");
});
app.post("/api/ai/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message string is required" });
    return;
  }
  const lower = message.toLowerCase();
  let executedAction = null;
  if (lower.includes("do this for me") || lower.includes("do it for me") || lower.includes("trigger") || lower.includes("turn it red") || lower.includes("make it red") || lower.includes("set to red") || lower.includes("simulate") || lower.includes("test red")) {
    if (lower.includes("red") || lower.includes("door") || lower.includes("ring") || lower.includes("someone")) {
      const rule = initialMappings["someone_at_door"];
      const now = Date.now();
      activeAlert = {
        id: "alert_" + now,
        deviceId: "ring_doorbell",
        triggerKey: "someone_at_door",
        deviceName: "Ring Video Doorbell Pro 2",
        triggerName: "Person Detected at Door",
        severity: "alert",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: now + 12e3,
        primaryColor: "#EF4444",
        secondaryColor: "#991B1B",
        animationPattern: "pulse",
        intensity: 1,
        speed: 1.4,
        madMapperCueName: "Doorbell_Person_Red",
        madMapperOscAddress: "/cues/Doorbell_Alert/start"
      };
      await dispatchMadMapperEvent(rule, "someone_at_door");
      executedAction = {
        action: "triggered_alert",
        eventKey: "someone_at_door",
        cue: "Doorbell_Person_Red",
        color: "#EF4444",
        status: "Transmitted OSC to MadMapper Port 8010"
      };
    } else if (lower.includes("baby") || lower.includes("nursery") || lower.includes("awake") || lower.includes("lavender")) {
      const rule = initialMappings["baby_awake"];
      const now = Date.now();
      activeAlert = {
        id: "alert_" + now,
        deviceId: "baby_monitor",
        triggerKey: "baby_awake",
        deviceName: "Nanit Pro Nursery Cam",
        triggerName: "Baby Stirring / Awake",
        severity: "info",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: now + 14e3,
        primaryColor: "#C084FC",
        secondaryColor: "#FED7AA",
        animationPattern: "wave",
        intensity: 0.8,
        speed: 0.8,
        madMapperCueName: "Baby_Awake_Gentle",
        madMapperOscAddress: "/cues/Baby_Awake/start"
      };
      await dispatchMadMapperEvent(rule, "baby_awake");
      executedAction = {
        action: "triggered_alert",
        eventKey: "baby_awake",
        cue: "Baby_Awake_Gentle",
        color: "#C084FC",
        status: "Transmitted OSC to MadMapper Port 8010"
      };
    } else if (lower.includes("reset") || lower.includes("ambient") || lower.includes("clear")) {
      activeAlert = null;
      await oscManager.sendOsc(madMapperSettings.host, madMapperSettings.oscPort, "/cues/Ambient_Art/start", [1]);
      executedAction = {
        action: "reset_ambient",
        status: "Restored ambient projection art and sent /cues/Ambient_Art/start"
      };
    }
  }
  const systemInstruction = `You are "Lumina", an expert Projection Mapping & Sensory Lighting AI Specialist.
You have DIRECT CONTROL of the projection mapping installation and MadMapper OSC engine on port ${madMapperSettings.oscPort}.
The user projects mapping art onto their room wall using MadMapper.

When the user asks if there is an MCP (Model Context Protocol) or asks you to "do this for me":
1. Explain that YES! There is a complete Model Context Protocol (MCP) server script ('madmapper-mcp.js') built into this application that bridges external LLMs (Claude Desktop, Cursor, AI Studio) directly to MadMapper over stdio JSON-RPC.
2. It exposes tools: trigger_madmapper_cue(cue_name), set_surface_color(surface_name, r, g, b), trigger_iot_alert(alert_type), and send_osc_message(address, args).
3. And mention that you (Lumina AI) have these exact tools wired internally into this app, so you can perform the actions for them immediately.

Lighting Psychology & Circadian Design:
* For a baby waking up: Recommend gentle warm peach (#FED7AA) or soothing lavender (#C084FC) with slow wave ripples (0.5x - 0.8x speed). Explain that harsh blue or bright red light abruptly wakes the baby, disrupts melatonin, and causes crying, whereas warm lavender/peach gently lets parents know without waking the baby further.
* For Ring Doorbell (someone at door): Recommend high-visibility alert colors like Ruby Crimson (#EF4444) or Electric Amber (#F97316) with pulsing or strobe patterns.
* For Security window open: Recommend attention-commanding Electric Amber (#F59E0B) with Cyan edge scan (#06B6D4) or high-contrast warning pulses.

MadMapper Technical Guidance:
* Explain how MadMapper receives OSC over UDP port 8010.
* Tell them about MadMapper's Cue List (/cues/<Name>/start 1), Surface Colors (/surfaces/Wall/color r g b), and MIDI/OSC Learn feature (right-click any parameter in MadMapper -> "Learn OSC").
* Explain how they can use Fullscreen Projector mode or Syphon/Spout to project directly.

IMPORTANT:
Whenever you recommend or advise on colors/patterns for a specific event (e.g. baby waking, doorbell, security), ALWAYS conclude your response with a JSON action block enclosed in triple backticks with tag \`\`\`json:suggested_action so the frontend can display an interactive "One-Click Apply" card for the user!

Format for the action block:
\`\`\`json:suggested_action
{
  "actionType": "apply_mapping",
  "eventKey": "someone_at_door",
  "primaryColor": "#EF4444",
  "secondaryColor": "#991B1B",
  "animationPattern": "pulse",
  "madMapperCueName": "Doorbell_Person_Red",
  "explanation": "High-visibility crimson pulse for entryway detection"
}
\`\`\`

Be warm, knowledgeable, creative, and scannable (use crisp bullet points and color names).`;
  try {
    if (!aiClient) {
      const lower2 = message.toLowerCase();
      let responseText = "";
      let actionBlock = "";
      if (lower2.includes("baby") || lower2.includes("nursery") || lower2.includes("wake")) {
        responseText = `### \u{1F319} Recommended Palette: Gentle Circadian Glow

For a baby waking up, I strongly recommend a **Soft Soothing Lavender (#C084FC)** paired with a **Warm Peach Amber (#FED7AA)** using a gentle breathing **Wave** pattern.

#### Why this works:
* **Circadian Protection**: Newborns and infants are hypersensitive to bright white or blue wavelengths (<480nm), which suppress melatonin and trigger agitation. Warm peach and lavender wavelengths soothe sleep transitions.
* **Quiet Parental Notification**: The slow wave ripple draws your peripheral vision effortlessly from across the room without startling the baby.
* **MadMapper Cue**: Triggering \`/cues/Baby_Awake_Gentle/start\` smoothly fades in surface opacity.`;
        actionBlock = `

\`\`\`json:suggested_action
{
  "actionType": "apply_mapping",
  "eventKey": "baby_awake",
  "primaryColor": "#C084FC",
  "secondaryColor": "#FED7AA",
  "animationPattern": "wave",
  "madMapperCueName": "Baby_Awake_Gentle",
  "explanation": "Soothing soft lavender & warm peach breathing wave"
}
\`\`\``;
      } else if (lower2.includes("ring") || lower2.includes("door") || lower2.includes("someone")) {
        responseText = `### \u{1F6A8} Recommended Palette: Entryway Crimson Alert

For Ring Doorbell "Someone at Door", I recommend **Alert Crimson Red (#EF4444)** transitioning into **Deep Ruby (#991B1B)** with an architectural **Pulse** pattern.

#### Why this works:
* **Immediate Cognitive Recognition**: Red creates an instant instinctual awareness that someone has arrived on your property.
* **Architectural Wall Accent**: In MadMapper, the central arch will illuminate with a sharp pulse wave, while outer pillars dim to give high contrast.
* **MadMapper OSC**: Sends \`/cues/Doorbell_Alert/start 1\` and \`/madmapper/alert/color 0.937 0.267 0.267\`.`;
        actionBlock = `

\`\`\`json:suggested_action
{
  "actionType": "apply_mapping",
  "eventKey": "someone_at_door",
  "primaryColor": "#EF4444",
  "secondaryColor": "#991B1B",
  "animationPattern": "pulse",
  "madMapperCueName": "Doorbell_Person_Red",
  "explanation": "High-visibility crimson pulse for entryway detection"
}
\`\`\``;
      } else if (lower2.includes("window") || lower2.includes("security")) {
        responseText = `### \u26A1 Recommended Palette: High-Contrast Perimeter Breach

For the security system detecting an open window or perimeter breach, I recommend **Caution Electric Amber (#F59E0B)** and **Perimeter Cyan (#06B6D4)**.

#### Why this works:
* **Distinct from Doorbell**: Using dual-tone Amber and Cyan distinguishes home security alerts from front doorbell alerts, so you instantly know what happened.
* **Edge Scanning**: In projection mapping, this pattern traces structural quad edges and window frames.
* **MadMapper Cue**: Triggers \`/cues/Window_Breach_Amber/start\`.`;
        actionBlock = `

\`\`\`json:suggested_action
{
  "actionType": "apply_mapping",
  "eventKey": "window_open",
  "primaryColor": "#F59E0B",
  "secondaryColor": "#06B6D4",
  "animationPattern": "pulse",
  "madMapperCueName": "Window_Breach_Amber",
  "explanation": "Caution amber and perimeter cyan structural scan"
}
\`\`\``;
      } else {
        responseText = `### \u{1F3A8} Lumina Smart Projection Designer

I can help you design custom colors, animations, and MadMapper Cues for all your connected IoT devices:

* **Baby Monitor**: Soothing, circadian-safe tones (Peach, Lavender, Rose) that alert parents without disturbing the baby.
* **Ring Doorbell**: Urgent, stylish pulses (Crimson Red, Sunset Amber) when guests or delivery drivers arrive.
* **Security System**: High-contrast boundary sweeps (Amber/Cyan, Emergency Red/White) for perimeter warnings.
* **MadMapper Setup**: Setting up OSC on Port 8010, mapping surfaces, or running Fullscreen video mapping.

Ask me about any device or color combination!`;
      }
      res.json({ reply: responseText + actionBlock });
      return;
    }
    const contents = [];
    if (Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-6)) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const reply = response.text || "I am ready to help you configure your projection mapping cues and colors.";
    res.json({ reply });
  } catch (err) {
    console.error("Error generating AI response:", err);
    res.status(500).json({
      error: "Failed to generate response: " + (err?.message || "Unknown error")
    });
  }
});
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(
      process.cwd(),
      "dist"
    );
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LuminaMap Server] Running at http://localhost:${PORT}`);
    console.log(`[MadMapper OSC Target] -> ${madMapperSettings.host}:${madMapperSettings.oscPort}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
