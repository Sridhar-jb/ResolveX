import { useId } from "react";
import { shortDay } from "../../lib/format";

/* =============================== line chart ===============================
   Multi-series trend with a soft fill under the first series.
   `series` = [{ name, color, values: number[] }]
   ========================================================================== */

export function LineChart({ labels = [], series = [], height = 230 }) {
  const gradientId = useId();
  const width = 760;
  const pad = { top: 18, right: 16, bottom: 30, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allValues = series.flatMap((item) => item.values);
  const max = Math.max(4, ...allValues);
  const steps = 4;

  const x = (index) =>
    pad.left + (labels.length <= 1 ? innerW / 2 : (index / (labels.length - 1)) * innerW);
  const y = (value) => pad.top + innerH - (value / max) * innerH;

  const line = (values) => values.map((value, index) => `${x(index)},${y(value)}`).join(" ");

  const tickEvery = Math.max(1, Math.ceil(labels.length / 6));

  if (!labels.length) {
    return <p className="muted center" style={{ padding: "40px 0" }}>No activity in this period yet.</p>;
  }

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Complaint trend">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={series[0]?.color || "#6366f1"} stopOpacity="0.35" />
          <stop offset="100%" stopColor={series[0]?.color || "#6366f1"} stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="chart__grid">
        {Array.from({ length: steps + 1 }).map((_, index) => {
          const value = (max / steps) * index;
          return (
            <g key={index}>
              <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} />
              <text className="chart__axis" x={pad.left - 8} y={y(value) + 4} textAnchor="end">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
      </g>

      {series[0] ? (
        <polygon
          fill={`url(#${gradientId})`}
          points={`${pad.left},${pad.top + innerH} ${line(series[0].values)} ${
            pad.left + innerW
          },${pad.top + innerH}`}
        />
      ) : null}

      {series.map((item) => (
        <polyline
          key={item.name}
          fill="none"
          stroke={item.color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={line(item.values)}
        />
      ))}

      {series.map((item) =>
        item.values.map((value, index) =>
          index % tickEvery === 0 ? (
            <circle key={`${item.name}-${index}`} cx={x(index)} cy={y(value)} r="3" fill={item.color}>
              <title>{`${item.name} - ${labels[index]}: ${value}`}</title>
            </circle>
          ) : null
        )
      )}

      {labels.map((label, index) =>
        index % tickEvery === 0 ? (
          <text
            key={label}
            className="chart__axis"
            x={x(index)}
            y={height - 8}
            textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
          >
            {shortDay(label)}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* =============================== donut chart ==============================
   `slices` = [{ name, count, color }]
   ========================================================================== */

export function DonutChart({ slices = [], total, caption = "Total", size = 200 }) {
  const sum = total ?? slices.reduce((acc, slice) => acc + slice.count, 0);
  const radius = 62;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!sum) {
    return (
      <p className="muted center" style={{ padding: "30px 0" }}>
        Nothing to break down yet.
      </p>
    );
  }

  return (
    <svg className="chart" viewBox="0 0 170 170" width={size} height={size} role="img" aria-label="Category split">
      <g transform="translate(85 85) rotate(-90)">
        <circle r={radius} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        {slices.map((slice) => {
          const portion = (slice.count / sum) * circumference;
          const dash = `${Math.max(portion - 3, 0)} ${circumference - Math.max(portion - 3, 0)}`;
          const element = (
            <circle
              key={slice.name}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            >
              <title>{`${slice.name}: ${slice.count}`}</title>
            </circle>
          );
          offset += portion;
          return element;
        })}
      </g>
      <text className="donut__center" x="85" y="80">
        <tspan className="value" x="85">
          {sum}
        </tspan>
        <tspan className="label" x="85" dy="20">
          {caption}
        </tspan>
      </text>
    </svg>
  );
}

/* ================================ bar chart ===============================
   `bars` = [{ label, value, color }]
   ========================================================================== */

export function BarChart({ bars = [], height = 210 }) {
  const width = 620;
  const pad = { top: 16, right: 12, bottom: 34, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(4, ...bars.map((bar) => bar.value));
  const slot = innerW / Math.max(bars.length, 1);
  const barWidth = Math.min(54, slot * 0.54);

  if (!bars.length) {
    return <p className="muted center" style={{ padding: "30px 0" }}>Nothing to chart yet.</p>;
  }

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Breakdown">
      <g className="chart__grid">
        {[0, 0.5, 1].map((fraction) => {
          const yPos = pad.top + innerH - fraction * innerH;
          return (
            <g key={fraction}>
              <line x1={pad.left} x2={width - pad.right} y1={yPos} y2={yPos} />
              <text className="chart__axis" x={pad.left - 8} y={yPos + 4} textAnchor="end">
                {Math.round(max * fraction)}
              </text>
            </g>
          );
        })}
      </g>

      {bars.map((bar, index) => {
        const barHeight = Math.max(4, (bar.value / max) * innerH);
        const x = pad.left + slot * index + (slot - barWidth) / 2;
        const y = pad.top + innerH - barHeight;
        return (
          <g key={bar.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="8" fill={bar.color || "var(--indigo)"}>
              <title>{`${bar.label}: ${bar.value}`}</title>
            </rect>
            <text className="chart__axis" x={x + barWidth / 2} y={y - 6} textAnchor="middle">
              {bar.value}
            </text>
            <text className="chart__axis" x={x + barWidth / 2} y={height - 10} textAnchor="middle">
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
