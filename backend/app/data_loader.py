import json
from pathlib import Path
from typing import Any, Dict, List


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


def read_json_file(filename: str) -> Any:
    path = PROCESSED_DIR / filename

    if not path.exists():
        raise FileNotFoundError(
            f"Processed file not found: {path}. "
            "Run the processing scripts first."
        )

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_flights_base() -> List[Dict[str, Any]]:
    return read_json_file("flights.json")


def load_trajectories() -> Dict[str, List[Dict[str, Any]]]:
    return read_json_file("trajectories.json")


def load_summary_base() -> Dict[str, Any]:
    return read_json_file("summary.json")


def load_openap_metrics() -> List[Dict[str, Any]]:
    try:
        return read_json_file("openap_metrics.json")
    except FileNotFoundError:
        return []


def load_openap_metrics_map() -> Dict[str, Dict[str, Any]]:
    rows = load_openap_metrics()
    return {str(row.get("flight_id")): row for row in rows}


def merge_flight_environmental_metrics(
    flight: Dict[str, Any],
    metric: Dict[str, Any] | None,
) -> Dict[str, Any]:
    merged = dict(flight)

    if not metric:
        merged.update(
            {
                "final_fuel_kg": flight.get("estimated_fuel_kg_proxy"),
                "final_co2_kg": flight.get("estimated_co2_kg_proxy"),
                "environmental_method": "Proxy only",
                "environmental_status": "OpenAP metrics not available",
                "openap_aircraft_type": None,
                "assumed_mass_kg": None,
                "estimated_fuel_kg_openap": None,
                "estimated_co2_kg_openap": None,
            }
        )
        return merged

    merged.update(
        {
            "openap_aircraft_type": metric.get("openap_aircraft_type"),
            "assumed_mass_kg": metric.get("assumed_mass_kg"),
            "estimated_fuel_kg_openap": metric.get("estimated_fuel_kg_openap"),
            "estimated_co2_kg_openap": metric.get("estimated_co2_kg_openap"),
            "final_fuel_kg": metric.get("final_fuel_kg"),
            "final_co2_kg": metric.get("final_co2_kg"),
            "environmental_method": metric.get("environmental_method"),
            "environmental_status": metric.get("environmental_status"),
            "environmental_notes": metric.get("notes"),
            "openap_status": metric.get("status"),
            "used_segments": metric.get("used_segments"),
            "skipped_segments": metric.get("skipped_segments"),
        }
    )

    return merged


def load_flights() -> List[Dict[str, Any]]:
    flights = load_flights_base()
    metrics_map = load_openap_metrics_map()

    return [
        merge_flight_environmental_metrics(
            flight,
            metrics_map.get(str(flight.get("flight_id"))),
        )
        for flight in flights
    ]


def load_summary() -> Dict[str, Any]:
    summary = load_summary_base()
    flights = load_flights()

    total_final_fuel = sum(flight.get("final_fuel_kg") or 0 for flight in flights)
    total_final_co2 = sum(flight.get("final_co2_kg") or 0 for flight in flights)

    openap_count = sum(
        1 for flight in flights if flight.get("environmental_method") == "OpenAP"
    )
    fallback_count = sum(
        1 for flight in flights if flight.get("environmental_method") == "Fallback proxy"
    )

    summary.update(
        {
            "total_final_fuel_kg": round(total_final_fuel, 2),
            "total_final_co2_kg": round(total_final_co2, 2),
            "openap_count": openap_count,
            "fallback_proxy_count": fallback_count,
            "environmental_metric_note": (
                "Final estimates use OpenAP where available and fallback proxy where OpenAP fails."
            ),
        }
    )

    return summary


def get_flight_by_id(flight_id: str) -> Dict[str, Any]:
    flights = load_flights()

    for flight in flights:
        if str(flight.get("flight_id")) == str(flight_id):
            return flight

    raise KeyError(f"Flight not found: {flight_id}")


def get_trajectory_by_flight_id(flight_id: str) -> List[Dict[str, Any]]:
    trajectories = load_trajectories()
    trajectory = trajectories.get(str(flight_id))

    if trajectory is None:
        raise KeyError(f"Trajectory not found for flight: {flight_id}")

    return trajectory