import { useRef } from 'react';
import TopBar from './components/TopBar';
import TrackPanel from './components/TrackPanel';
import SegmentPanel from './components/SegmentPanel';
import ConfigPanel from './components/ConfigPanel';
import GanttChart from './components/GanttChart';

function App() {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar chartRef={chartRef} />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Data Controls */}
        <aside className="w-[40%] min-w-[360px] max-w-[560px] border-r border-border bg-surface flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            <TrackPanel />
            <div className="h-px bg-border" />
            <SegmentPanel />
            <div className="h-px bg-border" />
            <ConfigPanel />
          </div>
        </aside>

        {/* Right Panel - Canvas Preview */}
        <main className="flex-1 bg-slate-100 overflow-auto p-6 flex items-start justify-center">
          <div
            ref={chartRef}
            className="bg-white rounded-lg shadow-sm border border-border overflow-auto"
          >
            <GanttChart />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
