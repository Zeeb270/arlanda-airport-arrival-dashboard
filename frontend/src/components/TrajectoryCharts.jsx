import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function formatTimeLabel(timestamp) {
  if (!timestamp) return ""
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(11, 19)
}

function prepareChartData(trajectory) {
  if (!trajectory || trajectory.length === 0) return []

  return trajectory
    .filter((point) => point.timestamp)
    .map((point, index) => ({
      index,
      time: formatTimeLabel(point.timestamp),
      timestamp: point.timestamp,
      altitude_ft:
        point.altitude_ft !== null && point.altitude_ft !== undefined
          ? Math.round(point.altitude_ft)
          : null,
      groundspeed_kt:
        point.groundspeed_kt !== null && point.groundspeed_kt !== undefined
          ? Math.round(point.groundspeed_kt)
          : null,
      vertical_rate_fpm:
        point.vertical_rate_fpm !== null && point.vertical_rate_fpm !== undefined
          ? Math.round(point.vertical_rate_fpm)
          : null,
    }))
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-xs shadow-xl">
      <p className="mb-2 font-medium text-slate-200">Time: {label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3">
        <h3 className="font-medium text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="h-56">{children}</div>
    </div>
  )
}

function EmptyCharts() {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
      <p className="text-sm text-slate-400">
        Select a flight to display trajectory analytics.
      </p>
    </div>
  )
}

function TrajectoryCharts({ trajectory }) {
  const data = prepareChartData(trajectory)

  if (data.length === 0) {
    return <EmptyCharts />
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCard
        title="Altitude Profile"
        subtitle="Measured flight level converted to feet"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              minTickGap={25}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="altitude_ft"
              name="Altitude ft"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Speed Profile"
        subtitle="Groundspeed derived from radar velocity components"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              minTickGap={25}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="groundspeed_kt"
              name="Groundspeed kt"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Vertical Rate / CDO"
        subtitle="Near-zero vertical rate indicates possible level-off"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              minTickGap={25}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine y={300} stroke="#64748b" strokeDasharray="4 4" />
            <ReferenceLine y={-300} stroke="#64748b" strokeDasharray="4 4" />
            <ReferenceLine y={0} stroke="#475569" />

            <Line
              type="monotone"
              dataKey="vertical_rate_fpm"
              name="Vertical rate fpm"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

export default TrajectoryCharts