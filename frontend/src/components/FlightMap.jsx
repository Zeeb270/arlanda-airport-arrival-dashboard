import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { useEffect, useMemo } from "react"

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

function createAircraftIcon(color, isSelected) {
  return L.divIcon({
    className: "aircraft-icon",
    html: `<div style="
      font-size: ${isSelected ? 30 : 24}px;
      transform: rotate(45deg);
      filter: drop-shadow(0 0 8px ${color});
      opacity: ${isSelected ? 1 : 0.85};
    ">✈️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
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

function validPositions(trajectory) {
  if (!trajectory || trajectory.length === 0) return []

  return trajectory
    .filter((point) => point.lat !== null && point.lon !== null)
    .map((point) => [point.lat, point.lon])
}

function lastValidPoint(trajectory) {
  if (!trajectory || trajectory.length === 0) return null

  const validPoints = trajectory.filter((point) => point.lat !== null && point.lon !== null)
  return validPoints.length > 0 ? validPoints[validPoints.length - 1] : null
}

function FlightMap({ selectedFlight, flights, visibleTrajectories }) {
  const visibleFlightRecords = useMemo(() => {
    return flights.filter((flight) => visibleTrajectories[flight.flight_id])
  }, [flights, visibleTrajectories])

  const allPositions = useMemo(() => {
    return visibleFlightRecords.flatMap((flight) =>
      validPositions(visibleTrajectories[flight.flight_id])
    )
  }, [visibleFlightRecords, visibleTrajectories])

  return (
    <div className="relative h-[520px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="absolute left-3 top-3 z-[1000] max-h-[250px] w-[280px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
            <span>
                <span className="text-cyan-300">{visibleFlightRecords.length}</span>{" "}
                time-matching flight{visibleFlightRecords.length === 1 ? "" : "s"}
            </span>
            <span className="text-slate-500">shown</span>
        </div>

        <div className="space-y-2">
            {visibleFlightRecords.map((flight, index) => {
                const isSelected = flight.flight_id === selectedFlight?.flight_id
                const color = isSelected ? "#22d3ee" : COLORS[index % COLORS.length]

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

                                {isSelected && (
                                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300">
                                        selected
                                    </span>
                                )}
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
          const lastPoint = lastValidPoint(trajectory)
          const isSelected = flight.flight_id === selectedFlight?.flight_id
          const color = isSelected ? "#22d3ee" : COLORS[index % COLORS.length]

          return (
            <div key={flight.flight_id}>
              {positions.length > 1 && (
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color,
                    weight: isSelected ? 5 : 3,
                    opacity: isSelected ? 0.95 : 0.55,
                  }}
                />
              )}

              {lastPoint && (
                <Marker
                  position={[lastPoint.lat, lastPoint.lon]}
                  icon={createAircraftIcon(color, isSelected)}
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
                    Descent: {flight.descent_class || "N/A"}
                    <br />
                    Altitude:{" "}
                    {lastPoint.altitude_ft
                      ? Math.round(lastPoint.altitude_ft).toLocaleString()
                      : "N/A"}{" "}
                    ft
                  </Popup>
                </Marker>
              )}
            </div>
          )
        })}

        <FitBounds allPositions={allPositions} />
      </MapContainer>
    </div>
  )
}

export default FlightMap