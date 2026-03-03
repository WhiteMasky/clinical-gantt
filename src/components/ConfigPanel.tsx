import { Settings2 } from 'lucide-react';
import { useStore, diffDays } from '../store';
import type { ChartConfig } from '../types';

export default function ConfigPanel() {
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);

  const totalDays = diffDays(config.admissionDate, config.dischargeDate);

  const fieldNum = (label: string, key: keyof ChartConfig, opts?: { min?: number; max?: number }) => (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-text-muted whitespace-nowrap">{label}</label>
      <input
        type="number"
        value={config[key] as number}
        min={opts?.min}
        max={opts?.max}
        onChange={(e) => updateConfig({ [key]: Number(e.target.value) })}
        className="w-28 text-right bg-white border border-border rounded text-xs py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-primary-light"
      />
    </div>
  );

  const fieldText = (label: string, key: keyof ChartConfig) => (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-text-muted whitespace-nowrap">{label}</label>
      <input
        type="text"
        value={config[key] as string}
        onChange={(e) => updateConfig({ [key]: e.target.value })}
        className="w-36 text-right bg-white border border-border rounded text-xs py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-primary-light"
      />
    </div>
  );

  const fieldDate = (label: string, key: keyof ChartConfig) => (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-text-muted whitespace-nowrap">{label}</label>
      <input
        type="date"
        value={config[key] as string}
        onChange={(e) => updateConfig({ [key]: e.target.value })}
        className="w-36 text-right bg-white border border-border rounded text-xs py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-primary-light"
      />
    </div>
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Settings2 size={13} />
        Chart Settings
      </h3>
      <div className="space-y-2 bg-white border border-border rounded-md p-3">
        {fieldText('Patient Name', 'patientName')}
        {fieldDate('Admission Date', 'admissionDate')}
        {fieldDate('Discharge Date', 'dischargeDate')}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-text-muted">Total Duration</span>
          <span className="text-xs font-medium text-primary">{totalDays} days</span>
        </div>
        {fieldNum('Row Height (px)', 'rowHeight', { min: 28, max: 100 })}
        {fieldNum('Font Size (px)', 'fontSize', { min: 8, max: 24 })}
        {fieldNum('X-Axis Interval (days)', 'xAxisInterval', { min: 1 })}
        {fieldNum('Canvas Width (px)', 'canvasWidth', { min: 400, max: 2000 })}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-text-muted whitespace-nowrap">Export Background</label>
          <select
            value={config.exportBg}
            onChange={(e) => updateConfig({ exportBg: e.target.value as 'white' | 'transparent' })}
            className="w-36 text-right bg-white border border-border rounded text-xs py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-primary-light cursor-pointer"
          >
            <option value="white">White</option>
            <option value="transparent">Transparent</option>
          </select>
        </div>
      </div>
    </div>
  );
}
