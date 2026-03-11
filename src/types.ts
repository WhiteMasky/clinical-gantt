/** A "track" is one row on the Y-axis (e.g. "Antibiotic A", "Blood Culture"). */
export interface Track {
  id: string;
  name: string;
  type: 'medication' | 'detection' | 'other';
  color: string;
  barHeight: number; // 0-100 %, controls how thick the bars are within the row
}

/** A time segment is one bar on a track row. Uses real dates (YYYY-MM-DD). */
export interface Segment {
  id: string;
  trackId: string;
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"
  label?: string;
  color?: string; // override track color
}

export interface ChartConfig {
  patientName: string;
  admissionDate: string; // ISO date "YYYY-MM-DD"
  dischargeDate: string; // ISO date "YYYY-MM-DD"
  rowHeight: number;
  fontSize: number;
  xAxisInterval: number;
  canvasWidth: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  trackGap: number; // extra vertical gap between tracks (px)
  exportBg: 'transparent' | 'white';
}

export interface ChartState {
  tracks: Track[];
  segments: Segment[];
  config: ChartConfig;
}
