import { useEffect, useMemo, useState } from "react"
import { getAnalyticsSummary, getFlights, getSummary, getTrajectory } from "./services/api"
import FlightMap from "./components/FlightMap"
import TrajectoryCharts from "./components/TrajectoryCharts"
import FlightComparison from "./components/FlightComparison"
import MethodologyPanel from "./components/MethodologyPanel"
import WeatherPanel from "./components/WeatherPanel"
import DatasetAnalytics from "./components/DatasetAnalytics"

function toMs(timestamp) {
  if (!timestamp) return null
  const value = new Date(timestamp).getTime()
  return Number.isNaN(value) ? null : value
}

function getArrivalTimestamp(flight) {
  return (
    flight?.approach_clearance_time ||
    flight?.last_timestamp ||
    flight?.first_timestamp ||
    null
  )
}

function getFlightDate(flight) {
  const timestamp = getArrivalTimestamp(flight)
  return timestamp ? timestamp.slice(0, 10) : null
}

function getFlightHourLabel(flight) {
  const timestamp = getArrivalTimestamp(flight)

  if (!timestamp) return null

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) return null

  return `${String(date.getHours()).padStart(2, "0")}:00`
}

function sumFlightField(flights, field) {
  return flights.reduce((total, flight) => {
    const value = Number(flight[field] || 0)
    return total + value
  }, 0)
}

function averageFlightField(flights, field) {
  if (!flights || flights.length === 0) return null

  const values = flights
    .map((flight) => Number(flight[field]))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) return null

  return values.reduce((total, value) => total + value, 0) / values.length
}

function flightOverlapsSelected(candidateFlight, selectedFlight, windowMinutes) {
  if (!candidateFlight || !selectedFlight) return false

  const candidateStart = toMs(candidateFlight.first_timestamp)
  const candidateEnd = toMs(candidateFlight.last_timestamp)
  const selectedStart = toMs(selectedFlight.first_timestamp)
  const selectedEnd = toMs(selectedFlight.last_timestamp)

  if (
    candidateStart === null ||
    candidateEnd === null ||
    selectedStart === null ||
    selectedEnd === null
  ) {
    return false
  }

  const bufferMs = windowMinutes * 60 * 1000

  return (
    candidateStart <= selectedEnd + bufferMs &&
    candidateEnd >= selectedStart - bufferMs
  )
}

function App() {
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [flights, setFlights] = useState([])
  const [selectedFlightId, setSelectedFlightId] = useState(null)
  const [selectedTrajectory, setSelectedTrajectory] = useState([])
  const [trajectoryLoading, setTrajectoryLoading] = useState(false)
  const [visibleTrajectories, setVisibleTrajectories] = useState({})
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(20)
  const [runwayFilter, setRunwayFilter] = useState("ALL")
  const [aircraftFilter, setAircraftFilter] = useState("ALL")
  const [descentFilter, setDescentFilter] = useState("ALL")
  const [environmentalMethodFilter, setEnvironmentalMethodFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("ALL")
  const [hourFilter, setHourFilter] = useState("ALL")
  const [flightSearch, setFlightSearch] = useState("")
  const [minEfficiency, setMinEfficiency] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError("")

        const [summaryData, analyticsData, flightsData] = await Promise.all([
          getSummary(),
          getAnalyticsSummary(),
          getFlights(),
        ])

        setSummary(summaryData)
        setAnalytics(analyticsData)
        setFlights(flightsData)

        if (flightsData.length > 0) {
          setSelectedFlightId(flightsData[0].flight_id)
        }
      } catch (err) {
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    async function loadVisibleTrajectories() {
      if (!selectedFlightId || flights.length === 0) {
        setSelectedTrajectory([])
        setVisibleTrajectories({})
        return
      }

      const selected = flights.find((flight) => flight.flight_id === selectedFlightId)

      if (!selected) {
        setSelectedTrajectory([])
        setVisibleTrajectories({})
        return
      }

      try {
        setTrajectoryLoading(true)

        const visibleFlights = flights.filter((flight) =>
          flightOverlapsSelected(flight, selected, timeWindowMinutes)
        )

        const trajectoryPairs = await Promise.all(
          visibleFlights.map(async (flight) => {
            const trajectory = await getTrajectory(flight.flight_id)
            return [flight.flight_id, trajectory]
          })
        )

        const trajectoryMap = Object.fromEntries(trajectoryPairs)

        setVisibleTrajectories(trajectoryMap)
        setSelectedTrajectory(trajectoryMap[selectedFlightId] || [])
      } catch (err) {
        console.error("Failed to load visible trajectories", err)
        setSelectedTrajectory([])
        setVisibleTrajectories({})
      } finally {
        setTrajectoryLoading(false)
      }
    }

    loadVisibleTrajectories()
  }, [selectedFlightId, flights, timeWindowMinutes])
  
  const runwayOptions = useMemo(() => {
    return Array.from(
      new Set(flights.map((flight) => flight.arrival_runway).filter(Boolean))
    ).sort()
  }, [flights])

  const aircraftOptions = useMemo(() => {
    return Array.from(
      new Set(flights.map((flight) => flight.aircraft_type).filter(Boolean))
    ).sort()
  }, [flights])

  const descentOptions = useMemo(() => {
    return Array.from(
      new Set(flights.map((flight) => flight.descent_class).filter(Boolean))
    ).sort()
  }, [flights])

  const environmentalMethodOptions = useMemo(() => {
    return Array.from(
      new Set(flights.map((flight) => flight.environmental_method).filter(Boolean))
    ).sort()
  }, [flights])

  const dateOptions = useMemo(() => {
    return Array.from(
      new Set(flights.map((flight) => getFlightDate(flight)).filter(Boolean))
    ).sort()
  }, [flights])

  const hourOptions = useMemo(() => {
    const relevantFlights =
      dateFilter === "ALL"
        ? flights
        : flights.filter((flight) => getFlightDate(flight) === dateFilter)

    return Array.from(
      new Set(relevantFlights.map((flight) => getFlightHourLabel(flight)).filter(Boolean))
    ).sort()
  }, [flights, dateFilter])

  const filteredFlights = useMemo(() => {
    const normalizedSearch = flightSearch.trim().toLowerCase()

    return flights.filter((flight) => {
      const matchesRunway =
        runwayFilter === "ALL" || flight.arrival_runway === runwayFilter

      const matchesAircraft =
        aircraftFilter === "ALL" || flight.aircraft_type === aircraftFilter

      const matchesDescent =
        descentFilter === "ALL" || flight.descent_class === descentFilter

      const matchesEnvironmentalMethod =
        environmentalMethodFilter === "ALL" ||
        flight.environmental_method === environmentalMethodFilter

      const flightDate = getFlightDate(flight)
      const flightHour = getFlightHourLabel(flight)

      const matchesDate =
        dateFilter === "ALL" || flightDate === dateFilter

      const matchesHour =
        hourFilter === "ALL" || flightHour === hourFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        String(flight.callsign || "").toLowerCase().includes(normalizedSearch) ||
        String(flight.flight_id || "").toLowerCase().includes(normalizedSearch) ||
        String(flight.aircraft_type || "").toLowerCase().includes(normalizedSearch)

      const matchesEfficiency =
        Number(flight.efficiency_score || 0) >= Number(minEfficiency)

      return (
        matchesRunway &&
        matchesAircraft &&
        matchesDescent &&
        matchesEnvironmentalMethod &&
        matchesDate &&
        matchesHour &&
        matchesSearch &&
        matchesEfficiency
      )
    })
  }, [
    flights,
    runwayFilter,
    aircraftFilter,
    descentFilter,
    environmentalMethodFilter,
    dateFilter,
    hourFilter,
    flightSearch,
    minEfficiency,
  ])

  const scenarioFlights = useMemo(() => {
    return flights.filter((flight) => {
      const flightDate = getFlightDate(flight)
      const flightHour = getFlightHourLabel(flight)

      const matchesDate =
        dateFilter === "ALL" || flightDate === dateFilter

      const matchesHour =
        hourFilter === "ALL" || flightHour === hourFilter

      const matchesRunway =
        runwayFilter === "ALL" || flight.arrival_runway === runwayFilter

      return matchesDate && matchesHour && matchesRunway
    })
  }, [flights, dateFilter, hourFilter, runwayFilter])

  const scenarioSummary = useMemo(() => {
    const totalFuel = sumFlightField(scenarioFlights, "final_fuel_kg")
    const totalCo2 = sumFlightField(scenarioFlights, "final_co2_kg")
    const averageEfficiency = averageFlightField(scenarioFlights, "efficiency_score")

    const interruptedDescents = scenarioFlights.filter(
      (flight) => flight.descent_class === "Interrupted descent"
    ).length

    const openapFlights = scenarioFlights.filter(
      (flight) => flight.environmental_method === "OpenAP"
    ).length

    return {
      nFlights: scenarioFlights.length,
      totalFuel,
      totalCo2,
      averageEfficiency,
      interruptedDescents,
      openapFlights,
    }
  }, [scenarioFlights])

  const selectedFlight = useMemo(() => {
    return flights.find((flight) => flight.flight_id === selectedFlightId) || null
  }, [flights, selectedFlightId])

  useEffect(() => {
    if (filteredFlights.length === 0) {
      setSelectedFlightId(null)
      return
    }

    const selectedStillVisible = filteredFlights.some(
      (flight) => flight.flight_id === selectedFlightId
    )

    if (!selectedStillVisible) {
      setSelectedFlightId(filteredFlights[0].flight_id)
    }
  }, [filteredFlights, selectedFlightId])

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <p className="text-lg font-medium">Loading flight data...</p>
            <p className="mt-2 text-sm text-slate-400">
              Reading processed Stockholm Arlanda arrival dataset from FastAPI.
            </p>
          </div>
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="max-w-xl rounded-2xl border border-red-800 bg-red-950/40 p-8">
            <h2 className="text-xl font-semibold text-red-300">
              Backend connection failed
            </h2>
            <p className="mt-3 text-sm text-red-100">{error}</p>
            <p className="mt-4 text-sm text-slate-300">
              Check that FastAPI is running on port 8000:
            </p>
            <pre className="mt-3 rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
cd backend{"\n"}uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
            </pre>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="grid min-h-[calc(100vh-116px)] grid-cols-12 gap-4 p-4">
        

        <section className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <TopKpiCard
            label="Flights"
            value={summary?.n_flights?.toLocaleString() || "0"}
            subtext="Processed arrivals"
          />
          <TopKpiCard
            label="Trajectory points"
            value={summary?.total_points?.toLocaleString() || "0"}
            subtext="Radar/track observations"
          />
          <TopKpiCard
            label="Avg efficiency"
            value={analytics?.dataset?.average_efficiency_score?.toLocaleString() || "N/A"}
            subtext="Prototype score"
          />
          <TopKpiCard
            label="Final fuel"
            value={`${summary?.total_final_fuel_kg?.toLocaleString() || "0"} kg`}
            subtext="OpenAP + fallback"
          />
          <TopKpiCard
            label="Final CO₂"
            value={`${summary?.total_final_co2_kg?.toLocaleString() || "0"} kg`}
            subtext="Estimated emissions"
          />
          <TopKpiCard
            label="OpenAP coverage"
            value={`${analytics?.dataset?.openap_coverage_percent?.toLocaleString() || "0"}%`}
            subtext={`${summary?.openap_count || 0}/${summary?.n_flights || 0} flights`}
          />
        </section>

        <section className="col-span-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-300">
                Research prototype status
              </p>
              <p className="text-sm leading-6 text-slate-300">
                This dashboard uses 407 processed Stockholm Arlanda arrival records for research prototype development.
                It is suitable for trajectory reconstruction, visualization, CDO-style analysis,
                and environmental-estimation workflow testing. It supports exploratory analysis,
                but larger and more balanced samples are still needed for strong operational conclusions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <StatusBadge text="Real trajectory data" />
              <StatusBadge text="OpenAP estimates" />
              <StatusBadge text="Weather context" />
              <StatusBadge text="Prototype only" tone="amber" />
            </div>
          </div>
        </section>
        <DatasetAnalytics analytics={analytics} />
        <TrafficScenarioPanel
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          hourFilter={hourFilter}
          setHourFilter={setHourFilter}
          runwayFilter={runwayFilter}
          setRunwayFilter={setRunwayFilter}
          dateOptions={dateOptions}
          hourOptions={hourOptions}
          runwayOptions={runwayOptions}
          summary={scenarioSummary}
        />
        <aside className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Flight Selector</h2>
            <p className="text-sm text-slate-400">
              Search, filter, and select arrivals into Stockholm Arlanda.
            </p>
          </div>

          <div className="mb-4 space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Search flight
              </label>
              <input
                type="text"
                value={flightSearch}
                onChange={(event) => setFlightSearch(event.target.value)}
                placeholder="Callsign, flight ID, aircraft..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Runway</label>
              <select
                value={runwayFilter}
                onChange={(event) => setRunwayFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                <option value="ALL">All runways</option>
                {runwayOptions.map((runway) => (
                  <option key={runway} value={runway}>
                    {runway}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Aircraft type</label>
              <select
                value={aircraftFilter}
                onChange={(event) => setAircraftFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                <option value="ALL">All aircraft</option>
                {aircraftOptions.map((aircraftType) => (
                  <option key={aircraftType} value={aircraftType}>
                    {aircraftType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Descent class</label>
              <select
                value={descentFilter}
                onChange={(event) => setDescentFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                <option value="ALL">All descent classes</option>
                {descentOptions.map((descentClass) => (
                  <option key={descentClass} value={descentClass}>
                    {descentClass}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Date
              </label>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                <option value="ALL">All dates</option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Hour block
              </label>
              <select
                value={hourFilter}
                onChange={(event) => setHourFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                <option value="ALL">All hours</option>
                {hourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Environmental method
              </label>
              <select
                value={environmentalMethodFilter}
                onChange={(event) => setEnvironmentalMethodFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              >
                <option value="ALL">All methods</option>
                {environmentalMethodOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <label>Minimum efficiency</label>
                <span>{minEfficiency}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minEfficiency}
                onChange={(event) => setMinEfficiency(Number(event.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setRunwayFilter("ALL")
                setAircraftFilter("ALL")
                setDescentFilter("ALL")
                setEnvironmentalMethodFilter("ALL")
                setDateFilter("ALL")
                setHourFilter("ALL")
                setFlightSearch("")
                setMinEfficiency(0)
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
            >
              Reset filters
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredFlights.length} of {flights.length} flights
            </span>
            {(flightSearch ||
              dateFilter !== "ALL" ||
              hourFilter !== "ALL" ||
              environmentalMethodFilter !== "ALL" ||
              runwayFilter !== "ALL" ||
              aircraftFilter !== "ALL" ||
              descentFilter !== "ALL" ||
              minEfficiency > 0) && (
              <span className="text-cyan-300">filters active</span>
            )}
          </div>

          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredFlights.map((flight) => {
              const selected = flight.flight_id === selectedFlightId

              return (
                <button
                  key={flight.flight_id}
                  onClick={() => setSelectedFlightId(flight.flight_id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-800 hover:border-cyan-400 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-100">
                      {flight.callsign || flight.flight_id}
                    </p>
                    <span className="rounded-full bg-slate-950 px-2 py-1 text-xs text-cyan-300">
                      {flight.aircraft_type || "N/A"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>RWY {flight.arrival_runway || "N/A"}</span>
                    <span>STAR {flight.star || "N/A"}</span>
                    <span>{flight.descent_class}</span>
                    <span>{flight.efficiency_score}/100</span>
                  </div>
                </button>
              )
            })}
            {filteredFlights.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                No flights match the selected filters.
              </div>
            )}
          </div>
        </aside>

        <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Live Flight Map</h2>
              <p className="text-sm text-slate-400">
                Selected flight trajectory from the FastAPI backend.
              </p>
            </div>
             <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Time window</label>
              <select
                value={timeWindowMinutes}
                onChange={(event) => setTimeWindowMinutes(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
              >
                <option value={0}>Exact overlap</option>
                <option value={10}>±10 min</option>
                <option value={20}>±20 min</option>
                <option value={60}>±60 min</option>
                <option value={1440}>Same day</option>
              </select>
            </div>
          </div>

          {trajectoryLoading ? (
            <div className="flex h-[520px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <p className="text-sm text-slate-400">Loading trajectory...</p>
              </div>
            </div>
          ) : (
            <FlightMap
              selectedFlight={selectedFlight}
              flights={filteredFlights}
              visibleTrajectories={visibleTrajectories}
            />
          )}
        </section>

        <aside className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-3">
          <h2 className="mb-3 text-lg font-semibold">Metrics</h2>

          <div className="space-y-3">
            <MetricCard
              label="Flights Loaded"
              value={summary?.n_flights?.toLocaleString() || "0"}
            />
            <MetricCard
              label="Trajectory Points"
              value={summary?.total_points?.toLocaleString() || "0"}
            />
            <MetricCard
              label="Runways"
              value={summary?.runways?.join(" / ") || "N/A"}
            />
            <MetricCard
              label="Final Fuel Estimate"
              value={`${summary?.total_final_fuel_kg?.toLocaleString() || "0"} kg`}
            />
            <MetricCard
              label="Final CO₂ Estimate"
              value={`${summary?.total_final_co2_kg?.toLocaleString() || "0"} kg`}
            />
            <MetricCard
              label="OpenAP / Fallback"
              value={`${summary?.openap_count || 0} / ${summary?.fallback_proxy_count || 0}`}
            />
          </div>

          {selectedFlight && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Selected Arrival
              </p>
              <h3 className="mt-1 text-xl font-semibold text-cyan-300">
                {selectedFlight.callsign}
              </h3>

              <dl className="mt-4 space-y-2 text-sm">
                <InfoRow label="Aircraft" value={selectedFlight.aircraft_type} />
                <InfoRow label="Origin" value={selectedFlight.origin} />
                <InfoRow label="Destination" value={selectedFlight.destination} />
                <InfoRow label="Runway" value={selectedFlight.arrival_runway} />
                <InfoRow label="STAR" value={selectedFlight.star} />
                <InfoRow label="Descent" value={selectedFlight.descent_class} />
                <InfoRow
                  label="Level-offs"
                  value={selectedFlight.level_off_count}
                />
                <InfoRow
                  label="Distance"
                  value={`${selectedFlight.track_distance_nm} NM`}
                />
                <InfoRow
                  label="Duration"
                  value={`${selectedFlight.duration_min} min`}
                />
                <InfoRow
                  label="Final fuel"
                  value={`${selectedFlight.final_fuel_kg?.toLocaleString() || "N/A"} kg`}
                />
                <InfoRow
                  label="Final CO₂"
                  value={`${selectedFlight.final_co2_kg?.toLocaleString() || "N/A"} kg`}
                />
                <InfoRow
                  label="Method"
                  value={selectedFlight.environmental_method}
                /> 
                <InfoRow
                  label="OpenAP type"
                  value={selectedFlight.openap_aircraft_type}
                />
                <InfoRow
                  label="Assumed mass"
                  value={
                    selectedFlight.assumed_mass_kg
                      ? `${selectedFlight.assumed_mass_kg.toLocaleString()} kg`
                      : "N/A"
                  }
                />
              </dl>
            </div>
            
          )}
          {selectedFlight && (
            <div className="mt-5">
              <WeatherPanel
                weather={selectedFlight.weather}
                runway={selectedFlight.arrival_runway}
              />
            </div>
          )}
        </aside>

        <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Trajectory Analytics</h2>
              <p className="text-sm text-slate-400">
                Altitude, speed, and vertical-rate profiles for the selected arrival.
              </p>
            </div>
            <p className="text-sm text-slate-400">
              Selected flight: {selectedFlight?.callsign || "None"}
            </p>
          </div>

          <TrajectoryCharts trajectory={selectedTrajectory} />
        </section>
        <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Flight Comparison</h2>
              <p className="text-sm text-slate-400">
                Compare arrival efficiency, level-offs, distance, fuel proxy, and CO₂ proxy.
              </p>
            </div>
            <p className="text-sm text-slate-400">
              Showing: {filteredFlights.length} / {flights.length} flights
            </p>
          </div>

          <FlightComparison
            flights={filteredFlights}
            selectedFlightId={selectedFlightId}
            onSelectFlight={setSelectedFlightId}
          />
        </section>
        <section className="col-span-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Methodology and Research Notes</h2>
              <p className="text-sm text-slate-400">
                How the dashboard converts raw flight JSON into arrival-efficiency and environmental indicators.
              </p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              Prototype assumptions
            </span>
          </div>

          <MethodologyPanel />
        </section>


      </main>
    </PageShell>
  )
}

function PageShell({ children }) {
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
            Real flight trajectory data connected through FastAPI. Designed for
            arrival efficiency, CDO analysis, fuel proxy, and CO₂ performance.
          </p>
        </div>
      </header>

      {children}
    </div>
  )
}
function TrafficScenarioPanel({
  dateFilter,
  setDateFilter,
  hourFilter,
  setHourFilter,
  runwayFilter,
  setRunwayFilter,
  dateOptions,
  hourOptions,
  runwayOptions,
  summary,
}) {
  return (
    <section className="col-span-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Traffic Scenario Selector
          </h2>
          <p className="text-sm text-slate-400">
            Select a date, hour block, and runway to inspect same-day arrival traffic context.
          </p>
        </div>

        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          Arrival-flow analysis
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">
            Scenario date
          </label>
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="ALL">All dates</option>
            {dateOptions.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">
            Hour block
          </label>
          <select
            value={hourFilter}
            onChange={(event) => setHourFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="ALL">All hours</option>
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">
            Runway
          </label>
          <select
            value={runwayFilter}
            onChange={(event) => setRunwayFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="ALL">All runways</option>
            {runwayOptions.map((runway) => (
              <option key={runway} value={runway}>
                {runway}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">
            Scenario status
          </label>
          <button
            type="button"
            onClick={() => {
              setDateFilter("ALL")
              setHourFilter("ALL")
              setRunwayFilter("ALL")
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
          >
            Reset scenario
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ScenarioMetric
          label="Scenario flights"
          value={summary.nFlights.toLocaleString()}
        />
        <ScenarioMetric
          label="Total fuel"
          value={`${Math.round(summary.totalFuel).toLocaleString()} kg`}
        />
        <ScenarioMetric
          label="Total CO₂"
          value={`${Math.round(summary.totalCo2).toLocaleString()} kg`}
        />
        <ScenarioMetric
          label="Avg efficiency"
          value={
            summary.averageEfficiency === null
              ? "N/A"
              : summary.averageEfficiency.toFixed(1)
          }
        />
        <ScenarioMetric
          label="Interrupted descents"
          value={summary.interruptedDescents.toLocaleString()}
        />
        <ScenarioMetric
          label="OpenAP flights"
          value={summary.openapFlights.toLocaleString()}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Scenario time uses approach clearance time where available, otherwise last timestamp or first timestamp.
        This provides an operational arrival-flow view for sequencing and traffic-context analysis.
      </p>
    </section>
  )
}

function ScenarioMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-cyan-300">{value}</p>
    </div>
  )
}


function TopKpiCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg shadow-slate-950/30">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-cyan-300">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtext}</p>
    </div>
  )
}

function StatusBadge({ text, tone = "cyan" }) {
  const style =
    tone === "amber"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
      : "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"

  return (
    <span className={`rounded-full border px-3 py-1 ${style}`}>
      {text}
    </span>
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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-800/60 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value || "N/A"}</dd>
    </div>
  )
}

function Panel({ title, text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-5">
      <p className="font-medium text-slate-200">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  )
}

export default App