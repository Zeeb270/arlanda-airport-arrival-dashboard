function MethodologyPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <MethodCard
        title="Trajectory data"
        tag="Raw JSON"
        text="Each JSON file represents one arrival flight. The parser extracts aircraft metadata, runway, STAR, timestamped trajectory points, altitude, speed components, and vertical rate."
      />

      <MethodCard
        title="CDO / level-off logic"
        tag="Prototype rule"
        text="A level-off is detected when the aircraft vertical rate stays within ±300 ft/min for at least 30 seconds during the observed trajectory. Flights with fewer level-offs are treated as more CDO-like."
      />

      <MethodCard
        title="Fuel and CO₂"
        tag="Proxy estimate"
        text="Current fuel and CO₂ values are simplified proxy estimates based on track distance and level-off count. They are not measured fuel burn. OpenAP will replace this proxy in the next research version."
      />

      <MethodCard
        title="Arrival efficiency"
        tag="Research metric"
        text="The efficiency score penalizes interrupted descent behavior, long observed paths, and long observed duration. It is designed for comparison inside this prototype, not as a certified operational metric."
      />

      <MethodCard
        title="Time-matching traffic"
        tag="Sequencing context"
        text="The map shows flights whose time ranges overlap with the selected flight, using the selected time window. This avoids combining flights from unrelated dates or traffic situations."
      />

      <MethodCard
        title="Dataset limitation"
        tag="10-flight prototype"
        text="The current dataset is sufficient for dashboard development and exploratory analysis only. It is not large enough for statistical conclusions, machine learning, or operational claims about Arlanda."
      />
    </div>
  )
}

function MethodCard({ title, tag, text }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-slate-100">{title}</h3>
        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          {tag}
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-400">{text}</p>
    </div>
  )
}

export default MethodologyPanel