import json
import math
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "json_flights"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

ESSA_LAT = 59.6519
ESSA_LON = 17.9186


def parse_time(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None


def iso_or_none(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_nm = 3440.065

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_nm * c


def get_last_non_null(records: List[Dict[str, Any]], field: str) -> Optional[Any]:
    value = None
    for record in records:
        if record.get(field) is not None:
            value = record.get(field)
    return value


def get_first_true_time(records: List[Dict[str, Any]], field: str) -> Optional[str]:
    for record in records:
        if record.get(field) is True:
            return record.get("time_stamp")
    return None


def safe_get_plot_value(plot: Dict[str, Any], group: str, field: str) -> Optional[Any]:
    group_data = plot.get(group)
    if not isinstance(group_data, dict):
        return None
    return group_data.get(field)


def extract_mode_s(plot: Dict[str, Any]) -> Dict[str, Optional[float]]:
    mode_s = plot.get("I062/380")

    if not isinstance(mode_s, dict):
        return {
            "ias": None,
            "mach": None,
            "mag_heading": None,
            "baro_vertical_rate": None,
            "selected_altitude": None,
        }

    subitem13 = mode_s.get("subitem13") or {}
    subitem26 = mode_s.get("subitem26") or {}
    subitem27 = mode_s.get("subitem27") or {}
    subitem3 = mode_s.get("subitem3") or {}
    subitem7 = mode_s.get("subitem7") or {}

    return {
        "ias": subitem26.get("ias"),
        "mach": subitem27.get("mach"),
        "mag_heading": subitem3.get("mag_hdg"),
        "baro_vertical_rate": subitem13.get("baro_vert_rate"),
        "selected_altitude": subitem7.get("altitude"),
    }


def estimate_level_off_count(points: List[Dict[str, Any]]) -> int:
    """
    Prototype rule:
    A level-off segment is counted when vertical rate remains near zero
    for at least 30 seconds.

    Near zero threshold: abs(vertical_rate_fpm) <= 300
    Minimum duration: 30 seconds
    """
    if len(points) < 2:
        return 0

    level_off_count = 0
    in_level_segment = False
    segment_start_time = None

    for point in points:
        timestamp = parse_time(point.get("timestamp"))
        vertical_rate = point.get("vertical_rate_fpm")

        if timestamp is None or vertical_rate is None:
            continue

        is_level = abs(vertical_rate) <= 300

        if is_level and not in_level_segment:
            in_level_segment = True
            segment_start_time = timestamp

        elif not is_level and in_level_segment:
            if segment_start_time is not None:
                duration_sec = (timestamp - segment_start_time).total_seconds()
                if duration_sec >= 30:
                    level_off_count += 1

            in_level_segment = False
            segment_start_time = None

    if in_level_segment and segment_start_time is not None:
        last_time = parse_time(points[-1].get("timestamp"))
        if last_time is not None:
            duration_sec = (last_time - segment_start_time).total_seconds()
            if duration_sec >= 30:
                level_off_count += 1

    return level_off_count


def classify_descent(level_off_count: int) -> str:
    if level_off_count == 0:
        return "CDO-like"
    if level_off_count <= 2:
        return "Partial CDO"
    return "Interrupted descent"


def compute_track_distance(points: List[Dict[str, Any]]) -> float:
    if len(points) < 2:
        return 0.0

    distance_nm = 0.0

    for previous, current in zip(points[:-1], points[1:]):
        lat1, lon1 = previous.get("lat"), previous.get("lon")
        lat2, lon2 = current.get("lat"), current.get("lon")

        if None in (lat1, lon1, lat2, lon2):
            continue

        distance_nm += haversine_nm(lat1, lon1, lat2, lon2)

    return distance_nm


def compute_duration_minutes(points: List[Dict[str, Any]]) -> float:
    if len(points) < 2:
        return 0.0

    start = parse_time(points[0].get("timestamp"))
    end = parse_time(points[-1].get("timestamp"))

    if start is None or end is None:
        return 0.0

    return max((end - start).total_seconds() / 60.0, 0.0)


def compute_efficiency_score(level_off_count: int, track_distance_nm: float, duration_min: float) -> float:
    """
    Prototype score, 0-100.
    Higher is better.

    Penalizes:
    - level-offs
    - very long observed paths
    - long observed duration

    This is not a certified operational metric.
    """
    score = 100.0
    score -= level_off_count * 12.0
    score -= max(track_distance_nm - 250.0, 0.0) * 0.03
    score -= max(duration_min - 60.0, 0.0) * 0.2

    return round(max(min(score, 100.0), 0.0), 1)


def process_one_file(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    flight_id = str(data.get("id") or path.stem)
    fpl = data.get("fpl") or {}

    fpl_base = (fpl.get("fpl_base") or [{}])[0]
    fpl_arr = fpl.get("fpl_arr") or []
    fpl_clearance = fpl.get("fpl_clearance") or []
    fpl_plan_update = fpl.get("fpl_plan_update") or []
    fpl_holding = fpl.get("fpl_holding") or []

    callsign = fpl_base.get("callsign")
    aircraft_type = fpl_base.get("aircraft_type")
    origin = fpl_base.get("adep")
    destination = fpl_base.get("ades")
    wake_category = fpl_base.get("wtc")

    arrival_runway = get_last_non_null(fpl_arr, "arrival_runway")
    star = get_last_non_null(fpl_arr, "star")
    approach_clearance_time = get_first_true_time(fpl_arr, "approach_clearance")

    holding_status = get_last_non_null(fpl_holding, "holding_status")

    points = []

    for plot_index, plot in enumerate(data.get("plots") or []):
        timestamp = plot.get("time_of_track")
        position = plot.get("I062/105") or {}
        lat = position.get("lat")
        lon = position.get("lon")

        measured_flight_level = safe_get_plot_value(plot, "I062/136", "measured_flight_level")
        altitude_ft = measured_flight_level * 100 if measured_flight_level is not None else None

        vx = safe_get_plot_value(plot, "I062/185", "vx")
        vy = safe_get_plot_value(plot, "I062/185", "vy")

        groundspeed_mps = None
        groundspeed_kt = None

        if vx is not None and vy is not None:
            groundspeed_mps = math.sqrt(vx**2 + vy**2)
            groundspeed_kt = groundspeed_mps * 1.94384

        vertical_rate_fpm = safe_get_plot_value(plot, "I062/220", "rocd")

        mode_s = extract_mode_s(plot)

        distance_to_essa_nm = None
        if lat is not None and lon is not None:
            distance_to_essa_nm = haversine_nm(lat, lon, ESSA_LAT, ESSA_LON)

        points.append(
            {
                "flight_id": flight_id,
                "plot_index": plot_index,
                "timestamp": timestamp,
                "lat": lat,
                "lon": lon,
                "measured_flight_level": measured_flight_level,
                "altitude_ft": altitude_ft,
                "vx": vx,
                "vy": vy,
                "groundspeed_mps": groundspeed_mps,
                "groundspeed_kt": groundspeed_kt,
                "vertical_rate_fpm": vertical_rate_fpm,
                "ias": mode_s["ias"],
                "mach": mode_s["mach"],
                "mag_heading": mode_s["mag_heading"],
                "baro_vertical_rate": mode_s["baro_vertical_rate"],
                "selected_altitude": mode_s["selected_altitude"],
                "distance_to_essa_nm": distance_to_essa_nm,
            }
        )

    points = sorted(points, key=lambda p: p.get("timestamp") or "")

    track_distance_nm = compute_track_distance(points)
    duration_min = compute_duration_minutes(points)
    level_off_count = estimate_level_off_count(points)
    descent_class = classify_descent(level_off_count)
    efficiency_score = compute_efficiency_score(level_off_count, track_distance_nm, duration_min)

    estimated_fuel_kg_proxy = round((track_distance_nm * 2.8) + (level_off_count * 45.0), 1)
    estimated_co2_kg_proxy = round(estimated_fuel_kg_proxy * 3.16, 1)

    first_timestamp = points[0]["timestamp"] if points else None
    last_timestamp = points[-1]["timestamp"] if points else None

    flight_record = {
        "flight_id": flight_id,
        "callsign": callsign,
        "aircraft_type": aircraft_type,
        "origin": origin,
        "destination": destination,
        "wake_category": wake_category,
        "arrival_runway": arrival_runway,
        "star": star,
        "approach_clearance_time": approach_clearance_time,
        "holding_status": holding_status,
        "first_timestamp": first_timestamp,
        "last_timestamp": last_timestamp,
        "n_points": len(points),
        "n_clearance_events": len(fpl_clearance),
        "n_route_updates": len(fpl_plan_update),
        "track_distance_nm": round(track_distance_nm, 2),
        "duration_min": round(duration_min, 2),
        "level_off_count": level_off_count,
        "descent_class": descent_class,
        "efficiency_score": efficiency_score,
        "estimated_fuel_kg_proxy": estimated_fuel_kg_proxy,
        "estimated_co2_kg_proxy": estimated_co2_kg_proxy,
    }

    return {
        "flight": flight_record,
        "trajectory": points,
    }


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    json_files = sorted(RAW_DIR.glob("*.json"))

    if not json_files:
        raise FileNotFoundError(f"No JSON files found in {RAW_DIR}")

    flights = []
    trajectories = {}

    print(f"Found {len(json_files)} JSON files")

    for path in json_files:
        print(f"Processing {path.name}")
        result = process_one_file(path)

        flight = result["flight"]
        trajectory = result["trajectory"]

        flights.append(flight)
        trajectories[flight["flight_id"]] = trajectory

    summary = {
        "n_flights": len(flights),
        "total_points": sum(f["n_points"] for f in flights),
        "runways": sorted(list({f["arrival_runway"] for f in flights if f["arrival_runway"]})),
        "aircraft_types": sorted(list({f["aircraft_type"] for f in flights if f["aircraft_type"]})),
        "descent_classes": sorted(list({f["descent_class"] for f in flights if f["descent_class"]})),
        "total_estimated_fuel_kg_proxy": round(sum(f["estimated_fuel_kg_proxy"] for f in flights), 1),
        "total_estimated_co2_kg_proxy": round(sum(f["estimated_co2_kg_proxy"] for f in flights), 1),
    }

    with (PROCESSED_DIR / "flights.json").open("w", encoding="utf-8") as file:
        json.dump(flights, file, indent=2)

    with (PROCESSED_DIR / "trajectories.json").open("w", encoding="utf-8") as file:
        json.dump(trajectories, file, indent=2)

    with (PROCESSED_DIR / "summary.json").open("w", encoding="utf-8") as file:
        json.dump(summary, file, indent=2)

    print("\nProcessing complete")
    print(f"Flights saved to: {PROCESSED_DIR / 'flights.json'}")
    print(f"Trajectories saved to: {PROCESSED_DIR / 'trajectories.json'}")
    print(f"Summary saved to: {PROCESSED_DIR / 'summary.json'}")
    print("\nSummary:")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
    