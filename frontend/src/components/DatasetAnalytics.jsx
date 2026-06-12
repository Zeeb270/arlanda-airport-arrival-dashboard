import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const PIE_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f59e0b",
  "#fb7185",
  "#60a5fa",
  "#f472b6",
  "#bef264",
]

function DatasetAnalytics({ analytics }) {
  if (!analytics) {
    return (
      <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Dataset Analytics Overview</h2>
        <p className="mt-2 text-sm text-slate-400">
          Analytics data is not available yet.
        </p>
      </section>
    )
  }

  const dataset = analytics.dataset || {}

  return (
    <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dataset Analytics Overview</h2>
          <p className="text-sm text-slate-400">
            Aggregated operational, environmental, and weather indicators for the processed flight dataset.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <AnalyticsBadge
            label="Avg efficiency"
            value={formatValue(dataset.average_efficiency_score)}
          />
          <AnalyticsBadge
            label="Avg fuel"
            value={`${formatValue(dataset.average_fuel_kg)} kg`}
          />
          <AnalyticsBadge
            label="Avg CO₂"
            value={`${formatValue(dataset.average_co2_kg)} kg`}
          />
          <AnalyticsBadge
            label="OpenAP coverage"
            value={`${formatValue(dataset.openap_coverage_percent)}%`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Runway Distribution"
          subtitle="Arrival runway usage across the dataset"
        >
          <CategoryBarChart
            data={analytics.runway_distribution}
            xKey="label"
            yKey="count"
          />
        </ChartCard>

        <ChartCard
          title="Descent Classification"
          subtitle="CDO-like, partial CDO, and interrupted descents"
        >
          <SimplePieChart data={analytics.descent_class_distribution} />
        </ChartCard>

        <ChartCard
          title="Environmental Model Coverage"
          subtitle="OpenAP estimates versus fallback proxy"
        >
          <SimplePieChart data={analytics.environmental_method_distribution} />
        </ChartCard>

        <ChartCard
          title="Hourly Traffic Distribution"
          subtitle="Arrival reference time by hour"
          wide
        >
          <HourlyLineChart data={analytics.hourly_traffic_distribution} />
        </ChartCard>

        <ChartCard
          title="Top Aircraft Types"
          subtitle="Most common aircraft types, grouped after top 10"
        >
          <HorizontalBarChart data={analytics.aircraft_type_distribution} />
        </ChartCard>

        <ChartCard
          title="Weather Conditions"
          subtitle="Simplified classes from ESSA surface weather"
        >
          <CategoryBarChart
            data={analytics.weather_condition_distribution}
            xKey="label"
            yKey="count"
          />
        </ChartCard>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <h3 className="text-sm font-medium text-slate-100">Analytics Method Notes</h3>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
          <li>{analytics.notes?.hourly_traffic_time_basis}</li>
          <li>{analytics.notes?.weather_condition_rule}</li>
          <li>{analytics.notes?.environmental_method_rule}</li>
        </ul>
      </div>
    </section>
  )
}

function AnalyticsBadge({ label, value }) {
  return (
    <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">
      <span className="text-slate-500">{label}: </span>
      <span className="text-cyan-300">{value}</span>
    </div>
  )
}

function ChartCard({ title, subtitle, children, wide = false }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950 p-4 ${wide ? "xl:col-span-2" : ""}`}>
      <div className="mb-3">
        <h3 className="font-medium text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="h-64">{children}</div>
    </div>
  )
}

function CategoryBarChart({ data, xKey, yKey }) {
  const safeData = data || []

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={safeData}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          interval={0}
          angle={safeData.length > 4 ? -20 : 0}
          textAnchor={safeData.length > 4 ? "end" : "middle"}
          height={safeData.length > 4 ? 60 : 30}
        />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
          {safeData.map((entry, index) => (
            <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function HorizontalBarChart({ data }) {
  const safeData = data || []

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={safeData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          width={70}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {safeData.map((entry, index) => (
            <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function HourlyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data || []}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          minTickGap={12}
        />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="count"
          name="Flights"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SimplePieChart({ data }) {
  const safeData = data || []

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<ChartTooltip />} />
        <Pie
          data={safeData}
          dataKey="count"
          nameKey="label"
          outerRadius={86}
          innerRadius={42}
          paddingAngle={2}
          label={({ label, count }) => `${label}: ${count}`}
          labelLine={false}
        >
          {safeData.map((entry, index) => (
            <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  const firstPayload = payload[0]
  const name = firstPayload?.payload?.label || label

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-xs shadow-xl">
      <p className="mb-1 font-medium text-slate-200">{name}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name || "Count"}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function formatValue(value) {
  if (value === null || value === undefined) return "N/A"

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })
}

export default DatasetAnalytics