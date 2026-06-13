import json
from typing import Any, Dict

from app.data_loader import load_flights, load_summary
from app.llm_client import (
    LlmConfigurationError,
    LlmProviderError,
    generate_llm_answer,
)
from app.optimization import (
    load_cdo_improvement_simulation,
    load_cdo_sensitivity_analysis,
    load_optimization_candidates,
)


MAX_QUESTION_LENGTH = 1200


def safe_number(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def build_dashboard_context() -> Dict[str, Any]:
    summary = load_summary()
    candidates = load_optimization_candidates(limit=5)
    cdo_simulation = load_cdo_improvement_simulation(limit=5)
    sensitivity = load_cdo_sensitivity_analysis()
    flights = load_flights()

    top_co2_flights = sorted(
        flights,
        key=lambda flight: safe_number(flight.get("final_co2_kg")),
        reverse=True,
    )[:5]

    least_efficient_flights = sorted(
        flights,
        key=lambda flight: safe_number(
            flight.get("efficiency_score"),
            default=100.0,
        ),
    )[:5]

    compact_top_co2 = [
        {
            "callsign": flight.get("callsign"),
            "aircraft_type": flight.get("aircraft_type"),
            "arrival_runway": flight.get("arrival_runway"),
            "descent_class": flight.get("descent_class"),
            "final_fuel_kg": flight.get("final_fuel_kg"),
            "final_co2_kg": flight.get("final_co2_kg"),
            "efficiency_score": flight.get("efficiency_score"),
        }
        for flight in top_co2_flights
    ]

    compact_least_efficient = [
        {
            "callsign": flight.get("callsign"),
            "aircraft_type": flight.get("aircraft_type"),
            "arrival_runway": flight.get("arrival_runway"),
            "descent_class": flight.get("descent_class"),
            "level_off_count": flight.get("level_off_count"),
            "efficiency_score": flight.get("efficiency_score"),
            "final_co2_kg": flight.get("final_co2_kg"),
        }
        for flight in least_efficient_flights
    ]

    cdo_summary = cdo_simulation.get("summary", {})
    sensitivity_range = sensitivity.get("sensitivity_range", {})
    sensitivity_scenarios = sensitivity.get("scenarios", [])

    compact_sensitivity = [
        {
            "scenario_name": row.get("scenario_name"),
            "saving_percent_per_level_off": row.get("saving_percent_per_level_off"),
            "max_saving_percent": row.get("max_saving_percent"),
            "affected_flights": row.get("affected_flights"),
            "fuel_saving_kg": row.get("fuel_saving_kg"),
            "fuel_saving_percent": row.get("fuel_saving_percent"),
            "co2_saving_kg": row.get("co2_saving_kg"),
            "co2_saving_percent": row.get("co2_saving_percent"),
        }
        for row in sensitivity_scenarios
    ]

    compact_candidates = [
        {
            "callsign": row.get("callsign"),
            "aircraft_type": row.get("aircraft_type"),
            "arrival_runway": row.get("arrival_runway"),
            "descent_class": row.get("descent_class"),
            "priority_score": row.get("priority_score"),
            "level_off_count": row.get("level_off_count"),
            "efficiency_score": row.get("efficiency_score"),
            "final_co2_kg": row.get("final_co2_kg"),
            "reasons": row.get("reasons"),
        }
        for row in candidates.get("candidates", [])[:5]
    ]

    compact_cdo_top_savings = [
        {
            "callsign": row.get("callsign"),
            "aircraft_type": row.get("aircraft_type"),
            "arrival_runway": row.get("arrival_runway"),
            "descent_class": row.get("descent_class"),
            "reducible_level_offs": row.get("reducible_level_offs"),
            "fuel_saving_kg": row.get("fuel_saving_kg"),
            "co2_saving_kg": row.get("co2_saving_kg"),
            "saving_percent": row.get("saving_percent"),
        }
        for row in cdo_simulation.get("top_flight_savings", [])[:5]
    ]

    return {
        "project": {
            "name": "Stockholm Arlanda Arrival Optimization Research Dashboard",
            "airport": "Stockholm Arlanda Airport / ESSA",
            "status": "research prototype, not operational ATC decision support",
        },
        "dataset_summary": {
            "flights": summary.get("n_flights"),
            "trajectory_points": summary.get("total_points"),
            "runways": summary.get("runways"),
            "openap_count": summary.get("openap_count"),
            "fallback_proxy_count": summary.get("fallback_proxy_count"),
            "total_final_fuel_kg": summary.get("total_final_fuel_kg"),
            "total_final_co2_kg": summary.get("total_final_co2_kg"),
        },
        "cdo_improvement_simulation": {
            "affected_flights": cdo_summary.get("affected_flights"),
            "total_flights": cdo_summary.get("total_flights"),
            "fuel_saving_kg": cdo_summary.get("fuel_saving_kg"),
            "fuel_saving_percent": cdo_summary.get("fuel_saving_percent"),
            "co2_saving_kg": cdo_summary.get("co2_saving_kg"),
            "co2_saving_percent": cdo_summary.get("co2_saving_percent"),
            "top_flight_savings": compact_cdo_top_savings,
        },
        "cdo_sensitivity_analysis": {
            "fuel_saving_min_kg": sensitivity_range.get("fuel_saving_min_kg"),
            "fuel_saving_max_kg": sensitivity_range.get("fuel_saving_max_kg"),
            "co2_saving_min_kg": sensitivity_range.get("co2_saving_min_kg"),
            "co2_saving_max_kg": sensitivity_range.get("co2_saving_max_kg"),
            "scenarios": compact_sensitivity,
        },
        "optimization_candidates": compact_candidates,
        "top_co2_flights": compact_top_co2,
        "least_efficient_flights": compact_least_efficient,
        "important_limitations": [
            "The dashboard is a research prototype.",
            "Fuel and CO₂ values are estimates based on OpenAP where available and fallback proxy methods otherwise.",
            "The CDO improvement simulation is simplified and does not model separation, runway capacity, wind aloft, pilot instructions, or controller workload directly.",
            "The AI assistant must explain the dashboard data but must not issue operational ATC instructions.",
        ],
    }


def build_assistant_prompt(question: str, dashboard_context: Dict[str, Any]) -> str:
    context_text = json.dumps(dashboard_context, indent=2, ensure_ascii=False)

    return f"""
You are an AI Aviation Analytics Assistant embedded in a research dashboard for Stockholm Arlanda Airport arrivals.

Rules:
- Answer only using the dashboard context below.
- Do not invent numbers or unsupported conclusions.
- Clearly say when information is not available in the context.
- Explain in plain English suitable for a supervisor or thesis/demo presentation.
- Distinguish research-prototype findings from operational ATC decisions.
- Do not provide live operational ATC instructions, clearances, or safety-critical recommendations.
- When discussing optimization, describe it as candidate identification or simplified scenario analysis.

Dashboard context:
{context_text}

User question:
{question}

Answer:
""".strip()


def ask_dashboard_assistant(question: str) -> Dict[str, Any]:
    cleaned_question = (question or "").strip()

    if not cleaned_question:
        return {
            "answer": "Please enter a question about the dashboard.",
            "source": "validation",
        }

    if len(cleaned_question) > MAX_QUESTION_LENGTH:
        return {
            "answer": (
                f"Please shorten the question. The maximum allowed length is "
                f"{MAX_QUESTION_LENGTH} characters."
            ),
            "source": "validation",
        }

    dashboard_context = build_dashboard_context()
    prompt = build_assistant_prompt(cleaned_question, dashboard_context)

    try:
        answer = generate_llm_answer(prompt)
        return {
            "answer": answer,
            "source": "llm",
        }
    except LlmConfigurationError:
        return {
            "answer": (
                "The AI assistant is not configured yet. Add GROQ_API_KEY to the backend "
                "environment variables and redeploy the backend."
            ),
            "source": "configuration_error",
        }
    except LlmProviderError as error:
        return {
            "answer": (
                "The AI provider could not generate an answer right now. "
                f"Provider error: {str(error)}"
            ),
            "source": "provider_error",
        }


if __name__ == "__main__":
    result = ask_dashboard_assistant(
        "Explain the CDO sensitivity analysis in simple terms."
    )
    print(result["answer"])