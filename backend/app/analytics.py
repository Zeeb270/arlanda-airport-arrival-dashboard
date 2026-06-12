from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.data_loader import load_flights


def parse_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def get_arrival_reference_time(flight: Dict[str, Any]) -> Optional[datetime]:
    return (
        parse_timestamp(flight.get("approach_clearance_time"))
        or parse_timestamp(flight.get("last_timestamp"))
        or parse_timestamp(flight.get("first_timestamp"))
    )


def count_field(flights: List[Dict[str, Any]], field: str, missing_label: str = "Unknown") -> List[Dict[str, Any]]:
    counter = Counter()

    for flight in flights:
        value = flight.get(field) or missing_label
        counter[str(value)] += 1

    return [
        {"label": label, "count": count}
        for label, count in sorted(counter.items(), key=lambda item: item[1], reverse=True)
    ]


def top_n_with_other(rows: List[Dict[str, Any]], n: int = 10) -> List[Dict[str, Any]]:
    if len(rows) <= n:
        return rows

    top_rows = rows[:n]
    other_count = sum(row["count"] for row in rows[n:])

    return top_rows + [{"label": "Other", "count": other_count}]


def hourly_traffic_distribution(flights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    counter = Counter()

    for flight in flights:
        arrival_time = get_arrival_reference_time(flight)

        if arrival_time is None:
            counter["Unknown"] += 1
            continue

        hour_label = f"{arrival_time.hour:02d}:00"
        counter[hour_label] += 1

    rows = []

    for hour in range(24):
        label = f"{hour:02d}:00"
        rows.append({"label": label, "count": counter.get(label, 0)})

    if counter.get("Unknown", 0) > 0:
        rows.append({"label": "Unknown", "count": counter["Unknown"]})

    return rows


def classify_weather_condition(weather: Optional[Dict[str, Any]]) -> str:
    if not weather:
        return "No weather"

    precipitation = weather.get("precipitation_mm")
    cloud_cover = weather.get("cloud_cover_percent")

    try:
        precipitation_value = float(precipitation or 0)
    except (TypeError, ValueError):
        precipitation_value = 0.0

    try:
        cloud_cover_value = float(cloud_cover or 0)
    except (TypeError, ValueError):
        cloud_cover_value = 0.0

    if precipitation_value > 0:
        return "Precipitation"

    if cloud_cover_value >= 75:
        return "Overcast"

    if cloud_cover_value >= 40:
        return "Cloudy"

    return "Clear / few clouds"


def weather_condition_distribution(flights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    counter = Counter()

    for flight in flights:
        counter[classify_weather_condition(flight.get("weather"))] += 1

    preferred_order = [
        "Clear / few clouds",
        "Cloudy",
        "Overcast",
        "Precipitation",
        "No weather",
    ]

    rows = []

    for label in preferred_order:
        if counter.get(label, 0) > 0:
            rows.append({"label": label, "count": counter[label]})

    return rows


def average_numeric(flights: List[Dict[str, Any]], field: str) -> Optional[float]:
    values = []

    for flight in flights:
        value = flight.get(field)

        if value is None:
            continue

        try:
            values.append(float(value))
        except (TypeError, ValueError):
            continue

    if not values:
        return None

    return round(sum(values) / len(values), 2)


def total_numeric(flights: List[Dict[str, Any]], field: str) -> float:
    total = 0.0

    for flight in flights:
        value = flight.get(field)

        if value is None:
            continue

        try:
            total += float(value)
        except (TypeError, ValueError):
            continue

    return round(total, 2)


def load_analytics_summary() -> Dict[str, Any]:
    flights = load_flights()
    total_flights = len(flights)

    environmental_method_rows = count_field(
        flights,
        "environmental_method",
        missing_label="Unknown",
    )

    openap_count = sum(
        1 for flight in flights if flight.get("environmental_method") == "OpenAP"
    )

    fallback_count = sum(
        1 for flight in flights if flight.get("environmental_method") == "Fallback proxy"
    )

    openap_coverage_percent = (
        round((openap_count / total_flights) * 100, 1)
        if total_flights > 0
        else 0.0
    )

    return {
        "dataset": {
            "total_flights": total_flights,
            "average_efficiency_score": average_numeric(flights, "efficiency_score"),
            "average_fuel_kg": average_numeric(flights, "final_fuel_kg"),
            "average_co2_kg": average_numeric(flights, "final_co2_kg"),
            "total_fuel_kg": total_numeric(flights, "final_fuel_kg"),
            "total_co2_kg": total_numeric(flights, "final_co2_kg"),
            "openap_count": openap_count,
            "fallback_proxy_count": fallback_count,
            "openap_coverage_percent": openap_coverage_percent,
        },
        "runway_distribution": count_field(flights, "arrival_runway"),
        "aircraft_type_distribution": top_n_with_other(
            count_field(flights, "aircraft_type"),
            n=10,
        ),
        "descent_class_distribution": count_field(flights, "descent_class"),
        "environmental_method_distribution": environmental_method_rows,
        "hourly_traffic_distribution": hourly_traffic_distribution(flights),
        "weather_condition_distribution": weather_condition_distribution(flights),
        "notes": {
            "hourly_traffic_time_basis": (
                "Arrival reference time uses approach clearance time where available, "
                "otherwise last timestamp, otherwise first timestamp."
            ),
            "weather_condition_rule": (
                "Weather classes are simplified from Open-Meteo surface weather: "
                "precipitation > 0, cloud cover >= 75 overcast, cloud cover >= 40 cloudy, else clear/few clouds."
            ),
            "environmental_method_rule": (
                "OpenAP is used where aircraft and trajectory data support it; fallback proxy is used otherwise."
            ),
        },
    }