// BroadcastChannel sync for multi-tab projector support (Dashboard <-> Projector Tab)
export interface ProjectorSyncState {
  shapeMode: 'pure_circle' | 'fluid_amoeba' | 'oval_pond' | 'droplet_tear' | 'liquid_blob';
  naturalColor: string;
  circleRadiusScale: number;
  waveSpeed: number;
  waveIntensity: number;
  morphIntensity: number;
  enableKineticDrift: number | boolean;
  activeAlert: any | null;
  lastUpdated: number;
}

const STORAGE_KEY = 'kallia_projector_state_v1';
const CHANNEL_NAME = 'kallia_projector_channel';

export const defaultProjectorState: ProjectorSyncState = {
  shapeMode: 'fluid_amoeba',
  naturalColor: '#FFFFFF',
  circleRadiusScale: 0.42,
  waveSpeed: 0.35,
  waveIntensity: 0.75,
  morphIntensity: 0.80,
  enableKineticDrift: true,
  activeAlert: null,
  lastUpdated: Date.now(),
};

export function loadProjectorState(): ProjectorSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultProjectorState, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load projector state', err);
  }
  return defaultProjectorState;
}

export function saveProjectorState(state: Partial<ProjectorSyncState>) {
  try {
    const current = loadProjectorState();
    const updated: ProjectorSyncState = {
      ...current,
      ...state,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'SYNC_STATE', state: updated });
      bc.close();
    }
  } catch (err) {
    console.error('Failed to save projector state', err);
  }
}

export function subscribeProjectorState(callback: (state: ProjectorSyncState) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE' && event.data.state) {
        callback(event.data.state);
      }
    };
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch (err) {
        console.error(err);
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (bc) bc.close();
    window.removeEventListener('storage', handleStorage);
  };
}
