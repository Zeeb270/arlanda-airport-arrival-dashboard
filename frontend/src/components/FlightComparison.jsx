import { useMemo, useState } from "react"

function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A"
  }

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })
}

function FlightComparison({ flights, selectedFlightId, onSelectFlight }) {
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const sortedFlights = useMemo(() => {
    return [...flights].sort(
      (a, b) => Number(b.final_co2_kg || 0) - Number(a.final_co2_kg || 0)
    )
  }, [flights])

  const totalPages = Math.max(1, Math.ceil(sortedFlights.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const visibleFlights = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage
    return sortedFlights.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedFlights, safeCurrentPage])

  const firstVisible = (safeCurrentPage - 1) * rowsPerPage + 1
  const lastVisible = Math.min(safeCurrentPage * rowsPerPage, sortedFlights.length)

  function goPrevious() {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  function goNext() {
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }

  if (!flights || flights.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
        No flights available for comparison.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            Flight Comparison
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Ranked by estimated CO₂ proxy. Click a row to inspect the flight on the map.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>
            Showing {firstVisible}–{lastVisible} of {sortedFlights.length}
          </span>

          <button
            type="button"
            onClick={goPrevious}
            disabled={safeCurrentPage === 1}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-slate-400">
            Page {safeCurrentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={safeCurrentPage === totalPages}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Callsign</th>
              <th className="px-4 py-3">Aircraft</th>
              <th className="px-4 py-3">Runway</th>
              <th className="px-4 py-3">STAR</th>
              <th className="px-4 py-3">Descent</th>
              <th className="px-4 py-3 text-right">Distance NM</th>
              <th className="px-4 py-3 text-right">Duration Min</th>
              <th className="px-4 py-3 text-right">Level-offs</th>
              <th className="px-4 py-3 text-right">Final Fuel kg</th>
              <th className="px-4 py-3 text-right">Final CO₂ kg</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {visibleFlights.map((flight) => {
              const selected = flight.flight_id === selectedFlightId

              return (
                <tr
                  key={flight.flight_id}
                  onClick={() => onSelectFlight(flight.flight_id)}
                  className={`cursor-pointer transition ${
                    selected
                      ? "bg-cyan-500/10"
                      : "hover:bg-slate-900/80"
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
                        flight.descent_class === "CDO-like"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : flight.descent_class === "Interrupted descent"
                            ? "bg-rose-500/10 text-rose-300"
                            : "bg-amber-500/10 text-amber-300"
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
                    {formatNumber(flight.final_fuel_kg)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-cyan-300">
                    {formatNumber(flight.final_co2_kg)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        flight.environmental_method === "OpenAP"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {flight.environmental_method || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatNumber(flight.efficiency_score)}
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

export default FlightComparison