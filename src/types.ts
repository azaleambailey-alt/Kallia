export type DeviceType = 'baby_monitor' | 'ring_doorbell' | 'security_system';

export type AlertSeverity = 'info' | 'warning' | 'alert' | 'critical';

export type AnimationPattern = 
  | 'wave' 
  | 'pulse' 
  | 'aurora' 
  | 'particles' 
  | 'strobe' 
  | 'flood';

export interface DeviceTrigger {
  key: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  defaultColor: string;
  defaultSecondaryColor: string;
  defaultPattern: AnimationPattern;
  defaultMadMapperCue: string;
  defaultOscAddress: string;
}

export interface IoTDevice {
  id: string;
  type: DeviceType;
  name: string;
  brand: string;
  model: string;
  room: string;
  batteryPercent: number;
  wifiSignalDbm: number;
  isOnline: boolean;
  triggers: DeviceTrigger[];
}

export interface TriggerMappingRule {
  eventKey: string;
  deviceName: string;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  animationPattern: AnimationPattern;
  intensity: number; // 0.1 to 1.0
  speed: number; // 0.2 to 3.0
  timeoutSeconds: number; // How long projection remains triggered
  madMapperCueName: string;
  madMapperOscAddress: string;
  soundEffect: 'gentle_chime' | 'doorbell_ding' | 'alert_beep' | 'none';
  designRationale?: string;
}

export interface ActiveAlert {
  id: string;
  deviceId: string;
  triggerKey: string;
  deviceName: string;
  triggerName: string;
  severity: AlertSeverity;
  timestamp: string;
  expiresAt: number; // epoch ms
  primaryColor: string;
  secondaryColor: string;
  animationPattern: AnimationPattern;
  intensity: number;
  speed: number;
  madMapperCueName: string;
  madMapperOscAddress: string;
}

export interface MappingSurface {
  id: string;
  name: string;
  type: 'arch' | 'mural' | 'pillar_left' | 'pillar_right' | 'window_frame';
  label: string;
  visible: boolean;
  points: { x: number; y: number }[]; // 0 to 1 normalized coordinates
  fillColor?: string;
  brightness: number;
}

export interface MadMapperSettings {
  host: string;
  oscPort: number;
  feedbackPort: number;
  enableOscBroadcast: boolean;
  autoSyncCues: boolean;
  defaultMasterDimmer: number;
}

export interface OscLogEntry {
  id: string;
  timestamp: string;
  address: string;
  types: string;
  args: (string | number | boolean)[];
  destination: string;
  status: 'sent' | 'simulated' | 'error' | 'pending';
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedAction?: {
    actionType: 'apply_mapping';
    eventKey: string;
    primaryColor: string;
    secondaryColor: string;
    animationPattern: AnimationPattern;
    madMapperCueName: string;
    explanation: string;
  };
}

export interface AppStateResponse {
  devices: IoTDevice[];
  mappings: Record<string, TriggerMappingRule>;
  activeAlert: ActiveAlert | null;
  madMapperSettings: MadMapperSettings;
  recentOscLogs: OscLogEntry[];
  recentHistory: {
    id: string;
    triggerKey: string;
    triggerName: string;
    deviceName: string;
    timestamp: string;
  }[];
}
