import { useRef, useCallback } from 'react';
import { Download, Image, RotateCcw, Save, FolderOpen } from 'lucide-react';
import { useStore } from '../store';
import type { ChartState } from '../types';

/** Minimal runtime check that an imported object looks like a valid ChartState. */
function isValidProject(obj: unknown): obj is ChartState {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o.tracks) &&
    Array.isArray(o.segments) &&
    !!o.config &&
    typeof o.config === 'object' &&
    typeof (o.config as Record<string, unknown>).admissionDate === 'string'
  );
}

export default function TopBar({ chartRef }: { chartRef: React.RefObject<HTMLDivElement | null> }) {
  const resetToDefault = useStore((s) => s.resetToDefault);
  const loadProject = useStore((s) => s.loadProject);
  const tracks = useStore((s) => s.tracks);
  const segments = useStore((s) => s.segments);
  const config = useStore((s) => s.config);
  const downloadLink = useRef<HTMLAnchorElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** Build a clean SVG string from the chart (without drag handles). */
  const buildSvgString = useCallback((): { svgString: string; width: number; height: number } | null => {
    if (!chartRef.current) return null;
    const svgEl = chartRef.current.querySelector('svg');
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;

    // Remove drag-handle groups (they have opacity-0 class for interactive use only)
    clone.querySelectorAll('[style*="cursor"]').forEach((el) => {
      const parent = el.closest('g');
      if (parent && parent.getAttribute('class')?.includes('opacity-0')) {
        parent.remove();
      }
    });

    // Remove pointer events from clone
    clone.removeAttribute('onpointermove');
    clone.removeAttribute('onpointerup');

    // set background
    if (config.exportBg === 'white') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'white');
      clone.insertBefore(rect, clone.firstChild);
    }

    const width = parseFloat(clone.getAttribute('width') || '1000');
    const height = parseFloat(clone.getAttribute('height') || '500');

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    return { svgString, width, height };
  }, [chartRef, config.exportBg]);

  const exportSVG = useCallback(() => {
    const result = buildSvgString();
    if (!result) return;
    const blob = new Blob([result.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    if (downloadLink.current) {
      downloadLink.current.href = url;
      downloadLink.current.download = 'clinical-gantt.svg';
      downloadLink.current.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [buildSvgString]);

  const exportPNG = useCallback(async () => {
    const result = buildSvgString();
    if (!result) return;

    const scale = 4; // 4x for high DPI (~300+ DPI)
    const canvas = document.createElement('canvas');
    canvas.width = result.width * scale;
    canvas.height = result.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    if (config.exportBg === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render SVG to canvas via Image
    const img = new window.Image();
    const svgBlob = new Blob([result.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });

    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob || !downloadLink.current) return;
      const blobUrl = URL.createObjectURL(blob);
      downloadLink.current.href = blobUrl;
      downloadLink.current.download = 'clinical-gantt.png';
      downloadLink.current.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }, 'image/png');
  }, [buildSvgString, config.exportBg]);

  const handleSaveProject = useCallback(() => {
    const project: ChartState = { tracks, segments, config };
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    if (downloadLink.current) {
      downloadLink.current.href = url;
      const safeName = config.patientName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
      downloadLink.current.download = `${safeName}.gantt.json`;
      downloadLink.current.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [tracks, segments, config]);

  const handleImportProject = useCallback(() => {
    fileInput.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (!isValidProject(parsed)) {
            window.alert('Invalid project file. Expected a .gantt.json file exported from this app.');
            return;
          }
          loadProject(parsed);
        } catch {
          window.alert('Failed to parse file. Please select a valid JSON project file.');
        }
      };
      reader.readAsText(file);
      // Reset value so the same file can be imported again
      e.target.value = '';
    },
    [loadProject],
  );

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all data to defaults? This cannot be undone.')) {
      resetToDefault();
    }
  }, [resetToDefault]);

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="10" height="3" rx="1" fill="white" />
            <rect x="4" y="7" width="8" height="3" rx="1" fill="white" opacity="0.8" />
            <rect x="2" y="11" width="12" height="3" rx="1" fill="white" opacity="0.6" />
          </svg>
        </div>
        <h1 className="text-base font-semibold text-text tracking-tight">
          Clinical Gantt Generator
        </h1>
        <span className="text-[11px] text-text-muted bg-slate-100 px-2 py-0.5 rounded-full font-medium">
          Scientific
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={exportSVG}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer border-0"
        >
          <Download size={14} />
          SVG
        </button>
        <button
          onClick={exportPNG}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-blue-800 rounded-md transition-colors cursor-pointer border-0"
        >
          <Image size={14} />
          PNG
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={handleSaveProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer border-0"
        >
          <Save size={14} />
          Save
        </button>
        <button
          onClick={handleImportProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer border-0"
        >
          <FolderOpen size={14} />
          Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.gantt.json"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
      <a ref={downloadLink} className="hidden" />
    </header>
  );
}
