import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

try:
    from openap import FuelFlow
except Exception as exc:
    FuelFlow = None
    OPENAP_IMPORT_ERROR = exc
else:
    OPENAP_IMPORT_ERROR = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

TRAJECTORIES_PATH = PROCESSED_DIR / "trajectories.json"
FLIGHTS_PATH = PROCESSED_DIR / "flights.json"
OUTPUT_PATH = PROCESSED_DIR / "openap_metrics.json"


# Aircraft-type fallback mapping.
# If OpenAP does not support a specific ICAO type, we map it to a close model.
AIRCRAFT_TYPE_MAP = {
    "B736": "B737",
    "B737": "B737",
    "B738": "B738",
    "A319": "A319",
    "A320": "A320",
    "F50": "AT72",     # turboprop fallback approximation
    "SF34": "AT72",    # turboprop fallback approximation
}


# Approximate arrival/descent mass assumptions in kg.
# These are not measured values. They are transparent modelling assumptions.
ASSUMED_MASS_KG = {
    "A319": 56000,
    "A320": 62000,
    "B736": 56000,
    "B737": 60000,
    "B738": 65000,
    "F50": 18000,
    "SF34": 12000,
}


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def parse_time(timestamp: Optional[str]) -> Optional[pd.Timestamp]:
    if not timestamp:
        return None

    try:
        return pd.to_datetime(timestamp)
    except Exception:
        return None


def seconds_between(previous: Dict[str, Any], current: Dict[str, Any]) -> Optional[float]:
    previous_time = parse_time(previous.get("timestamp"))
    current_time = parse_time(current.get("timestamp"))

    if previous_time is None or current_time is None:
        return None

    delta = (current_time - previous_time).total_seconds()

    if delta <= 0 or delta > 60:
        return None

    return float(delta)


def clamp(value: Optional[float], minimum: float, maximum: float) -> Optional[float]:
    if value is None:
        return None
    return max(min(float(value), maximum), minimum)


def get_openap_aircraft_type(aircraft_type: Optional[str]) -> Optional[str]:
    if not aircraft_type:
        return None

    return AIRCRAFT_TYPE_MAP.get(aircraft_type.upper(), aircraft_type.upper())


def get_assumed_mass(aircraft_type: Optional[str]) -> float:
    if not aircraft_type:
        return 60000.0

    return float(ASSUMED_MASS_KG.get(aircraft_type.upper(), 60000))


def estimate_flight_openap(
    flight: Dict[str, Any],
    trajectory: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if FuelFlow is None:
        raise RuntimeError(f"OpenAP import failed: {OPENAP_IMPORT_ERROR}")

    flight_id = str(flight.get("flight_id"))
    original_aircraft_type = flight.get("aircraft_type")
    openap_aircraft_type = get_openap_aircraft_type(original_aircraft_type)
    assumed_mass_kg = get_assumed_mass(original_aircraft_type)

    if not openap_aircraft_type:
        return build_failed_result(
            flight,
            openap_aircraft_type,
            assumed_mass_kg,
            "Missing aircraft type",
        )

    try:
        fuel_model = FuelFlow(ac=openap_aircraft_type)
    except Exception as exc:
        return build_failed_result(
            flight,
            openap_aircraft_type,
            assumed_mass_kg,
            f"OpenAP aircraft model failed: {exc}",
        )

    total_fuel_kg = 0.0
    used_segments = 0
    skipped_segments = 0

    sorted_points = sorted(trajectory, key=lambda p: p.get("timestamp") or "")

    for previous, current in zip(sorted_points[:-1], sorted_points[1:]):
        dt = seconds_between(previous, current)

        if dt is None:
            skipped_segments += 1
            continue

        altitude_ft = current.get("altitude_ft")
        groundspeed_kt = current.get("groundspeed_kt")
        vertical_rate_fpm = current.get("vertical_rate_fpm")

        if altitude_ft is None or groundspeed_kt is None:
            skipped_segments += 1
            continue

        # OpenAP works better with physically plausible values.
        # We use groundspeed as TAS approximation for this prototype.
        tas_kt = clamp(groundspeed_kt, 120, 520)
        alt_ft = clamp(altitude_ft, 0, 45000)
        vs_fpm = clamp(vertical_rate_fpm or 0, -4000, 2500)

        if tas_kt is None or alt_ft is None or vs_fpm is None:
            skipped_segments += 1
            continue

        try:
            fuel_flow_kg_s = fuel_model.enroute(
                mass=assumed_mass_kg,
                tas=tas_kt,
                alt=alt_ft,
                vs=vs_fpm,
            )
        except Exception:
            skipped_segments += 1
            continue

        if fuel_flow_kg_s is None:
            skipped_segments += 1
            continue

        fuel_flow_kg_s = float(fuel_flow_kg_s)

        if math.isnan(fuel_flow_kg_s) or fuel_flow_kg_s < 0:
            skipped_segments += 1
            continue

        total_fuel_kg += fuel_flow_kg_s * dt
        used_segments += 1

    estimated_fuel_kg = round(total_fuel_kg, 2)
    estimated_co2_kg = round(estimated_fuel_kg * 3.16, 2)

    return {
        "flight_id": flight_id,
        "callsign": flight.get("callsign"),
        "aircraft_type": original_aircraft_type,
        "openap_aircraft_type": openap_aircraft_type,
        "assumed_mass_kg": assumed_mass_kg,
        "estimated_fuel_kg_openap": estimated_fuel_kg,
        "estimated_co2_kg_openap": estimated_co2_kg,
        "used_segments": used_segments,
        "skipped_segments": skipped_segments,
        "method": "OpenAP FuelFlow.enroute using groundspeed as TAS approximation",
        "status": "ok" if used_segments > 0 else "no_valid_segments",
        "notes": (
            "Prototype estimate. Aircraft mass is assumed. Groundspeed is used as TAS approximation. "
            "Wind and temperature aloft are not yet included."
        ),
    }


def build_failed_result(
    flight: Dict[str, Any],
    openap_aircraft_type: Optional[str],
    assumed_mass_kg: float,
    reason: str,
) -> Dict[str, Any]:
    return {
        "flight_id": str(flight.get("flight_id")),
        "callsign": flight.get("callsign"),
        "aircraft_type": flight.get("aircraft_type"),
        "openap_aircraft_type": openap_aircraft_type,
        "assumed_mass_kg": assumed_mass_kg,
        "estimated_fuel_kg_openap": None,
        "estimated_co2_kg_openap": None,
        "used_segments": 0,
        "skipped_segments": 0,
        "method": "OpenAP FuelFlow.enroute",
        "status": "failed",
        "notes": reason,
    }


def main() -> None:
    flights = load_json(FLIGHTS_PATH)
    trajectories = load_json(TRAJECTORIES_PATH)

    results = []

    print(f"Loaded {len(flights)} flights")

    for flight in flights:
        flight_id = str(flight.get("flight_id"))
        trajectory = trajectories.get(flight_id, [])

        print(f"Estimating OpenAP fuel for {flight_id} / {flight.get('callsign')}")

        result = estimate_flight_openap(flight, trajectory)

        if result["status"] == "ok":
            result["final_fuel_kg"] = result["estimated_fuel_kg_openap"]
            result["final_co2_kg"] = result["estimated_co2_kg_openap"]
            result["environmental_method"] = "OpenAP"
            result["environmental_status"] = "OpenAP estimate available"
        else:
            result["final_fuel_kg"] = flight.get("estimated_fuel_kg_proxy")
            result["final_co2_kg"] = flight.get("estimated_co2_kg_proxy")
            result["environmental_method"] = "Fallback proxy"
            result["environmental_status"] = (
                "OpenAP unavailable for this flight; using distance and level-off proxy"
            )

        results.append(result)

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(results, file, indent=2)

    ok_count = sum(1 for item in results if item["status"] == "ok")
    failed_count = len(results) - ok_count

    total_fuel = sum(
        item["final_fuel_kg"] or 0
        for item in results
    )

    total_co2 = sum(
        item["final_co2_kg"] or 0
        for item in results
    )

    print("\nOpenAP estimation complete")
    print(f"Saved: {OUTPUT_PATH}")
    print(f"OK flights: {ok_count}")
    print(f"Failed/no-valid flights: {failed_count}")
    print(f"Total final fuel estimate: {total_fuel:.2f} kg")
    print(f"Total final CO2 estimate: {total_co2:.2f} kg")
    print("Final estimate uses OpenAP where available and fallback proxy where OpenAP fails.")


if __name__ == "__main__":
    main()