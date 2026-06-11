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
            "Run: python scripts/process_flights.py"
        )

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_flights() -> List[Dict[str, Any]]:
    return read_json_file("flights.json")


def load_trajectories() -> Dict[str, List[Dict[str, Any]]]:
    return read_json_file("trajectories.json")


def load_summary() -> Dict[str, Any]:
    return read_json_file("summary.json")


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