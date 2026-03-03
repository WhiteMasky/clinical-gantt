import { useMemo } from 'react';
import { useStore, diffDays } from '../store';
import type { Track, Segment } from '../types';

const PADDING_LEFT = 120;
const PADDING_RIGHT = 40;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 55;

export default function GanttChart() {
  const tracks = useStore((s) => s.tracks);
  const segments = useStore((s) => s.segments);
  const config = useStore((s) => s.config);

  const { admissionDate, dischargeDate, rowHeight, fontSize, xAxisInterval, canvasWidth, patientName } = config;
  const totalDays = diffDays(admissionDate, dischargeDate);

  const chartWidth = canvasWidth - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = tracks.length * rowHeight;
  const svgWidth = canvasWidth;
  const svgHeight = PADDING_TOP + chartHeight + PADDING_BOTTOM;

  /** Convert a day-number (relative to admission = 0) to an X coordinate. */
  const dayToX = useMemo(
    () => (dayNum: number) => PADDING_LEFT + (dayNum / totalDays) * chartWidth,
    [totalDays, chartWidth],
  );

  /** Convert an ISO date string to a day-number relative to admission. */
  const dateToDayNum = useMemo(
    () => (iso: string) => diffDays(admissionDate, iso),
    [admissionDate],
  );

  const trackY = useMemo(() => {
    const map = new Map<string, number>();
    tracks.forEach((t, i) => map.set(t.id, PADDING_TOP + i * rowHeight + rowHeight / 2));
    return map;
  }, [tracks, rowHeight]);

  // X ticks (in day-numbers)
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let d = 0; d <= totalDays; d += xAxisInterval) ticks.push(d);
    if (ticks[ticks.length - 1] !== totalDays) ticks.push(totalDays);
    return ticks;
  }, [totalDays, xAxisInterval]);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}
    >
      {/* Title */}
      {patientName && (
        <text
          x={svgWidth / 2}
          y={PADDING_TOP - 12}
          textAnchor="middle"
          fontSize={fontSize + 2}
          fill="#1e293b"
          fontWeight={600}
        >
          {patientName}
        </text>
      )}

      {/* Background rows */}
      {tracks.map((_, i) => (
        <rect
          key={`row-${i}`}
          x={PADDING_LEFT}
          y={PADDING_TOP + i * rowHeight}
          width={chartWidth}
          height={rowHeight}
          fill={i % 2 === 0 ? '#f8fafc' : '#ffffff'}
        />
      ))}

      {/* Horizontal row dividers */}
      {tracks.map((_, i) => (
        <line
          key={`hline-${i}`}
          x1={PADDING_LEFT}
          y1={PADDING_TOP + (i + 1) * rowHeight}
          x2={PADDING_LEFT + chartWidth}
          y2={PADDING_TOP + (i + 1) * rowHeight}
          stroke="#f1f5f9"
          strokeWidth={0.5}
        />
      ))}

      {/* Vertical grid */}
      {xTicks.map((d) => (
        <line
          key={`grid-${d}`}
          x1={dayToX(d)}
          y1={PADDING_TOP}
          x2={dayToX(d)}
          y2={PADDING_TOP + chartHeight}
          stroke="#e2e8f0"
          strokeWidth={d === 0 || d === totalDays ? 1.5 : 0.5}
          strokeDasharray={d === 0 || d === totalDays ? undefined : '2,4'}
        />
      ))}

      {/* X-axis line + ticks + labels */}
      <line
        x1={PADDING_LEFT}
        y1={PADDING_TOP + chartHeight}
        x2={PADDING_LEFT + chartWidth}
        y2={PADDING_TOP + chartHeight}
        stroke="#94a3b8"
        strokeWidth={1}
      />
      {xTicks.map((d) => (
        <g key={`xtick-${d}`}>
          <line
            x1={dayToX(d)} y1={PADDING_TOP + chartHeight}
            x2={dayToX(d)} y2={PADDING_TOP + chartHeight + 5}
            stroke="#94a3b8" strokeWidth={1}
          />
          <text
            x={dayToX(d)}
            y={PADDING_TOP + chartHeight + 19}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill="#64748b"
          >
            Day {d}
          </text>
        </g>
      ))}

      {/* Admission / Discharge sub-labels (real dates) */}
      <text
        x={dayToX(0)}
        y={PADDING_TOP + chartHeight + 33}
        textAnchor="middle"
        fontSize={fontSize - 2}
        fill="#94a3b8"
        fontStyle="italic"
      >
        Admission ({admissionDate})
      </text>
      <text
        x={dayToX(totalDays)}
        y={PADDING_TOP + chartHeight + 33}
        textAnchor="middle"
        fontSize={fontSize - 2}
        fill="#94a3b8"
        fontStyle="italic"
      >
        Discharge ({dischargeDate})
      </text>

      {/* Y-axis line */}
      <line
        x1={PADDING_LEFT} y1={PADDING_TOP}
        x2={PADDING_LEFT} y2={PADDING_TOP + chartHeight}
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
              x={PADDING_LEFT - 10}
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
