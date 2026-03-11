import { useMemo, useState, useCallback, useRef } from 'react';
import { useStore, diffDays } from '../store';
import type { Track, Segment } from '../types';

type DragTarget =
  | { kind: 'paddingLeft' }
  | { kind: 'paddingRight' }
  | { kind: 'paddingTop' }
  | { kind: 'paddingBottom' };

export default function GanttChart() {
  const tracks = useStore((s) => s.tracks);
  const segments = useStore((s) => s.segments);
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);

  const {
    admissionDate,
    dischargeDate,
    rowHeight,
    fontSize,
    xAxisInterval,
    canvasWidth,
    patientName,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    trackGap,
  } = config;

  const totalDays = diffDays(admissionDate, dischargeDate);

  const chartWidth = canvasWidth - paddingLeft - paddingRight;
  const chartHeight = tracks.length * rowHeight + Math.max(0, tracks.length - 1) * trackGap;
  const svgWidth = canvasWidth;
  const svgHeight = paddingTop + chartHeight + paddingBottom;

  /** Convert a day-number (relative to admission = 0) to an X coordinate. */
  const dayToX = useMemo(
    () => (dayNum: number) => paddingLeft + (dayNum / totalDays) * chartWidth,
    [totalDays, chartWidth, paddingLeft],
  );

  /** Convert an ISO date string to a day-number relative to admission. */
  const dateToDayNum = useMemo(
    () => (iso: string) => diffDays(admissionDate, iso),
    [admissionDate],
  );

  const trackY = useMemo(() => {
    const map = new Map<string, number>();
    tracks.forEach((t, i) => {
      const y = paddingTop + i * (rowHeight + trackGap) + rowHeight / 2;
      map.set(t.id, y);
    });
    return map;
  }, [tracks, rowHeight, paddingTop, trackGap]);

  // X ticks (in day-numbers)
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let d = 0; d <= totalDays; d += xAxisInterval) ticks.push(d);
    if (ticks[ticks.length - 1] !== totalDays) ticks.push(totalDays);
    return ticks;
  }, [totalDays, xAxisInterval]);

  // ── Drag logic ──
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartVal = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, target: DragTarget) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      if (target.kind === 'paddingLeft') dragStartVal.current = paddingLeft;
      else if (target.kind === 'paddingRight') dragStartVal.current = paddingRight;
      else if (target.kind === 'paddingTop') dragStartVal.current = paddingTop;
      else if (target.kind === 'paddingBottom') dragStartVal.current = paddingBottom;
      setDragTarget(target);
    },
    [paddingLeft, paddingRight, paddingTop, paddingBottom],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragTarget) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      if (dragTarget.kind === 'paddingLeft') {
        updateConfig({ paddingLeft: Math.max(20, Math.round(dragStartVal.current + dx)) });
      } else if (dragTarget.kind === 'paddingRight') {
        updateConfig({ paddingRight: Math.max(20, Math.round(dragStartVal.current - dx)) });
      } else if (dragTarget.kind === 'paddingTop') {
        updateConfig({ paddingTop: Math.max(20, Math.round(dragStartVal.current + dy)) });
      } else if (dragTarget.kind === 'paddingBottom') {
        updateConfig({ paddingBottom: Math.max(20, Math.round(dragStartVal.current - dy)) });
      }
    },
    [dragTarget, updateConfig],
  );

  const handlePointerUp = useCallback(() => {
    setDragTarget(null);
  }, []);

  const dragHandleStyle = 'opacity-0 hover:opacity-100 transition-opacity';

  return (
    <svg
      ref={svgRef}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Title */}
      {patientName && (
        <text
          x={svgWidth / 2}
          y={20}
          textAnchor="middle"
          fontSize={fontSize + 2}
          fill="#1e293b"
          fontWeight={600}
        >
          {patientName}
        </text>
      )}

      {/* Vertical grid */}
      {xTicks.map((d) => (
        <line
          key={`grid-${d}`}
          x1={dayToX(d)}
          y1={paddingTop}
          x2={dayToX(d)}
          y2={paddingTop + chartHeight}
          stroke="#e2e8f0"
          strokeWidth={d === 0 || d === totalDays ? 1.5 : 0.5}
          strokeDasharray={d === 0 || d === totalDays ? undefined : '2,4'}
        />
      ))}

      {/* X-axis line + ticks + labels */}
      <line
        x1={paddingLeft}
        y1={paddingTop + chartHeight}
        x2={paddingLeft + chartWidth}
        y2={paddingTop + chartHeight}
        stroke="#94a3b8"
        strokeWidth={1}
      />
      {xTicks.map((d) => (
        <g key={`xtick-${d}`}>
          <line
            x1={dayToX(d)} y1={paddingTop + chartHeight}
            x2={dayToX(d)} y2={paddingTop + chartHeight + 5}
            stroke="#94a3b8" strokeWidth={1}
          />
          <text
            x={dayToX(d)}
            y={paddingTop + chartHeight + 19}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill="#64748b"
          >
            Day {d}
          </text>
        </g>
      ))}

      {/* Y-axis line */}
      <line
        x1={paddingLeft} y1={paddingTop}
        x2={paddingLeft} y2={paddingTop + chartHeight}
        stroke="#94a3b8" strokeWidth={1}
      />

      {/* Y-axis labels */}
      {tracks.map((t) => {
        const cy = trackY.get(t.id)!;
        return (
          <g key={`ylabel-${t.id}`}>
            <rect
              x={5}
              y={cy - 2}
              width={5}
              height={4}
              rx={1}
              fill={t.color}
              opacity={0.7}
            />
            <text
              x={paddingLeft - 10}
              y={cy}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={fontSize - 0.5}
              fill="#334155"
              fontWeight={500}
            >
              {t.name}
            </text>
          </g>
        );
      })}

      {/* Segments */}
      {segments.map((seg) => {
        const track = tracks.find((t) => t.id === seg.trackId);
        const cy = trackY.get(seg.trackId);
        if (!track || cy === undefined) return null;
        return (
          <SegmentBar
            key={seg.id}
            segment={seg}
            track={track}
            cy={cy}
            dayToX={dayToX}
            dateToDayNum={dateToDayNum}
            rowHeight={rowHeight}
            fontSize={fontSize}
          />
        );
      })}

      {/* ── Drag handles for padding adjustment ── */}
      {/* Left padding handle */}
      <g className={dragHandleStyle}>
        <rect
          x={paddingLeft - 3}
          y={paddingTop}
          width={6}
          height={chartHeight}
          fill="#3b82f6"
          opacity={0.3}
          rx={2}
          style={{ cursor: 'ew-resize' }}
          onPointerDown={(e) => handlePointerDown(e, { kind: 'paddingLeft' })}
        />
        {/* visual indicator dots */}
        <circle cx={paddingLeft} cy={paddingTop + chartHeight / 2 - 8} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft} cy={paddingTop + chartHeight / 2} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft} cy={paddingTop + chartHeight / 2 + 8} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
      </g>

      {/* Right padding handle */}
      <g className={dragHandleStyle}>
        <rect
          x={paddingLeft + chartWidth - 3}
          y={paddingTop}
          width={6}
          height={chartHeight}
          fill="#3b82f6"
          opacity={0.3}
          rx={2}
          style={{ cursor: 'ew-resize' }}
          onPointerDown={(e) => handlePointerDown(e, { kind: 'paddingRight' })}
        />
        <circle cx={paddingLeft + chartWidth} cy={paddingTop + chartHeight / 2 - 8} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft + chartWidth} cy={paddingTop + chartHeight / 2} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft + chartWidth} cy={paddingTop + chartHeight / 2 + 8} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
      </g>

      {/* Top padding handle */}
      <g className={dragHandleStyle}>
        <rect
          x={paddingLeft}
          y={paddingTop - 3}
          width={chartWidth}
          height={6}
          fill="#3b82f6"
          opacity={0.3}
          rx={2}
          style={{ cursor: 'ns-resize' }}
          onPointerDown={(e) => handlePointerDown(e, { kind: 'paddingTop' })}
        />
        <circle cx={paddingLeft + chartWidth / 2 - 8} cy={paddingTop} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft + chartWidth / 2} cy={paddingTop} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft + chartWidth / 2 + 8} cy={paddingTop} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
      </g>

      {/* Bottom padding handle */}
      <g className={dragHandleStyle}>
        <rect
          x={paddingLeft}
          y={paddingTop + chartHeight - 3}
          width={chartWidth}
          height={6}
          fill="#3b82f6"
          opacity={0.3}
          rx={2}
          style={{ cursor: 'ns-resize' }}
          onPointerDown={(e) => handlePointerDown(e, { kind: 'paddingBottom' })}
        />
        <circle cx={paddingLeft + chartWidth / 2 - 8} cy={paddingTop + chartHeight} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft + chartWidth / 2} cy={paddingTop + chartHeight} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
        <circle cx={paddingLeft + chartWidth / 2 + 8} cy={paddingTop + chartHeight} r={1.5} fill="#3b82f6" opacity={0.6} style={{ pointerEvents: 'none' }} />
      </g>
    </svg>
  );
}

/* ── Segment bars ── */
function SegmentBar({
  segment: seg,
  track,
  cy,
  dayToX,
  dateToDayNum,
  rowHeight,
  fontSize,
}: {
  segment: Segment;
  track: Track;
  cy: number;
  dayToX: (d: number) => number;
  dateToDayNum: (iso: string) => number;
  rowHeight: number;
  fontSize: number;
}) {
  const startDayNum = dateToDayNum(seg.startDate);
  const endDayNum = dateToDayNum(seg.endDate);
  const durationDays = endDayNum - startDayNum;
  const x = dayToX(startDayNum);
  const color = seg.color || track.color;
  const barH = rowHeight * (track.barHeight / 100) * 0.7;

  if (track.type === 'detection') {
    // Point marker (diamond) for single-day detection events
    const size = Math.min(barH * 0.45, 8);
    return (
      <g>
        <polygon
          points={`${x},${cy - size} ${x + size},${cy} ${x},${cy + size} ${x - size},${cy}`}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1}
        />
        {seg.label && (
          <text
            x={x + size + 4}
            y={cy + 1}
            dominantBaseline="central"
            fontSize={fontSize - 2}
            fill={color}
            fontWeight={600}
          >
            {seg.label}
          </text>
        )}
      </g>
    );
  }

  // For duration > 0, draw a bar; otherwise draw a thin line for same-day events
  const w = Math.max(dayToX(startDayNum + Math.max(durationDays, 1)) - x, 3);

  if (track.type === 'medication') {
    return (
      <g>
        <rect
          x={x}
          y={cy - barH / 2}
          width={w}
          height={barH}
          rx={barH / 2}
          fill={color}
          opacity={0.9}
        />
        {seg.label && w > 18 && (
          <text
            x={x + w / 2}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.min(fontSize - 2, 10)}
            fill="#ffffff"
            fontWeight={600}
          >
            {seg.label}
          </text>
        )}
      </g>
    );
  }

  // "other" type - standard rectangle
  return (
    <g>
      <rect
        x={x}
        y={cy - barH / 2}
        width={w}
        height={barH}
        rx={3}
        fill={color}
        opacity={0.82}
      />
      {seg.label && w > 25 && (
        <text
          x={x + w / 2}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.min(fontSize - 1, 11)}
          fill="#ffffff"
          fontWeight={600}
        >
          {seg.label}
        </text>
      )}
    </g>
  );
}
