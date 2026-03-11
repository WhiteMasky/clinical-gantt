import { useRef, useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import TrackPanel from './components/TrackPanel';
import SegmentPanel from './components/SegmentPanel';
import ConfigPanel from './components/ConfigPanel';
import GanttChart from './components/GanttChart';

function App() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [sidebarWidth]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    setSidebarWidth(Math.max(200, Math.min(720, startW.current + dx)));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar chartRef={chartRef} />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Data Controls */}
        <aside
          className="border-r border-border bg-surface flex flex-col shrink-0"
          style={{ width: sidebarWidth }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            <TrackPanel />
            <div className="h-px bg-border" />
            <SegmentPanel />
            <div className="h-px bg-border" />
            <ConfigPanel />
          </div>
        </aside>

        {/* Resize handle */}
        <div
          className="w-1 hover:w-1.5 bg-transparent hover:bg-blue-400/40 cursor-col-resize shrink-0 transition-colors"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/* Right Panel - Canvas Preview */}
        <main className="flex-1 bg-slate-100 overflow-auto p-6 flex items-start justify-center">
          <div
            ref={chartRef}
            className="bg-white rounded-lg shadow-sm border border-border shrink-0"
          >
            <GanttChart />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
