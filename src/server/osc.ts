import dgram from 'node:dgram';
import type { OscLogEntry } from '../types.ts';

/**
 * Builds an OSC 1.0 binary buffer without external heavy dependencies.
 * Follows the Open Sound Control 1.0 Specification:
 * - 4-byte aligned, null-padded strings
 * - Big-endian 32-bit floats and integers
 */
export function buildOscMessage(address: string, args: (number | string | boolean)[] = []): Buffer {
  const buffers: Buffer[] = [];

  // 1. Address String (null-terminated and padded to multiple of 4)
  buffers.push(encodeOscString(address));

  // 2. Type Tag String
  let typeTag = ',';
  for (const arg of args) {
    if (typeof arg === 'number') {
      // If integer
      if (Number.isInteger(arg)) {
        typeTag += 'i';
      } else {
        typeTag += 'f';
      }
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
    // Boolean T/F tags in OSC do not consume payload bytes
  }

  return Buffer.concat(buffers);
}

function encodeOscString(str: string): Buffer {
  const strBuffer = Buffer.from(str, 'ascii');
  // Need at least 1 null byte terminator, then pad to multiple of 4
  const nullCount = 4 - (strBuffer.length % 4);
  const totalLength = strBuffer.length + nullCount;
  const out = Buffer.alloc(totalLength);
  strBuffer.copy(out, 0);
  // Rest is already zeroed by Buffer.alloc
  return out;
}

// Convert Hex Color (#RRGGBB) to 3 normalized float values [0.0 - 1.0] for MadMapper RGB OSC
export function hexToRgbFloats(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return [1.0, 1.0, 1.0];
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [
    Math.round(r * 1000) / 1000,
    Math.round(g * 1000) / 1000,
    Math.round(b * 1000) / 1000,
  ];
}

class OscManager {
  private socket: dgram.Socket | null = null;
  private logs: OscLogEntry[] = [];
  private maxLogs = 50;

  private getSocket(): dgram.Socket | null {
    if (!this.socket) {
      try {
        this.socket = dgram.createSocket('udp4');
        this.socket.on('error', (err) => {
          console.warn('[OSC Socket Warning]:', err.message);
        });
      } catch (err) {
        console.warn('[OSC Socket Init Warning]:', err);
        return null;
      }
    }
    return this.socket;
  }

  public getRecentLogs(): OscLogEntry[] {
    return [...this.logs];
  }

  public async sendOsc(
    host: string,
    port: number,
    address: string,
    args: (number | string | boolean)[] = []
  ): Promise<OscLogEntry> {
    const logId = 'osc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const timestamp = new Date().toISOString();

    let types = ',';
    for (const a of args) {
      if (typeof a === 'number') types += Number.isInteger(a) ? 'i' : 'f';
      else if (typeof a === 'string') types += 's';
      else if (typeof a === 'boolean') types += a ? 'T' : 'F';
    }

    const logEntry: OscLogEntry = {
      id: logId,
      timestamp,
      address,
      types,
      args,
      destination: `${host}:${port}`,
      status: 'pending',
    };

    try {
      const sock = this.getSocket();
      if (!sock) {
        throw new Error('UDP socket not available in environment');
      }
      const buffer = buildOscMessage(address, args);

      await new Promise<void>((resolve, reject) => {
        sock.send(buffer, 0, buffer.length, port, host, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      logEntry.status = 'sent';
    } catch (err: any) {
      // In cloud sandbox or restricted network where UDP port isn't reachable,
      // mark as simulated so user still sees the exact packet payload
      logEntry.status = 'simulated';
      logEntry.errorMessage = err?.message || 'UDP unreachable in sandbox - packet generated';
    }

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return logEntry;
  }
}

export const oscManager = new OscManager();
