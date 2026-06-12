import json
from pathlib import Path
from typing import Any, Dict, List, Set

import requests


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

FLIGHTS_PATH = PROCESSED_DIR / "flights.json"
OUTPUT_PATH = PROCESSED_DIR / "weather_hourly.json"

ESSA_LAT = 59.6519
ESSA_LON = 17.9186

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def extract_dates(flights: List[Dict[str, Any]]) -> List[str]:
    dates: Set[str] = set()

    for flight in flights:
        for field in ["first_timestamp", "last_timestamp", "approach_clearance_time"]:
            value = flight.get(field)
            if value and len(value) >= 10:
                dates.add(value[:10])

    return sorted(dates)


def fetch_weather_for_date(date: str) -> Dict[str, Any]:
    params = {
        "latitude": ESSA_LAT,
        "longitude": ESSA_LON,
        "start_date": date,
        "end_date": date,
        "hourly": ",".join(
            [
                "temperature_2m",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "precipitation",
                "cloud_cover",
            ]
        ),
        "timezone": "UTC",
    }

    response = requests.get(OPEN_METEO_URL, params=params, timeout=30)
    response.raise_for_status()

    return response.json()


def normalize_weather_response(date: str, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    hourly = raw.get("hourly") or {}
    times = hourly.get("time") or []

    rows = []

    for index, time_value in enumerate(times):
        rows.append(
            {
                "date": date,
                "time": time_value,
                "latitude": raw.get("latitude"),
                "longitude": raw.get("longitude"),
                "temperature_2m_c": get_indexed(hourly, "temperature_2m", index),
                "surface_pressure_hpa": get_indexed(hourly, "surface_pressure", index),
                "wind_speed_10m": get_indexed(hourly, "wind_speed_10m", index),
                "wind_direction_10m_deg": get_indexed(hourly, "wind_direction_10m", index),
                "precipitation_mm": get_indexed(hourly, "precipitation", index),
                "cloud_cover_percent": get_indexed(hourly, "cloud_cover", index),
                "source": "Open-Meteo Historical Weather API",
                "note": "Surface weather at ESSA coordinates. Not wind aloft.",
            }
        )

    return rows


def get_indexed(hourly: Dict[str, List[Any]], key: str, index: int) -> Any:
    values = hourly.get(key) or []
    if index >= len(values):
        return None
    return values[index]


def main() -> None:
    flights = load_json(FLIGHTS_PATH)
    dates = extract_dates(flights)

    if not dates:
        raise RuntimeError("No flight dates found in data/processed/flights.json")

    print(f"Found {len(dates)} flight date(s): {', '.join(dates)}")

    all_rows = []

    for date in dates:
        print(f"Fetching weather for {date}")
        raw = fetch_weather_for_date(date)
        rows = normalize_weather_response(date, raw)
        all_rows.extend(rows)

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(all_rows, file, indent=2)

    print("\nWeather fetch complete")
    print(f"Saved: {OUTPUT_PATH}")
    print(f"Rows: {len(all_rows)}")
    print("Source: Open-Meteo Historical Weather API")
    print("Note: This is ESSA surface weather, not wind/temperature at aircraft altitude.")


if __name__ == "__main__":
    main()