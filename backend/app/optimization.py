from typing import Any, Dict, List

from app.data_loader import load_flights


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize(value: float, minimum: float, maximum: float) -> float:
    if maximum <= minimum:
        return 0.0

    score = (value - minimum) / (maximum - minimum)
    return max(0.0, min(score, 1.0))


def build_reason_list(flight: Dict[str, Any], co2_score: float, distance_score: float) -> List[str]:
    reasons = []

    descent_class = flight.get("descent_class")
    level_off_count = safe_float(flight.get("level_off_count"))
    efficiency_score = safe_float(flight.get("efficiency_score"), default=100.0)
    environmental_method = flight.get("environmental_method")

    if descent_class == "Interrupted descent":
        reasons.append("Interrupted descent profile")

    if descent_class == "Partial CDO":
        reasons.append("Partial CDO with potential for smoother descent")

    if level_off_count >= 3:
        reasons.append(f"{int(level_off_count)} detected level-offs")

    if efficiency_score < 60:
        reasons.append("Low arrival-efficiency score")

    if co2_score >= 0.75:
        reasons.append("High CO₂ estimate relative to dataset")

    if distance_score >= 0.75:
        reasons.append("Long observed track distance relative to dataset")

    if environmental_method == "Fallback proxy":
        reasons.append("Fallback environmental estimate requires review")

    if not reasons:
        reasons.append("Moderate optimization potential based on combined indicators")

    return reasons


def suggested_improvement(flight: Dict[str, Any]) -> str:
    descent_class = flight.get("descent_class")
    level_off_count = safe_float(flight.get("level_off_count"))
    environmental_method = flight.get("environmental_method")

    if descent_class == "Interrupted descent" and level_off_count >= 3:
        return (
            "Evaluate CDO opportunity and arrival sequencing context. "
            "This flight may benefit from smoother vertical planning or reduced level-off time."
        )

    if descent_class == "Partial CDO":
        return (
            "Compare against CDO-like arrivals with similar aircraft type and runway. "
            "Assess whether speed management or earlier descent planning could reduce interruptions."
        )

    if environmental_method == "Fallback proxy":
        return (
            "Review aircraft performance coverage and validate environmental estimate before using this flight "
            "for optimization conclusions."
        )

    return (
        "Inspect trajectory and scenario context to determine whether minor descent-efficiency improvements "
        "are feasible."
    )


def compute_candidate_score(
    flight: Dict[str, Any],
    co2_min: float,
    co2_max: float,
    distance_min: float,
    distance_max: float,
) -> Dict[str, Any]:
    co2 = safe_float(flight.get("final_co2_kg"))
    distance = safe_float(flight.get("track_distance_nm"))
    level_off_count = safe_float(flight.get("level_off_count"))
    efficiency_score = safe_float(flight.get("efficiency_score"), default=100.0)

    co2_score = normalize(co2, co2_min, co2_max)
    distance_score = normalize(distance, distance_min, distance_max)
    low_efficiency_score = 1.0 - normalize(efficiency_score, 0.0, 100.0)

    level_off_score = min(level_off_count / 6.0, 1.0)

    descent_penalty = 0.0
    if flight.get("descent_class") == "Interrupted descent":
        descent_penalty = 1.0
    elif flight.get("descent_class") == "Partial CDO":
        descent_penalty = 0.5

    fallback_penalty = 1.0 if flight.get("environmental_method") == "Fallback proxy" else 0.0

    weighted_score = (
        0.30 * co2_score
        + 0.25 * low_efficiency_score
        + 0.20 * level_off_score
        + 0.15 * descent_penalty
        + 0.07 * distance_score
        + 0.03 * fallback_penalty
    )

    priority_score = round(weighted_score * 100, 1)

    reasons = build_reason_list(flight, co2_score, distance_score)

    return {
        "flight_id": flight.get("flight_id"),
        "callsign": flight.get("callsign"),
        "aircraft_type": flight.get("aircraft_type"),
        "arrival_runway": flight.get("arrival_runway"),
        "star": flight.get("star"),
        "descent_class": flight.get("descent_class"),
        "level_off_count": flight.get("level_off_count"),
        "efficiency_score": flight.get("efficiency_score"),
        "track_distance_nm": flight.get("track_distance_nm"),
        "final_fuel_kg": flight.get("final_fuel_kg"),
        "final_co2_kg": flight.get("final_co2_kg"),
        "environmental_method": flight.get("environmental_method"),
        "priority_score": priority_score,
        "reasons": reasons,
        "suggested_improvement": suggested_improvement(flight),
    }


def load_optimization_candidates(limit: int = 25) -> Dict[str, Any]:
    flights = load_flights()

    valid_flights = [
        flight for flight in flights
        if flight.get("flight_id") is not None
    ]

    co2_values = [safe_float(flight.get("final_co2_kg")) for flight in valid_flights]
    distance_values = [safe_float(flight.get("track_distance_nm")) for flight in valid_flights]

    co2_min = min(co2_values) if co2_values else 0.0
    co2_max = max(co2_values) if co2_values else 0.0
    distance_min = min(distance_values) if distance_values else 0.0
    distance_max = max(distance_values) if distance_values else 0.0

    candidates = [
        compute_candidate_score(
            flight=flight,
            co2_min=co2_min,
            co2_max=co2_max,
            distance_min=distance_min,
            distance_max=distance_max,
        )
        for flight in valid_flights
    ]

    candidates = sorted(
        candidates,
        key=lambda candidate: candidate["priority_score"],
        reverse=True,
    )

    top_candidates = candidates[:limit]

    return {
        "method": {
            "name": "Rule-based optimization candidate scoring",
            "description": (
                "Flights are ranked using normalized CO₂, low efficiency score, level-off count, "
                "descent class, track distance, and environmental-method reliability."
            ),
            "score_weights": {
                "co2": 0.30,
                "low_efficiency": 0.25,
                "level_offs": 0.20,
                "descent_class": 0.15,
                "track_distance": 0.07,
                "fallback_method": 0.03,
            },
            "limitations": (
                "This is a research prioritization score, not an operational ATC optimization decision. "
                "It identifies candidates for further scenario analysis and CDO-improvement simulation."
            ),
        },
        "total_flights_scored": len(candidates),
        "returned_candidates": len(top_candidates),
        "candidates": top_candidates,
    }