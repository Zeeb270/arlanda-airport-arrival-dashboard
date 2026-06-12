const RUNWAY_HEADINGS = {
  "01L": 10,
  "01R": 10,
  "08": 80,
  "19L": 190,
  "19R": 190,
  "26": 260,
}

function WeatherPanel({ weather, runway }) {
  if (!weather) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <h3 className="font-medium text-slate-100">Weather Context</h3>
        <p className="mt-2 text-sm text-slate-400">
          No weather data available for this flight.
        </p>
      </div>
    )
  }

  const wind = calculateRunwayWindComponent({
    runway,
    windDirectionDeg: weather.wind_direction_10m_deg,
    windSpeedKmh: weather.wind_speed_10m,
  })

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-100">Weather Context</h3>
          <p className="text-xs text-slate-500">
            ESSA surface weather nearest to selected flight time
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          Open-Meteo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <WeatherItem label="Time" value={weather.time} />
        <WeatherItem label="Temperature" value={`${weather.temperature_2m_c} °C`} />
        <WeatherItem label="Pressure" value={`${weather.surface_pressure_hpa} hPa`} />
        <WeatherItem label="Wind speed" value={`${weather.wind_speed_10m} km/h`} />
        <WeatherItem label="Wind direction" value={`${weather.wind_direction_10m_deg}°`} />
        <WeatherItem label="Cloud cover" value={`${weather.cloud_cover_percent}%`} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-100">Runway wind component</p>
          <span className="rounded-full bg-slate-950 px-2 py-1 text-xs text-cyan-300">
            RWY {runway || "N/A"}
          </span>
        </div>

        {wind.available ? (
          <div className="space-y-2 text-sm">
            <WeatherInfoRow label="Runway heading" value={`${wind.runwayHeadingDeg}°`} />
            <WeatherInfoRow label="Headwind / tailwind" value={wind.headwindText} />
            <WeatherInfoRow label="Crosswind" value={wind.crosswindText} />
            <p className="pt-2 text-xs leading-5 text-slate-500">
              {wind.interpretation}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Runway wind component cannot be calculated for this runway.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Surface weather only. This does not include wind or temperature at aircraft altitude.
      </p>
    </div>
  )
}

function calculateRunwayWindComponent({ runway, windDirectionDeg, windSpeedKmh }) {
  if (!runway || windDirectionDeg === null || windDirectionDeg === undefined || !windSpeedKmh) {
    return { available: false }
  }

  const runwayHeadingDeg = RUNWAY_HEADINGS[runway]

  if (!runwayHeadingDeg) {
    return { available: false }
  }

  const windSpeedKt = Number(windSpeedKmh) * 0.539957
  const angleRad = degreesToRadians(Number(windDirectionDeg) - runwayHeadingDeg)

  const headwindKt = windSpeedKt * Math.cos(angleRad)
  const crosswindKt = windSpeedKt * Math.sin(angleRad)

  const headwindAbs = Math.abs(headwindKt).toFixed(1)
  const crosswindAbs = Math.abs(crosswindKt).toFixed(1)

  const headwindText =
    headwindKt >= 0
      ? `${headwindAbs} kt headwind`
      : `${headwindAbs} kt tailwind`

  const crosswindText =
    crosswindKt >= 0
      ? `${crosswindAbs} kt from right`
      : `${crosswindAbs} kt from left`

  const interpretation =
    headwindKt >= 0
      ? "Surface wind is broadly favourable for arrivals on this runway because it provides a headwind component."
      : "Surface wind indicates a tailwind component for this runway, which may affect runway suitability and approach energy management."

  return {
    available: true,
    runwayHeadingDeg,
    headwindText,
    crosswindText,
    interpretation,
  }
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180
}

function WeatherItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-100">{value ?? "N/A"}</p>
    </div>
  )
}

function WeatherInfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-800/60 pb-1">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{value}</span>
    </div>
  )
}

export default WeatherPanel