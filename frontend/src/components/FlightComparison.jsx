function FlightComparison({ flights, selectedFlightId, onSelectFlight }) {
  const sortedFlights = [...flights].sort((a, b) => {
    return (b.estimated_co2_kg_proxy || 0) - (a.estimated_co2_kg_proxy || 0)
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="font-medium text-slate-100">Flight Comparison</h3>
        <p className="text-xs text-slate-500">
          Ranked by estimated CO₂ proxy. Click a row to inspect the flight on the map.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Callsign</th>
              <th className="px-4 py-3">Aircraft</th>
              <th className="px-4 py-3">Runway</th>
              <th className="px-4 py-3">STAR</th>
              <th className="px-4 py-3">Descent</th>
              <th className="px-4 py-3 text-right">Distance NM</th>
              <th className="px-4 py-3 text-right">Duration min</th>
              <th className="px-4 py-3 text-right">Level-offs</th>
              <th className="px-4 py-3 text-right">Fuel kg</th>
              <th className="px-4 py-3 text-right">CO₂ kg</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>

          <tbody>
            {sortedFlights.map((flight) => {
              const selected = flight.flight_id === selectedFlightId

              return (
                <tr
                  key={flight.flight_id}
                  onClick={() => onSelectFlight(flight.flight_id)}
                  className={`cursor-pointer border-b border-slate-900 transition hover:bg-slate-900 ${
                    selected ? "bg-cyan-500/10" : "bg-slate-950"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-100">
                    {flight.callsign || flight.flight_id}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {flight.aircraft_type || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {flight.arrival_runway || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {flight.star || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        flight.descent_class === "Partial CDO"
                          ? "bg-amber-500/10 text-amber-300"
                          : flight.descent_class === "CDO-like"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {flight.descent_class || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatNumber(flight.track_distance_nm)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatNumber(flight.duration_min)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {flight.level_off_count ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatNumber(flight.estimated_fuel_kg_proxy)}
                  </td>
                  <td className="px-4 py-3 text-right text-cyan-300">
                    {formatNumber(flight.estimated_co2_kg_proxy)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {flight.efficiency_score ?? "N/A"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatNumber(value) {
  if (value === null || value === undefined) return "N/A"
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })
}

export default FlightComparison