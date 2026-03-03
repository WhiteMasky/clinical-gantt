import { create } from 'zustand';
import type { Track, Segment, ChartConfig, ChartState } from './types';

// Colorblind-friendly palette (Wong 2011)
export const CB_PALETTE = [
  '#0072B2', // blue
  '#E69F00', // orange
  '#009E73', // green
  '#CC79A7', // pink
  '#56B4E9', // sky blue
  '#D55E00', // vermillion
  '#F0E442', // yellow
  '#000000', // black
];

const LOCAL_KEY = 'clinical-gantt-v3';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Helper: add N days to an ISO date string and return new ISO string. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Helper: number of days between two ISO date strings. */
export function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

const defaultConfig: ChartConfig = {
  patientName: 'Patient 1',
  admissionDate: '2025-01-01',
  dischargeDate: '2025-01-31',
  rowHeight: 52,
  fontSize: 12,
  xAxisInterval: 5,
  canvasWidth: 900,
  exportBg: 'white',
};

const defaultTracks: Track[] = [
  { id: 't1', name: 'Hospitalization', type: 'other', color: CB_PALETTE[0], barHeight: 70 },
  { id: 't2', name: 'Meropenem', type: 'medication', color: CB_PALETTE[1], barHeight: 60 },
  { id: 't3', name: 'Vancomycin', type: 'medication', color: CB_PALETTE[3], barHeight: 60 },
  { id: 't4', name: 'Blood Culture', type: 'detection', color: CB_PALETTE[2], barHeight: 50 },
  { id: 't5', name: 'CT Scan', type: 'detection', color: CB_PALETTE[5], barHeight: 50 },
];

const defaultSegments: Segment[] = [
  { id: 's1', trackId: 't1', startDate: '2025-01-01', endDate: '2025-01-31', label: 'ICU' },
  { id: 's2', trackId: 't2', startDate: '2025-01-03', endDate: '2025-01-13' },
  { id: 's3', trackId: 't2', startDate: '2025-01-19', endDate: '2025-01-26' },
  { id: 's4', trackId: 't3', startDate: '2025-01-06', endDate: '2025-01-20' },
  { id: 's5', trackId: 't4', startDate: '2025-01-04', endDate: '2025-01-04', label: '+' },
  { id: 's6', trackId: 't4', startDate: '2025-01-11', endDate: '2025-01-11', label: '-' },
  { id: 's7', trackId: 't4', startDate: '2025-01-21', endDate: '2025-01-21', label: '-' },
  { id: 's8', trackId: 't5', startDate: '2025-01-08', endDate: '2025-01-08' },
  { id: 's9', trackId: 't5', startDate: '2025-01-22', endDate: '2025-01-22' },
];

function loadState(): ChartState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChartState;
      // Validate it's the new v3 shape (date-based)
      if (parsed.tracks && parsed.segments && parsed.config?.admissionDate) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveState(state: ChartState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function getInitialState(): ChartState {
  const saved = loadState();
  if (saved) return saved;
  return {
    tracks: defaultTracks,
    segments: defaultSegments,
    config: defaultConfig,
  };
}

interface StoreActions {
  addTrack: (track: Omit<Track, 'id'>) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  removeTrack: (id: string) => void;
  reorderTrack: (id: string, direction: 'up' | 'down') => void;

  addSegment: (seg: Omit<Segment, 'id'>) => void;
  updateSegment: (id: string, updates: Partial<Segment>) => void;
  removeSegment: (id: string) => void;

  updateConfig: (updates: Partial<ChartConfig>) => void;
  resetToDefault: () => void;
}

type Store = ChartState & StoreActions;

function persist(state: Store): void {
  const { tracks, segments, config } = state;
  saveState({ tracks, segments, config });
}

export const useStore = create<Store>((set) => ({
  ...getInitialState(),

  // ── Tracks ──
  addTrack: (track) => {
    set((s) => {
      const next = { ...s, tracks: [...s.tracks, { ...track, id: uid() }] };
      persist(next);
      return next;
    });
  },
  updateTrack: (id, updates) => {
    set((s) => {
      const next = { ...s, tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)) };
      persist(next);
      return next;
    });
  },
  removeTrack: (id) => {
    set((s) => {
      const next = {
        ...s,
        tracks: s.tracks.filter((t) => t.id !== id),
        segments: s.segments.filter((seg) => seg.trackId !== id),
      };
      persist(next);
      return next;
    });
  },
  reorderTrack: (id, direction) => {
    set((s) => {
      const idx = s.tracks.findIndex((t) => t.id === id);
      if (idx < 0) return s;
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= s.tracks.length) return s;
      const arr = [...s.tracks];
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      const next = { ...s, tracks: arr };
      persist(next);
      return next;
    });
  },

  // ── Segments ──
  addSegment: (seg) => {
    set((s) => {
      const next = { ...s, segments: [...s.segments, { ...seg, id: uid() }] };
      persist(next);
      return next;
    });
  },
  updateSegment: (id, updates) => {
    set((s) => {
      const next = { ...s, segments: s.segments.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg)) };
      persist(next);
      return next;
    });
  },
  removeSegment: (id) => {
    set((s) => {
      const next = { ...s, segments: s.segments.filter((seg) => seg.id !== id) };
      persist(next);
      return next;
    });
  },

  // ── Config ──
  updateConfig: (updates) => {
    set((s) => {
      const next = { ...s, config: { ...s.config, ...updates } };
      persist(next);
      return next;
    });
  },

  resetToDefault: () => {
    const next: ChartState = {
      tracks: defaultTracks,
      segments: defaultSegments,
      config: defaultConfig,
    };
    saveState(next);
    set(next);
  },
}));
