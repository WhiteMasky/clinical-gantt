import { useState, useMemo } from 'react';
import { Plus, Trash2, Clock, Pencil, Check, X } from 'lucide-react';
import { useStore, diffDays } from '../store';

export default function SegmentPanel() {
  const tracks = useStore((s) => s.tracks);
  const segments = useStore((s) => s.segments);
  const config = useStore((s) => s.config);
  const addSegment = useStore((s) => s.addSegment);
  const updateSegment = useStore((s) => s.updateSegment);
  const removeSegment = useStore((s) => s.removeSegment);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '', label: '' });

  // Group segments by track
  const grouped = useMemo(() => {
    const map = new Map<string, typeof segments>();
    for (const t of tracks) map.set(t.id, []);
    for (const seg of segments) {
      const arr = map.get(seg.trackId);
      if (arr) arr.push(seg);
    }
    return map;
  }, [tracks, segments]);

  const [addTrackId, setAddTrackId] = useState(tracks[0]?.id || '');
  const [addForm, setAddForm] = useState({ startDate: config.admissionDate, endDate: config.admissionDate, label: '' });

  const handleAdd = () => {
    const tid = addTrackId || tracks[0]?.id;
    if (!tid) return;
    addSegment({ trackId: tid, startDate: addForm.startDate, endDate: addForm.endDate, label: addForm.label || undefined });
    setAddForm((f) => ({ ...f, label: '' }));
  };

  const startEdit = (seg: typeof segments[0]) => {
    setEditingId(seg.id);
    setEditForm({ startDate: seg.startDate, endDate: seg.endDate, label: seg.label || '' });
  };

  const saveEdit = (id: string) => {
    updateSegment(id, { startDate: editForm.startDate, endDate: editForm.endDate, label: editForm.label || undefined });
    setEditingId(null);
  };

  /** Format date for display: "01/03" style + computed day number */
  const fmtDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[1]}/${parts[2]}`;
  };
  const dayNum = (d: string) => diffDays(config.admissionDate, d);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Clock size={13} />
        Time Segments ({segments.length})
      </h3>

      <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
        {tracks.map((track) => {
          const segs = grouped.get(track.id) || [];
          return (
            <div key={track.id} className="space-y-0.5">
              <div className="flex items-center gap-1.5 px-1">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: track.color }} />
                <span className="text-[11px] font-semibold text-text-muted">{track.name}</span>
                <span className="text-[10px] text-slate-300">({segs.length})</span>
              </div>
              {segs.length === 0 && (
                <div className="text-[10px] text-slate-300 px-4 py-0.5 italic">No segments</div>
              )}
              {segs.map((seg) => (
                <div key={seg.id} className="flex items-center gap-1 text-xs group bg-white border border-border rounded px-2 py-1 ml-3">
                  {editingId === seg.id ? (
                    <>
                      <input type="date" value={editForm.startDate}
                        onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="bg-blue-50 border border-primary-light rounded text-xs py-0.5 px-1" />
                      <span className="text-text-muted">~</span>
                      <input type="date" value={editForm.endDate}
                        onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                        className="bg-blue-50 border border-primary-light rounded text-xs py-0.5 px-1" />
                      <input type="text" value={editForm.label}
                        onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="label"
                        className="flex-1 min-w-0 bg-blue-50 border border-primary-light rounded text-xs px-1 py-0.5" />
                      <button onClick={() => saveEdit(seg.id)}
                        className="p-0.5 text-green-600 hover:text-green-700 cursor-pointer bg-transparent border-0">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0">
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-text-muted shrink-0">{fmtDate(seg.startDate)}</span>
                      <span className="text-text-muted">~</span>
                      <span className="text-text-muted shrink-0">{fmtDate(seg.endDate)}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">(D{dayNum(seg.startDate)}-D{dayNum(seg.endDate)})</span>
                      <span className="flex-1 min-w-0 truncate text-text font-medium">{seg.label || ''}</span>
                      {seg.color && (
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                      )}
                      <button onClick={() => startEdit(seg)}
                        className="p-0.5 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 cursor-pointer bg-transparent border-0 transition-colors">
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => removeSegment(seg.id)}
                        className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer bg-transparent border-0 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Add segment */}
      <div className="flex items-center gap-1 text-xs bg-slate-50 border border-dashed border-slate-300 rounded px-2 py-1.5 flex-wrap">
        <select
          value={addTrackId || tracks[0]?.id || ''}
          onChange={(e) => setAddTrackId(e.target.value)}
          className="w-24 truncate bg-transparent border-0 text-xs p-0 focus:outline-none cursor-pointer"
        >
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input type="date" value={addForm.startDate}
          onChange={(e) => setAddForm((f) => ({ ...f, startDate: e.target.value }))}
          className="bg-white border border-border rounded text-xs py-0.5 px-1" />
        <span className="text-text-muted">~</span>
        <input type="date" value={addForm.endDate}
          onChange={(e) => setAddForm((f) => ({ ...f, endDate: e.target.value }))}
          className="bg-white border border-border rounded text-xs py-0.5 px-1" />
        <input type="text" value={addForm.label}
          onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="label"
          className="flex-1 min-w-0 bg-transparent border-0 text-xs p-0 focus:outline-none placeholder:text-slate-300" />
        <button onClick={handleAdd}
          className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer border-0">
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}
