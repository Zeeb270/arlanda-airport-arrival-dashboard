function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 px-6 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">
            Stockholm Arlanda / ESSA
          </p>
          <h1 className="text-2xl font-semibold">
            Arrival Optimization Research Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Prototype interface for arrival trajectory analysis, CDO assessment,
            fuel efficiency, and CO₂ performance.
          </p>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-116px)] grid-cols-12 gap-4 p-4">
        <aside className="col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-lg font-semibold">Flight Selector</h2>
          <div className="space-y-3">
            {["SAS1045", "NAX4546", "APF361"].map((callsign) => (
              <button
                key={callsign}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left hover:border-cyan-400 hover:bg-slate-800/80"
              >
                <p className="font-medium">{callsign}</p>
                <p className="text-xs text-slate-400">Arrival to ESSA</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="col-span-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Flight Map</h2>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              Map placeholder
            </span>
          </div>

          <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-3xl">
                ✈️
              </div>
              <p className="text-lg font-medium">Flight map will appear here</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Next steps will connect this panel to the FastAPI backend and
                render animated aircraft trajectories using Leaflet.
              </p>
            </div>
          </div>
        </section>

        <aside className="col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-lg font-semibold">Metrics</h2>

          <div className="space-y-3">
            <MetricCard label="Flights Loaded" value="10" />
            <MetricCard label="Trajectory Points" value="5,341" />
            <MetricCard label="Runways" value="19L / 19R / 26" />
            <MetricCard label="CO₂ Proxy" value="26,129.5 kg" />
          </div>
        </aside>

        <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-lg font-semibold">Trajectory Analytics</h2>
          <div className="grid grid-cols-3 gap-4">
            <Panel title="Altitude Profile" />
            <Panel title="Speed Profile" />
            <Panel title="Vertical Rate / CDO" />
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-cyan-300">{value}</p>
    </div>
  )
}

function Panel({ title }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950">
      <p className="text-sm text-slate-400">{title} chart placeholder</p>
    </div>
  )
}

export default App