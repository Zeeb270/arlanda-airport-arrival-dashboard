function WeatherPanel({ weather }) {
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
        <WeatherItem label="Precipitation" value={`${weather.precipitation_mm} mm`} />
        <WeatherItem label="Cloud cover" value={`${weather.cloud_cover_percent}%`} />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Surface weather only. Wind and temperature aloft are not included yet.
      </p>
    </div>
  )
}

function WeatherItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-100">{value ?? "N/A"}</p>
    </div>
  )
}

export default WeatherPanel