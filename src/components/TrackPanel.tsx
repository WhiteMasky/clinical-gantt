import { useState } from 'react';
import { Plus, Trash2, Layers, ChevronUp, ChevronDown, Palette } from 'lucide-react';
import { useStore, CB_PALETTE } from '../store';
import type { Track } from '../types';

const TYPE_OPTIONS: { value: Track['type']; label: string }[] = [
  { value: 'other', label: 'Other' },
  { value: 'medication', label: 'Medication' },
  { value: 'detection', label: 'Detection' },
];

export default function TrackPanel() {
  const tracks = useStore((s) => s.tracks);
  const addTrack = useStore((s) => s.addTrack);
  const updateTrack = useStore((s) => s.updateTrack);
  const removeTrack = useStore((s) => s.removeTrack);
  const reorderTrack = useStore((s) => s.reorderTrack);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<Track['type']>('other');

  const handleAdd = () => {
    const name = newName.trim() || `Track ${tracks.length + 1}`;
    addTrack({
      name,
      type: newType,
      color: CB_PALETTE[tracks.length % CB_PALETTE.length],
      barHeight: 60,
    });
    setNewName('');
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Layers size={13} />
        Tracks / Rows ({tracks.length})
      </h3>
      <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
        {tracks.map((t, idx) => (
          <div key={t.id} className="bg-white border border-border rounded-md px-2.5 py-2 space-y-1.5 group">
            {/* Row 1: name + type + reorder + delete */}
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={t.color}
                onChange={(e) => updateTrack(t.id, { color: e.target.value })}
                className="w-5 h-5 border-0 p-0 cursor-pointer rounded shrink-0"
                title="Track color"
              />
              <input
                type="text"
                value={t.name}
                onChange={(e) => updateTrack(t.id, { name: e.target.value })}
                className="flex-1 min-w-0 px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-light focus:bg-white"
                title="Click to edit track name"
              />
              <select
                value={t.type}
                onChange={(e) => updateTrack(t.id, { type: e.target.value as Track['type'] })}
                className="text-[11px] bg-transparent border-0 text-text-muted cursor-pointer focus:outline-none"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button onClick={() => reorderTrack(t.id, 'up')} disabled={idx === 0}
                className="p-1 text-slate-400 hover:text-primary hover:bg-blue-50 disabled:opacity-20 cursor-pointer bg-transparent border-0 transition-colors rounded"
                title="Move up">
                <ChevronUp size={16} />
              </button>
              <button onClick={() => reorderTrack(t.id, 'down')} disabled={idx === tracks.length - 1}
                className="p-1 text-slate-400 hover:text-primary hover:bg-blue-50 disabled:opacity-20 cursor-pointer bg-transparent border-0 transition-colors rounded"
                title="Move down">
                <ChevronDown size={16} />
              </button>
              <button onClick={() => removeTrack(t.id)}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer bg-transparent border-0 transition-colors rounded"
                title="Delete track">
                <Trash2 size={14} />
              </button>
            </div>
            {/* Row 2: bar height slider */}
            <div className="flex items-center gap-2 px-0.5">
              <Palette size={10} className="text-slate-300" />
              <span className="text-[10px] text-text-muted w-14 shrink-0">Height {t.barHeight}%</span>
              <input
                type="range"
                min={20}
                max={100}
                value={t.barHeight}
                onChange={(e) => updateTrack(t.id, { barHeight: Number(e.target.value) })}
                className="flex-1 h-1 accent-primary cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
      {/* Add new track */}
      <div className="flex gap-1.5 items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New track name..."
          className="flex-1 min-w-0 px-2 py-1 text-sm bg-slate-50 border border-dashed border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-light"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as Track['type'])}
          className="text-xs bg-slate-50 border border-dashed border-slate-300 rounded py-1 px-1 cursor-pointer focus:outline-none"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer border-0">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
