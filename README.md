# Arlanda Arrival Optimization Dashboard

Interactive aviation research dashboard for analyzing Stockholm Arlanda Airport arrival trajectories, descent efficiency, fuel estimation, CO₂ emissions, weather context, and arrival-operation indicators.

This project is a research prototype built from real flight trajectory JSON files. It is designed to support exploratory analysis of arrival procedures, Continuous Descent Operations (CDO)-style behavior, environmental performance, and future arrival optimization workflows.



## 1. Project Objective

The purpose of this project is to develop an end-to-end aviation data system that converts raw operational flight JSON files into an interactive dashboard for Stockholm Arlanda Airport arrivals.

The system supports:

- flight trajectory reconstruction
- animated aircraft movement on a map
- multi-flight time-window visualization
- altitude-colored trajectory display
- altitude, speed, and vertical-rate charts
- CDO / level-off analysis
- fuel and CO₂ estimation
- OpenAP-based environmental modelling where available
- fallback proxy environmental estimation where OpenAP fails
- historical surface weather context
- runway wind component interpretation
- flight comparison and filtering

The current dataset contains 10 flight JSON files and is used as a proof-of-concept dataset.



## 2. Technology Stack

### Backend

- Python
- FastAPI
- Uvicorn

### Frontend

- React
- Vite
- Tailwind CSS
- Leaflet / React Leaflet
- Recharts

### Data Processing

- Python scripts
- JSON processing
- OpenAP
- Open-Meteo Historical Weather API

---

## 3. System Architecture

Raw JSON flight files
        ↓
Python processing scripts
        ↓
Processed JSON files
        ↓
FastAPI backend
        ↓
React dashboard
        ↓
Interactive map, animation, charts, metrics, weather, and comparison tools

## 4. Repository Structure

arlanda-airport-arrival-dashboard/
│
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── data_loader.py
│       └── main.py
│
├── data/
│   ├── raw/
│   │   └── json_flights/
│   │       ├── 400002.json
│   │       ├── 400003.json
│   │       └── ...
│   │
│   └── processed/
│       ├── flights.json
│       ├── trajectories.json
│       ├── summary.json
│       ├── openap_metrics.json
│       └── weather_hourly.json
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── services/
│       │   └── api.js
│       └── components/
│           ├── FlightMap.jsx
│           ├── TrajectoryCharts.jsx
│           ├── FlightComparison.jsx
│           ├── WeatherPanel.jsx
│           └── MethodologyPanel.jsx
│
├── scripts/
│   ├── process_flights.py
│   ├── estimate_openap.py
│   └── fetch_weather.py
│
├── README.md
└── .gitignore

## 5. Input Data

The raw data consists of JSON files, where each file represents one flight.

Each JSON file may contain:

flight ID
callsign
aircraft type
origin airport
destination airport
arrival runway
STAR
wake category
controller clearances
route updates
timestamped trajectory plots
latitude and longitude
measured flight level
velocity components
vertical rate
Mode-S / surveillance-derived speed and heading fields where available

The current dataset includes 10 flights into Stockholm Arlanda Airport.

## 6. Processed Data Outputs
flights.json

One row per flight, including metadata and derived metrics.

Example fields:

flight_id
callsign
aircraft_type
arrival_runway
star
track_distance_nm
duration_min
level_off_count
descent_class
efficiency_score
estimated_fuel_kg_proxy
estimated_co2_kg_proxy
trajectories.json

Point-by-point trajectory data for each flight.

Example fields:

timestamp
lat
lon
altitude_ft
groundspeed_kt
vertical_rate_fpm
distance_to_essa_nm
openap_metrics.json

Fuel and CO₂ estimates.

The project uses:

OpenAP where a valid aircraft-performance estimate is available
fallback proxy where OpenAP fails or is unsuitable

Example fields:

estimated_fuel_kg_openap
estimated_co2_kg_openap
final_fuel_kg
final_co2_kg
environmental_method
environmental_status
assumed_mass_kg
openap_aircraft_type
weather_hourly.json

Hourly surface weather for Stockholm Arlanda from Open-Meteo.

Example fields:

temperature_2m_c
surface_pressure_hpa
wind_speed_10m
wind_direction_10m_deg
precipitation_mm
cloud_cover_percent

## 7. Metrics and Methodology
Track Distance

Track distance is calculated from latitude and longitude points using the Haversine formula.

Groundspeed

Groundspeed is derived from radar velocity components:

groundspeed = sqrt(vx² + vy²)
Altitude

Measured flight level is converted to feet:

altitude_ft = measured_flight_level × 100
Level-Off Detection

A level-off is detected when:

absolute vertical rate <= 300 ft/min
for at least 30 seconds

This is a prototype rule used for CDO-style analysis.

Descent Classification

Flights are classified as:

0 level-offs      → CDO-like
1–2 level-offs    → Partial CDO
>2 level-offs     → Interrupted descent
Efficiency Score

The efficiency score is a prototype metric from 0 to 100.

It penalizes:

level-off count
long observed track distance
long observed duration

This is not a certified operational metric.

Fuel and CO₂

The project includes two environmental-estimation methods:

OpenAP fuel-flow estimate
fallback distance/level-off proxy

Final CO₂ is calculated as:

CO₂ kg = fuel kg × 3.16

Fuel and CO₂ values are estimated, not measured.

## 8. Weather Methodology

Historical weather is fetched from the Open-Meteo Historical Weather API for Stockholm Arlanda coordinates.

The current weather layer includes surface weather only:

temperature
pressure
10 m wind speed
10 m wind direction
precipitation
cloud cover

The dashboard matches each flight to the nearest hourly weather record using approach clearance time, last timestamp, or first timestamp.

This does not include wind or temperature at aircraft altitude. Future work should add ERA5 pressure-level weather.

## 9. Dashboard Features

The dashboard includes:

KPI summary cards
research-prototype status banner
flight selector
filters by runway, aircraft type, descent class, and efficiency score
animated Leaflet flight map
multi-flight time-window display
time slider and play/pause control
altitude-colored selected trajectory
aircraft heading rotation
selected-flight details
OpenAP / fallback environmental method display
weather context panel
runway wind component calculation
altitude, speed, and vertical-rate charts
flight comparison table
methodology and assumptions panel

## 10. Running the Project
10.1 Run Data Processing

From the project root:

python scripts/process_flights.py
python scripts/estimate_openap.py
python scripts/fetch_weather.py
10.2 Run Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Backend API:

http://localhost:8000

Important endpoints:

/api/summary
/api/flights
/api/flights/{flight_id}
/api/flights/{flight_id}/trajectory
/docs
10.3 Run Frontend

Open a second terminal:

cd frontend
npm install
npm run dev -- --host 0.0.0.0

Frontend:

http://localhost:5173

In GitHub Codespaces, open the forwarded ports for:

8000  → backend
5173  → frontend

## 11. Current Dataset Status

The current dataset contains:

10 flights
5,341 trajectory points
runways: 19L, 19R, 26
aircraft types including A319, A320, B736, B737, B738, F50, SF34
OpenAP estimates for 8 flights
fallback proxy estimates for 2 flights
historical weather for four dates

This is suitable for:

proof-of-concept development
dashboard demonstration
exploratory trajectory analysis
workflow validation

It is not sufficient for:

statistical conclusions
machine learning models
publication-quality operational claims
robust optimization conclusions

## 12. Research Limitations

Main limitations:

only 10 flights
flights are spread across several dates
limited same-time traffic overlap
aircraft mass is assumed
true airspeed is approximated from groundspeed
wind aloft is not included
fuel burn is estimated, not measured
OpenAP does not produce valid estimates for all aircraft types
runway/STAR procedure geometry is not fully modelled yet
no full arrival-manager or ATC separation model yet

## 13. Future Work

Recommended next steps:

scale dataset to 50–100 flights for exploratory analysis
scale to 200–500 flights for stronger master's-level analysis
collect same-hour arrival banks for sequencing optimization
add ERA5 pressure-level weather
add official STAR and runway threshold geometry
add OpenAP sensitivity analysis for aircraft mass
add simplified MIP optimization module
add SQLite or PostgreSQL/PostGIS storage
add deployment configuration
add optional LLM explanation panel

## 14. Research Positioning

This project is best described as:
A full-stack aviation research prototype for trajectory-based arrival efficiency and environmental-performance analysis at Stockholm Arlanda Airport.

It demonstrates how real flight trajectory JSON data can be transformed into an interactive decision-support dashboard for CDO-style analysis, fuel/CO₂ estimation, weather context, and future arrival optimization.
