import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { useEffect, useMemo, useState } from "react"

const ESSA_POSITION = [59.6519, 17.9186]

const COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#fb7185",
  "#facc15",
  "#34d399",
  "#f97316",
  "#60a5fa",
  "#f472b6",
  "#bef264",
  "#c084fc",
]

const airportIcon = L.divIcon({
  className: "airport-icon",
  html: `<div style="
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    background: #22d3ee;
    border: 3px solid #0f172a;
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.9);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function createAircraftIcon(color, isSelected, headingDeg = 45) {
  return L.divIcon({
    className: "aircraft-icon",
    html: `<div style="
      font-size: ${isSelected ? 30 : 24}px;
      transform: rotate(${headingDeg}deg);
      filter: drop-shadow(0 0 8px ${color});
      opacity: ${isSelected ? 1 : 0.85};
    ">✈️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function toMs(timestamp) {
  if (!timestamp) return null
  const value = new Date(timestamp).getTime()
  return Number.isNaN(value) ? null : value
}

function formatTime(ms) {
  if (!ms) return "N/A"
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19) + " UTC"
}

function FitBounds({ allPositions }) {
  const map = useMap()

  useEffect(() => {
    if (!allPositions || allPositions.length < 2) {
      map.setView(ESSA_POSITION, 7)
      return
    }

    const bounds = L.latLngBounds(allPositions)
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 9,
    })
  }, [allPositions, map])

  return null
}

function validPoints(trajectory) {
  if (!trajectory || trajectory.length === 0) return []

  return trajectory
    .filter((point) => point.lat !== null && point.lon !== null)
    .map((point) => ({
      ...point,
      timeMs: toMs(point.timestamp),
    }))
    .filter((point) => point.timeMs !== null)
    .sort((a, b) => a.timeMs - b.timeMs)
}

function validPositions(trajectory) {
  return validPoints(trajectory).map((point) => [point.lat, point.lon])
}

function getTrajectoryTimeRange(trajectory) {
  const points = validPoints(trajectory)
  if (points.length === 0) return [null, null]
  return [points[0].timeMs, points[points.length - 1].timeMs]
}

function getPointAtTime(trajectory, currentTimeMs) {
  if (!trajectory || trajectory.length === 0 || currentTimeMs === null) {
    return null
  }

  const points = validPoints(trajectory)

  if (points.length === 0) return null

  if (currentTimeMs < points[0].timeMs || currentTimeMs > points[points.length - 1].timeMs) {
    return null
  }

  let closestIndex = 0
  let smallestDiff = Math.abs(currentTimeMs - points[0].timeMs)

  for (let index = 1; index < points.length; index += 1) {
    const diff = Math.abs(currentTimeMs - points[index].timeMs)

    if (diff < smallestDiff) {
      closestIndex = index
      smallestDiff = diff
    }
  }

  const closestPoint = points[closestIndex]
  const previousPoint = points[Math.max(closestIndex - 1, 0)]
  const nextPoint = points[Math.min(closestIndex + 1, points.length - 1)]

  const headingDeg = calculateBearingDeg(
    previousPoint.lat,
    previousPoint.lon,
    nextPoint.lat,
    nextPoint.lon
  )

  return {
    ...closestPoint,
    headingDeg,
  }
}

function calculateBearingDeg(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 45

  const phi1 = degreesToRadians(lat1)
  const phi2 = degreesToRadians(lat2)
  const deltaLon = degreesToRadians(lon2 - lon1)

  const y = Math.sin(deltaLon) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLon)

  const bearing = radiansToDegrees(Math.atan2(y, x))
  return (bearing + 360) % 360
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180
}

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI
}

function getAltitudeColor(altitudeFt) {
  if (altitudeFt === null || altitudeFt === undefined) return "#94a3b8"

  if (altitudeFt >= 30000) return "#7c3aed"
  if (altitudeFt >= 20000) return "#2563eb"
  if (altitudeFt >= 10000) return "#0891b2"
  if (altitudeFt >= 5000) return "#16a34a"
  if (altitudeFt >= 2000) return "#f59e0b"
  return "#ef4444"
}

function AltitudeColoredPolyline({ trajectory }) {
  const points = validPoints(trajectory)

  if (points.length < 2) return null

  return (
    <>
      {points.slice(1).map((point, index) => {
        const previous = points[index]
        const altitudeFt = point.altitude_ft
        const color = getAltitudeColor(altitudeFt)

        return (
          <Polyline
            key={`${point.timestamp}-${index}`}
            positions={[
              [previous.lat, previous.lon],
              [point.lat, point.lon],
            ]}
            pathOptions={{
              color,
              weight: 5,
              opacity: 0.9,
            }}
          />
        )
      })}
    </>
  )
}

function FlightMap({ selectedFlight, flights, visibleTrajectories }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeMs, setCurrentTimeMs] = useState(null)

  const visibleFlightRecords = useMemo(() => {
    return flights.filter((flight) => visibleTrajectories[flight.flight_id])
  }, [flights, visibleTrajectories])

  const allPositions = useMemo(() => {
    return visibleFlightRecords.flatMap((flight) =>
      validPositions(visibleTrajectories[flight.flight_id])
    )
  }, [visibleFlightRecords, visibleTrajectories])

  const timeRange = useMemo(() => {
    const ranges = visibleFlightRecords
      .map((flight) => getTrajectoryTimeRange(visibleTrajectories[flight.flight_id]))
      .filter(([start, end]) => start !== null && end !== null)

    if (ranges.length === 0) {
      return [null, null]
    }

    return [
      Math.min(...ranges.map(([start]) => start)),
      Math.max(...ranges.map(([, end]) => end)),
    ]
  }, [visibleFlightRecords, visibleTrajectories])

  const [minTimeMs, maxTimeMs] = timeRange

  useEffect(() => {
    if (minTimeMs !== null) {
      setCurrentTimeMs(minTimeMs)
      setIsPlaying(false)
    }
  }, [minTimeMs, maxTimeMs])

  useEffect(() => {
    if (!isPlaying || currentTimeMs === null || minTimeMs === null || maxTimeMs === null) {
      return
    }

    const interval = window.setInterval(() => {
      setCurrentTimeMs((previous) => {
        if (previous === null) return minTimeMs

        const next = previous + 30 * 1000

        if (next >= maxTimeMs) {
          return minTimeMs
        }

        return next
      })
    }, 600)

    return () => window.clearInterval(interval)
  }, [isPlaying, currentTimeMs, minTimeMs, maxTimeMs])

  const activeAircraft = useMemo(() => {
    if (currentTimeMs === null) return []

    return visibleFlightRecords
      .map((flight, index) => {
        const trajectory = visibleTrajectories[flight.flight_id]
        const point = getPointAtTime(trajectory, currentTimeMs)

        if (!point) return null

        const isSelected = flight.flight_id === selectedFlight?.flight_id
        const color = isSelected ? "#22d3ee" : COLORS[index % COLORS.length]

        return {
          flight,
          point,
          color,
          isSelected,
        }
      })
      .filter(Boolean)
  }, [currentTimeMs, selectedFlight, visibleFlightRecords, visibleTrajectories])

  const sliderDisabled = minTimeMs === null || maxTimeMs === null || minTimeMs === maxTimeMs

  return (
    <div className="relative h-[520px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="absolute left-3 top-3 z-[1000] max-h-[250px] w-[300px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <span>
            <span className="text-cyan-300">{visibleFlightRecords.length}</span>{" "}
            time-matching flight{visibleFlightRecords.length === 1 ? "" : "s"}
          </span>
          <span className="text-slate-500">
            {activeAircraft.length} active
          </span>
        </div>

        <div className="space-y-2">
          {visibleFlightRecords.map((flight, index) => {
            const isSelected = flight.flight_id === selectedFlight?.flight_id
            const color = isSelected ? "#22d3ee" : COLORS[index % COLORS.length]
            const trajectory = visibleTrajectories[flight.flight_id]
            const [start, end] = getTrajectoryTimeRange(trajectory)
            const isActive =
              currentTimeMs !== null &&
              start !== null &&
              end !== null &&
              currentTimeMs >= start &&
              currentTimeMs <= end

            return (
              <div
                key={flight.flight_id}
                className={`rounded-lg border px-2 py-2 ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-slate-800 bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-slate-100">
                      {flight.callsign || flight.flight_id}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isActive ? "active" : "inactive"}
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-slate-400">
                  <span>{flight.aircraft_type || "N/A"}</span>
                  <span>RWY {flight.arrival_runway || "N/A"}</span>
                  <span>STAR {flight.star || "N/A"}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute right-3 top-3 z-[1000] rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs text-slate-300 shadow-lg">
        <p className="mb-2 font-medium text-slate-100">Altitude color</p>
        <LegendItem color="#7c3aed" label="≥ 30,000 ft" />
        <LegendItem color="#2563eb" label="20,000–30,000 ft" />
        <LegendItem color="#0891b2" label="10,000–20,000 ft" />
        <LegendItem color="#16a34a" label="5,000–10,000 ft" />
        <LegendItem color="#f59e0b" label="2,000–5,000 ft" />
        <LegendItem color="#ef4444" label="< 2,000 ft" />
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => setIsPlaying((value) => !value)}
            disabled={sliderDisabled}
            className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-cyan-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <span className="truncate text-slate-400">
            Current time:{" "}
            <span className="text-cyan-300">{formatTime(currentTimeMs)}</span>
          </span>
        </div>

        <input
          type="range"
          min={minTimeMs || 0}
          max={maxTimeMs || 0}
          value={currentTimeMs || minTimeMs || 0}
          disabled={sliderDisabled}
          onChange={(event) => setCurrentTimeMs(Number(event.target.value))}
          className="w-full accent-cyan-400"
        />

        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>{formatTime(minTimeMs)}</span>
          <span>{formatTime(maxTimeMs)}</span>
        </div>
      </div>

      <MapContainer
        center={ESSA_POSITION}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={ESSA_POSITION} icon={airportIcon}>
          <Popup>
            <strong>Stockholm Arlanda Airport</strong>
            <br />
            ESSA
          </Popup>
        </Marker>

        {visibleFlightRecords.map((flight, index) => {
          const trajectory = visibleTrajectories[flight.flight_id]
          const positions = validPositions(trajectory)
          const isSelected = flight.flight_id === selectedFlight?.flight_id
          const color = isSelected ? "#22d3ee" : COLORS[index % COLORS.length]

          if (isSelected) {
            return (
              <AltitudeColoredPolyline
                key={flight.flight_id}
                trajectory={trajectory}
              />
            )
          }

          return (
            <Polyline
              key={flight.flight_id}
              positions={positions}
              pathOptions={{
                color,
                weight: 3,
                opacity: 0.45,
              }}
            />
          )
        })}

        {activeAircraft.map(({ flight, point, color, isSelected }) => (
          <Marker
            key={flight.flight_id}
            position={[point.lat, point.lon]}
            icon={createAircraftIcon(color, isSelected, point.headingDeg)}
          >
            <Popup>
              <strong>{flight.callsign || flight.flight_id}</strong>
              <br />
              Aircraft: {flight.aircraft_type || "N/A"}
              <br />
              Runway: {flight.arrival_runway || "N/A"}
              <br />
              STAR: {flight.star || "N/A"}
              <br />
              Altitude:{" "}
              {point.altitude_ft
                ? Math.round(point.altitude_ft).toLocaleString()
                : "N/A"}{" "}
              ft
              <br />
              Speed:{" "}
              {point.groundspeed_kt ? Math.round(point.groundspeed_kt) : "N/A"} kt
              <br />
              Heading: {point.headingDeg ? Math.round(point.headingDeg) : "N/A"}°
              <br />
              Time: {point.timestamp}
            </Popup>
          </Marker>
        ))}

        <FitBounds allPositions={allPositions} />
      </MapContainer>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-slate-400">{label}</span>
    </div>
  )
}

export default FlightMap