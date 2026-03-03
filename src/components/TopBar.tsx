import { useRef, useCallback } from 'react';
import { Download, Image, RotateCcw } from 'lucide-react';
import { useStore } from '../store';
import html2canvas from 'html2canvas';

export default function TopBar({ chartRef }: { chartRef: React.RefObject<HTMLDivElement | null> }) {
  const resetToDefault = useStore((s) => s.resetToDefault);
  const config = useStore((s) => s.config);
  const downloadLink = useRef<HTMLAnchorElement>(null);

  const exportSVG = useCallback(() => {
    if (!chartRef.current) return;
    const svgEl = chartRef.current.querySelector('svg');
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    // set background
    if (config.exportBg === 'white') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'white');
      clone.insertBefore(rect, clone.firstChild);
    }
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    if (downloadLink.current) {
      downloadLink.current.href = url;
      downloadLink.current.download = 'clinical-gantt.svg';
      downloadLink.current.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [chartRef, config.exportBg]);

  const exportPNG = useCallback(async () => {
    if (!chartRef.current) return;
    const svgEl = chartRef.current.querySelector('svg');
    if (!svgEl) return;
    const canvas = await html2canvas(chartRef.current, {
      scale: 4, // 4x for high DPI (~300+ DPI on most displays)
      backgroundColor: config.exportBg === 'white' ? '#ffffff' : null,
      useCORS: true,
    });
    canvas.toBlob((blob) => {
      if (!blob || !downloadLink.current) return;
      const url = URL.createObjectURL(blob);
      downloadLink.current.href = url;
      downloadLink.current.download = 'clinical-gantt.png';
      downloadLink.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }, [chartRef, config.exportBg]);

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
