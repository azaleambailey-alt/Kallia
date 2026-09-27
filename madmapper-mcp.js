#!/usr/bin/env node
/**
 * MadMapper Model Context Protocol (MCP) Server
 * 
 * Provides an MCP tool interface over stdio (JSON-RPC) allowing AI assistants
 * (Claude Desktop, Cursor, AI Studio, Windsurf) to directly control MadMapper!
 *
 * Tools provided:
 * - trigger_madmapper_cue(cue_name): Fires a named cue in MadMapper
 * - set_surface_color(surface_name, red, green, blue): Sets surface RGB color
 * - send_osc_message(address, args): Sends arbitrary OSC command to port 8010
 * - trigger_iot_alert(device, alert_type): Triggers preconfigured baby/doorbell/security alert
 * - reset_to_ambient(): Restores tranquil ambient projection mapping
 */

const dgram = require('node:dgram');
const readline = require('node:readline');

const MADMAPPER_HOST = process.env.MADMAPPER_HOST || '127.0.0.1';
const MADMAPPER_PORT = parseInt(process.env.MADMAPPER_PORT || '8010', 10);

const socket = dgram.createSocket('udp4');
socket.on('error', (err) => {
  // Silent or log to stderr (stdout is reserved for MCP JSON-RPC protocol)
  console.error('[MadMapper MCP] UDP Error:', err.message);
});

// Helper: Build standard OSC 1.0 binary packet
function buildOscMessage(address, args = []) {
  const buffers = [];

  // 1. Address String
  buffers.push(encodeOscString(address));

  // 2. Type Tag String
  let typeTag = ',';
  for (const arg of args) {
    if (typeof arg === 'number') {
      typeTag += Number.isInteger(arg) ? 'i' : 'f';
    } else if (typeof arg === 'string') {
      typeTag += 's';
    } else if (typeof arg === 'boolean') {
      typeTag += arg ? 'T' : 'F';
    }
  }
  buffers.push(encodeOscString(typeTag));

  // 3. Arguments
  for (const arg of args) {
    if (typeof arg === 'number') {
      const buf = Buffer.alloc(4);
      if (Number.isInteger(arg)) {
        buf.writeInt32BE(arg, 0);
      } else {
        buf.writeFloatBE(arg, 0);
      }
      buffers.push(buf);
    } else if (typeof arg === 'string') {
      buffers.push(encodeOscString(arg));
    }
  }

  return Buffer.concat(buffers);
}

function encodeOscString(str) {
  const strBuffer = Buffer.from(str, 'ascii');
  const nullCount = 4 - (strBuffer.length % 4);
  const totalLength = strBuffer.length + nullCount;
  const out = Buffer.alloc(totalLength);
  strBuffer.copy(out, 0);
  return out;
}

function sendOsc(address, args = []) {
  return new Promise((resolve, reject) => {
    try {
      const buf = buildOscMessage(address, args);
      socket.send(buf, 0, buf.length, MADMAPPER_PORT, MADMAPPER_HOST, (err) => {
        if (err) reject(err);
        else resolve({ sent: true, address, args, target: `${MADMAPPER_HOST}:${MADMAPPER_PORT}` });
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Tool definitions for MCP
const TOOLS = [
  {
    name: 'trigger_madmapper_cue',
    description: 'Triggers a named Cue in MadMapper (e.g. "Doorbell_Person_Red", "Baby_Awake_Gentle", "Ambient_Art")',
    inputSchema: {
      type: 'object',
      properties: {
        cue_name: {
          type: 'string',
          description: 'The exact name of the Cue in MadMapper Cue List (e.g. Doorbell_Person_Red)',
        },
      },
      required: ['cue_name'],
    },
  },
  {
    name: 'set_surface_color',
    description: 'Sets the RGB color of a MadMapper projection surface (e.g. Wall, Arch, Pillars)',
    inputSchema: {
      type: 'object',
      properties: {
        surface_name: {
          type: 'string',
          description: 'Name of the surface in MadMapper, e.g. "Wall" or "Surface 1"',
        },
        red: { type: 'number', description: 'Float from 0.0 to 1.0' },
        green: { type: 'number', description: 'Float from 0.0 to 1.0' },
        blue: { type: 'number', description: 'Float from 0.0 to 1.0' },
      },
      required: ['surface_name', 'red', 'green', 'blue'],
    },
  },
  {
    name: 'trigger_iot_alert',
    description: 'Triggers a simulated IoT alert (Ring Doorbell, Baby Monitor, or Security Sensor) which shifts projection colors and fires MadMapper OSC cues.',
    inputSchema: {
      type: 'object',
      properties: {
        alert_type: {
          type: 'string',
          enum: [
            'doorbell_someone_at_door',
            'doorbell_chime_ring',
            'baby_awake',
            'baby_crying',
            'window_opened',
            'perimeter_breach',
            'ambient_reset',
          ],
          description: 'The type of event to simulate on the wall projection.',
        },
      },
      required: ['alert_type'],
    },
  },
  {
    name: 'send_osc_message',
    description: 'Sends any arbitrary OSC message over UDP port 8010 to MadMapper.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'OSC address path, e.g. /cues/Doorbell_Alert/start' },
        args: {
          type: 'array',
          items: { type: ['number', 'string', 'boolean'] },
          description: 'Array of arguments to send with the OSC message',
        },
      },
      required: ['address'],
    },
  },
];

// Handle Tool Execution
async function handleToolCall(name, args) {
  switch (name) {
    case 'trigger_madmapper_cue': {
      const cueAddress = `/cues/${args.cue_name}/start`;
      await sendOsc(cueAddress, [1.0]);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully triggered MadMapper Cue "${args.cue_name}" via OSC (${cueAddress} 1.0) on ${MADMAPPER_HOST}:${MADMAPPER_PORT}`,
          },
        ],
      };
    }

    case 'set_surface_color': {
      const addr = `/surfaces/${encodeURIComponent(args.surface_name)}/color`;
      await sendOsc(addr, [args.red, args.green, args.blue]);
      return {
        content: [
          {
            type: 'text',
            text: `Set MadMapper surface "${args.surface_name}" color to RGB(${args.red}, ${args.green}, ${args.blue})`,
          },
        ],
      };
    }

    case 'trigger_iot_alert': {
      let cue = 'Ambient_Art';
      let r = 0.3, g = 0.3, b = 0.9;
      let msg = '';

      if (args.alert_type === 'doorbell_someone_at_door') {
        cue = 'Doorbell_Person_Red';
        r = 0.94; g = 0.27; b = 0.27; // Crimson Red
        msg = 'Ring Doorbell detected someone at door -> Projection shifted to Alert Crimson Red!';
      } else if (args.alert_type === 'doorbell_chime_ring') {
        cue = 'Doorbell_Ring_Chime';
        r = 0.98; g = 0.45; b = 0.09; // Amber Flame
        msg = 'Ring Doorbell chime button pressed -> Projection strobe chime activated!';
      } else if (args.alert_type === 'baby_awake') {
        cue = 'Baby_Awake_Gentle';
        r = 0.75; g = 0.52; b = 0.99; // Soft Lavender
        msg = 'Baby Monitor detected baby awake -> Projection shifted to soothing circadian lavender!';
      } else if (args.alert_type === 'baby_crying') {
        cue = 'Baby_Crying_Alert';
        r = 0.98; g = 0.44; b = 0.52; // Coral Pink
        msg = 'Baby Monitor detected crying sound (>70dB) -> Projection shifted to coral heartbeat pulse!';
      } else if (args.alert_type === 'window_opened') {
        cue = 'Window_Breach_Amber';
        r = 0.96; g = 0.62; b = 0.04; // Amber
        msg = 'Security System window sensor opened -> Projection perimeter boundary scan activated!';
      } else if (args.alert_type === 'perimeter_breach') {
        cue = 'Perimeter_Emergency_Strobe';
        r = 0.86; g = 0.15; b = 0.15; // Emergency Red
        msg = 'Security perimeter barrier tripped -> Emergency strobe alarm activated!';
      } else {
        cue = 'Ambient_Art';
        r = 0.2; g = 0.2; b = 0.6;
        msg = 'Projection restored to ambient ethereal artwork.';
      }

      await sendOsc(`/cues/${cue}/start`, [1.0]);
      await sendOsc('/madmapper/alert/color', [r, g, b]);
      await sendOsc('/surfaces/Wall/color', [r, g, b]);

      return {
        content: [
          {
            type: 'text',
            text: `${msg}\nOSC Sent: /cues/${cue}/start and /madmapper/alert/color [${r}, ${g}, ${b}]`,
          },
        ],
      };
    }

    case 'send_osc_message': {
      await sendOsc(args.address, args.args || [1.0]);
      return {
        content: [
          {
            type: 'text',
            text: `Sent OSC to MadMapper: ${args.address} with arguments ${JSON.stringify(args.args || [1.0])}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Standard MCP Stdio JSON-RPC Loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);

    if (req.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'madmapper-mcp',
            version: '1.0.0',
          },
        },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } else if (req.method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: TOOLS,
        },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } else if (req.method === 'tools/call') {
      const { name, arguments: toolArgs } = req.params;
      try {
        const result = await handleToolCall(name, toolArgs || {});
        const response = {
          jsonrpc: '2.0',
          id: req.id,
          result,
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (err) {
        const response = {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            content: [{ type: 'text', text: 'Error: ' + err.message }],
            isError: true,
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    }
  } catch (err) {
    console.error('[MadMapper MCP] Parse error:', err);
  }
});

console.error(`[MadMapper MCP Server] Ready on stdio -> targeting MadMapper at ${MADMAPPER_HOST}:${MADMAPPER_PORT}`);
