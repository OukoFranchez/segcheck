"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type Activity = {
  id: number;
  name: string;
  start_date_local: string;
  distance: number;
  total_elevation_gain: number;
  average_heartrate?: number | null;
  suffer_score?: number | null;
  average_watts?: number | null;
};

const LIME = "#c8ff4d";
const CORAL = "#ff6b4a";
const SKY = "#6ec6ff";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const tooltipStyle = {
  background: "#232a2f",
  border: "1px solid #313a40",
  borderRadius: 3,
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
};

function ChartBlock({
  title,
  data,
  dataKey,
  color,
  unit,
  emptyMessage,
}: {
  title: string;
  data: { date: string; value: number | null }[];
  dataKey: string;
  color: string;
  unit: string;
  emptyMessage: string;
}) {
  const hasData = data.some((d) => d.value !== null && d.value !== undefined);
  const values = data
  .map((d) => d.value)
  .filter((v): v is number => v !== null && v !== undefined);
const average = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

// get max/min and a fmt helper
const max = values.length ? Math.max(...values) : null;
const min = values.length ? Math.min(...values) : null;

function fmt(n: number) {
  return `${Math.round(n * 10) / 10}${unit}`;
}

  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: 4 }}>
        {title}
      </p>
      {!hasData ? (
        <div className="empty">{emptyMessage}</div>
      ) : (
        <div style={{ width: "100%", height: 220, position: "relative" }}>
          <div
  style={{
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 2,
    display: "flex",
    gap: 12,
    background: "rgba(28, 34, 38, 0.85)",
    border: "1px solid #313a40",
    borderRadius: 3,
    padding: "6px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
  }}
>
  {max !== null && (
    <span style={{ color: "#8b969c" }}>
      max <span style={{ color: "var(--text)" }}>{fmt(max)}</span>
    </span>
  )}
  {average !== null && (
    <span style={{ color: "#8b969c" }}>
      avg <span style={{ color }}>{fmt(average)}</span>
    </span>
  )}
  {min !== null && (
    <span style={{ color: "#8b969c" }}>
      min <span style={{ color: "var(--text)" }}>{fmt(min)}</span>
    </span>
  )}
</div>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#313a40" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#8b969c"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#313a40" }}
              />
              <YAxis
                stroke="#8b969c"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={44}
                unit={unit}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#8b969c" }}
                itemStyle={{ color }}
                formatter={(value: any) => [`${value}${unit}`, undefined]}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                connectNulls
              />
              {average !== null && (
  <ReferenceLine y={average} stroke="#8b969c" strokeDasharray="4 4" />
)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function StatsCharts({ activities }: { activities: Activity[] }) {
  // Oldest -> newest for left-to-right chart reading.
  const sorted = [...activities].sort(
    (a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime()
  );

  const elevationData = sorted.map((a) => ({
    date: shortDate(a.start_date_local),
    value: Math.round(a.total_elevation_gain),
  }));

  const hrData = sorted.map((a) => ({
    date: shortDate(a.start_date_local),
    value: a.average_heartrate ? Math.round(a.average_heartrate) : null,
  }));

  const effortData = sorted.map((a) => ({
    date: shortDate(a.start_date_local),
    value: a.suffer_score ?? null,
  }));

  return (
    <>
      <p className="section-label">Trends (recent rides)</p>
      <ChartBlock
        title="Elevation gain"
        data={elevationData}
        dataKey="value"
        color={LIME}
        unit=" m"
        emptyMessage="No elevation data on recent rides."
      />
      <ChartBlock
        title="Average heart rate"
        data={hrData}
        dataKey="value"
        color={CORAL}
        unit=" bpm"
        emptyMessage="No heart rate data — connect a HR strap/monitor to see this trend."
      />
      <ChartBlock
        title="Relative effort"
        data={effortData}
        dataKey="value"
        color={SKY}
        unit=""
        emptyMessage="No relative effort score on recent rides (needs heart rate data)."
      />
    </>
  );
}
