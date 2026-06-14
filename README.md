# LLM-Enhanced Stockholm Arlanda Arrival Optimization Dashboard

![Research](https://img.shields.io/badge/Research-Air%20Traffic%20Management-blue)
![Airport](https://img.shields.io/badge/Airport-Stockholm%20Arlanda%20%2F%20ESSA-cyan)
![Data](https://img.shields.io/badge/Data-ADS--B%20Trajectories-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Model](https://img.shields.io/badge/Environmental%20Model-OpenAP-orange)
![LLM](https://img.shields.io/badge/LLM-Q%26A%20Assistant-violet)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A research-oriented aviation analytics dashboard for studying arrival operations at **Stockholm Arlanda Airport (ESSA)** using ADS-B trajectory data, environmental modelling, operational analytics, and an LLM-assisted explanation layer.

The project investigates how aircraft arrival trajectories can be analysed to support environmental and operational efficiency assessment in terminal airspace. It combines trajectory reconstruction, OpenAP-based fuel and CO₂ estimation, weather context, runway-flow analysis, CDO-style scenario testing, interactive visualization, and natural-language dashboard explanation.

This repository is designed as a serious aviation analytics portfolio project for review by aviation researchers, air traffic management specialists, environmental analysts, software engineers, and future contributors.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Research Motivation](#research-motivation)
- [Research Objectives](#research-objectives)
- [Dataset Description](#dataset-description)
- [Methodology Overview](#methodology-overview)
- [System Architecture](#system-architecture)
- [Dashboard Features](#dashboard-features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Installation and Setup](#installation-and-setup)
- [Running the Project](#running-the-project)
- [Data Processing Pipeline](#data-processing-pipeline)
- [Environmental Modelling](#environmental-modelling)
- [Key Results and Dataset Statistics](#key-results-and-dataset-statistics)
- [Research Contributions](#research-contributions)
- [Limitations](#limitations)
- [Future Work](#future-work)
- [References](#references)
- [Citation](#citation)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## Project Overview

This project is an interactive research dashboard for analysing aircraft arrivals at **Stockholm Arlanda Airport (ESSA)**.

The system processes ADS-B trajectory data and converts it into a complete aviation analytics workflow. It allows users to inspect arrival trajectories, compare flights, review runway and descent behaviour, estimate fuel consumption and CO₂ emissions, and explore simplified arrival-optimization scenarios.

The platform supports:

- flight trajectory reconstruction,
- arrival path analysis,
- runway and traffic-flow analytics,
- fuel-consumption estimation,
- CO₂-emissions estimation,
- weather-context integration,
- interactive map and chart visualization,
- CDO-style scenario analysis,
- and LLM-assisted explanation of dashboard outputs.

The dashboard is intended for research, portfolio demonstration, and exploratory analysis. It is **not** an operational air traffic control system and must not be used for real-time aviation decision-making.

---

## Research Motivation

Arrival operations are a major part of terminal airspace management. During arrival, aircraft may experience path stretching, vectoring, level-offs, runway sequencing constraints, and interrupted descent profiles. These operational factors can increase fuel consumption and CO₂ emissions.

Continuous Descent Operations (CDO) and improved arrival sequencing can reduce unnecessary level flight and support more efficient descent profiles. However, evaluating such concepts requires trajectory-level evidence.

This project uses real ADS-B arrival data to investigate:

- how arrival trajectories differ between flights,
- how descent behaviour can be classified,
- where level-offs and inefficient profiles appear,
- how runway usage and arrival flow vary,
- and how environmental indicators can be estimated and compared.

The dashboard provides an applied research environment where these factors can be inspected interactively.

---

## Research Objectives

The main objective of this project is to analyse ESSA arrival trajectories and identify environmental and operational efficiency indicators using ADS-B data.

Specific objectives include:

1. Reconstruct arrival trajectories from ADS-B position time series.
2. Filter and analyse flights arriving at Stockholm Arlanda Airport.
3. Compute flight-level trajectory and operational metrics.
4. Estimate fuel consumption and CO₂ emissions using OpenAP where possible.
5. Apply fallback proxy estimation where OpenAP modelling is not available.
6. Integrate weather context for selected arrivals.
7. Analyse runway usage, descent class, level-offs, and arrival-flow patterns.
8. Build an interactive dashboard for flight-level exploration.
9. Implement simplified CDO-style improvement and sensitivity scenarios.
10. Add an LLM-assisted Q&A layer to explain dashboard outputs and methodology.

---

## Dataset Description

### Dataset Source

The project uses ADS-B trajectory data from the SCAT dataset published on Mendeley:

**Dataset:** SCAT ADS-B Data  
**Source:** https://data.mendeley.com/datasets/8yn985bwz5/1  
**File used:** `scat20170107_20170113.zip`

The dataset contains aircraft trajectory records over the Stockholm airspace region. ADS-B data provides aircraft position and movement-related information over time, making it suitable for reconstructing flight paths and analysing operational behaviour.

### Dataset Filtering

The raw dataset contains multiple flight movements. For this project, the data was filtered to focus only on arrivals into Stockholm Arlanda Airport.

Processing logic:

```text
Raw SCAT ADS-B dataset
→ Load file scat20170107_20170113.zip
→ Extract flight trajectory records
→ Identify flights associated with ESSA
→ Retain arrival flights only
→ Exclude departure flights
→ Reconstruct arrival trajectories
→ Generate flight-level analytics dataset
```
### Final Processed Dataset
```text
| Item | Value |
|---|---:|
| Airport | Stockholm Arlanda Airport / ESSA |
| Traffic type | Arrival flights only |
| Final flights | 407 |
| Trajectory points | 201,950 |
| OpenAP estimates | 319 flights |
| Fallback estimates | 88 flights |
| Weather records | 192 hourly records |
```
### Why This Dataset Was Chosen
```text
The SCAT ADS-B dataset was selected because it provides real aircraft trajectory data for the Stockholm region. This makes it suitable for aviation research involving:

- arrival path reconstruction,
- descent behaviour analysis,
- runway-arrival flow analysis,
- environmental estimation,
- and dashboard-based trajectory visualization.

The project focuses only on arrivals because arrival procedures are directly related to descent efficiency, level-off behaviour, runway sequencing, CDO analysis, and terminal-area emissions.
```
### Dataset Limitations
```text
The dataset is suitable for research prototyping and exploratory analysis, but it has limitations:

- it does not represent all possible ESSA operations,
- ADS-B data may contain gaps or incomplete fields,
- aircraft mass and detailed airline operational data are not available,
- weather is used as contextual information rather than full atmospheric modelling,
- and environmental values are model-based estimates, not certified airline fuel records.
```
### Citation Guidance
```text
Users of this repository should cite the original SCAT ADS-B dataset when reusing or discussing the data source.

Recommended dataset citation format:
```
```text
SCAT ADS-B Dataset, Mendeley Data.
Available at: https://data.mendeley.com/datasets/8yn985bwz5/1
```
---

## Methodology Overview

The project follows a complete data-to-dashboard research pipeline.

Main stages:

1. **Data ingestion**  
   Load the SCAT ADS-B dataset file `scat20170107_20170113.zip`.

2. **Flight filtering**  
   Retain only flights arriving at Stockholm Arlanda Airport (ESSA).

3. **Departure exclusion**  
   Remove departure flights because the project focuses only on arrival procedures, descent behaviour, runway-arrival flow, and terminal-area environmental performance.

4. **Trajectory reconstruction**  
   Group ADS-B records by flight identifier and sort trajectory points chronologically to reconstruct each arrival path.

5. **Feature generation**  
   Compute flight-level indicators such as aircraft type, arrival runway, STAR or route label, track distance, duration, descent class, level-off count, fuel estimate, CO₂ estimate, and efficiency score.

6. **Environmental modelling**  
   Apply OpenAP-based fuel and CO₂ estimation where aircraft and trajectory data are compatible.

7. **Fallback estimation**  
   Apply fallback proxy estimation where OpenAP modelling is incomplete or unavailable, allowing all 407 arrival flights to remain in the analysis.

8. **Weather integration**  
   Attach surface weather context to selected flights where available, including temperature, pressure, wind speed, wind direction, cloud cover, and runway-relative wind components.

9. **Scenario analysis**  
   Estimate simplified CDO-style improvement potential by evaluating selected level-off reduction assumptions and their possible fuel and CO₂ effects.

10. **Dashboard visualization**  
    Present processed results through an interactive React dashboard with map, charts, filters, flight comparison, traffic-flow analysis, optimization panels, and methodology notes.

11. **LLM explanation layer**  
    Provide natural-language explanations of dashboard outputs, assumptions, limitations, and research methodology through the LLM Q&A assistant.
---

## System Architecture

The implemented system uses a backend/frontend architecture.

```text
ADS-B Dataset
    ↓
Python Data Processing
    ↓
Processed Flight Summary + Trajectory Outputs
    ↓
FastAPI Backend
    ↓
React + Vite Dashboard
    ↓
LLM-Assisted Analytics Assistant
```
---

## System Architecture

The implemented system uses a backend/frontend architecture.

```text
ADS-B Dataset
    ↓
Python Data Processing
    ↓
Processed Flight Summary + Trajectory Outputs
    ↓
FastAPI Backend
    ↓
React + Vite Dashboard
    ↓
LLM-Assisted Analytics Assistant
```

### Architecture Diagram

A future architecture figure can be added here:

```markdown
![System Architecture](docs/images/system-architecture.png)
```

Recommended diagram content:

```text
SCAT ADS-B Dataset
→ Python Processing Pipeline
→ OpenAP + Fallback Environmental Estimation
→ Processed Flight and Trajectory Outputs
→ FastAPI Backend
→ React Dashboard
→ LLM Q&A Assistant
```

For now, the implemented pipeline is represented below:

```text
+-----------------------------+
| SCAT ADS-B Dataset          |
| scat20170107_20170113.zip   |
+-------------+---------------+
              |
              v
+-----------------------------+
| Data Processing Pipeline    |
| Filtering, reconstruction,  |
| feature generation          |
+-------------+---------------+
              |
              v
+-----------------------------+
| Environmental Modelling     |
| OpenAP + fallback proxy     |
+-------------+---------------+
              |
              v
+-----------------------------+
| FastAPI Backend             |
| Summary, flights,           |
| trajectories, scenarios     |
+-------------+---------------+
              |
              v
+-----------------------------+
| React Dashboard             |
| Map, charts, analytics,     |
| weather, optimization       |
+-------------+---------------+
              |
              v
+-----------------------------+
| LLM Assistant               |
| Research explanation layer  |
+-----------------------------+
```

---

## Dashboard Features

The dashboard is divided into six research workspaces.

### 1. Mission Overview

Provides a high-level summary of the dataset and key research indicators.

Includes:

- number of flights,
- trajectory point count,
- average efficiency score,
- total fuel estimate,
- total CO₂ estimate,
- OpenAP coverage,
- research prototype status.

### 2. Flight Explorer

Allows interactive flight-level inspection.

Features:

- horizontal flight selector,
- search and filter controls,
- interactive trajectory map,
- selected-flight metrics,
- time-overlap traffic context,
- paginated flight-comparison table.

### 3. Trajectory & Weather

Displays detailed flight-profile analysis for the selected arrival.

Includes:

- altitude profile,
- speed profile,
- vertical-rate profile,
- CDO and level-off context,
- surface weather metrics,
- runway-relative wind component information.

### 4. Traffic Flow

Supports operational scenario filtering.

Users can filter by:

- date,
- hour block,
- runway.

The tab summarizes:

- runway mix,
- descent mix,
- OpenAP/fallback mix,
- total fuel,
- total CO₂,
- high-emission flights,
- selected-scenario arrival performance.

### 5. Optimization Lab

Provides research-oriented optimization analysis.

Includes:

- optimization candidate ranking,
- simplified CDO improvement scenario,
- CDO sensitivity analysis.

The CDO scenario estimates potential fuel and CO₂ savings if selected level-offs could be reduced under simplified research assumptions.

### 6. Research & LLM Q&A

Provides final methodology documentation and an LLM-assisted explanation layer.

Includes:

- dataset definition,
- processing pipeline,
- environmental modelling notes,
- analytical framework,
- system architecture,
- AI assistant limitations,
- natural-language dashboard Q&A.

---

## Dashboard Screenshots

The dashboard is organized into six research workspaces. Add final screenshots after deployment.

### Mission Overview

![Mission Overview](docs/images/mission-overview.png)

### Flight Explorer

![Flight Explorer](docs/images/flight-explorer.png)

### Trajectory & Weather

![Trajectory and Weather](docs/images/trajectory-weather.png)

### Traffic Flow

![Traffic Flow](docs/images/traffic-flow.png)

### Optimization Lab

![Optimization Lab](docs/images/optimization-lab.png)

### Research & LLM Q&A

![Research and LLM Q&A](docs/images/research-llm-qa.png)

Recommended screenshot files:

```text
docs/images/mission-overview.png
docs/images/flight-explorer.png
docs/images/trajectory-weather.png
docs/images/traffic-flow.png
docs/images/optimization-lab.png
docs/images/research-llm-qa.png
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Data processing | Python |
| Trajectory analysis | pandas, numerical processing |
| Environmental modelling | OpenAP + fallback proxy estimation |
| Backend API | FastAPI |
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Mapping | Leaflet / OpenStreetMap |
| Charts | Recharts |
| Weather context | Weather API integration |
| LLM assistant | Groq API with Llama model |
| Frontend deployment | Vercel |
| Backend deployment | Render |

---

## Repository Structure

The repository is organized as a full-stack aviation research dashboard.

```text
arlanda-airport-arrival-dashboard/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── ...
│   ├── data/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── ...
│
├── docs/
│   └── images/
│
├── README.md
└── ...
```

The exact folder contents may vary depending on local data availability and deployment configuration.

---

## Installation and Setup

### Prerequisites

Install the following:

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- Git

Clone the repository:

```bash
git clone https://github.com/Zeeb270/arlanda-airport-arrival-dashboard.git
cd arlanda-airport-arrival-dashboard
```

---

## Running the Project

### Backend

From the repository root:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend should be available at:

```text
http://localhost:8000
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend should be available through the Vite development server.

### Build Frontend

```bash
cd frontend
npm run build
```

---

## Environment Variables

### Frontend

For deployment:

```text
VITE_API_BASE_URL=https://arlanda-arrival-api.onrender.com
```

For local development:

```text
VITE_API_BASE_URL=http://localhost:8000
```

### Backend LLM Assistant

```text
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

The LLM assistant is optional for dashboard data visualization, but required for natural-language Q&A.

---

## Deployment

Final deployment links:

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://arlanda-airport-arrival-dashboard.vercel.app/ |
| Backend | Render | https://arlanda-arrival-api.onrender.com |

---
## Data Processing Pipeline

The implemented processing pipeline converts ADS-B records into dashboard-ready aviation analytics.

```text
1. Download SCAT ADS-B dataset
2. Extract scat20170107_20170113.zip
3. Load raw trajectory records
4. Filter ESSA arrival flights
5. Exclude departure flights
6. Group records by flight identifier
7. Sort trajectory points by timestamp
8. Reconstruct arrival trajectories
9. Compute flight distance and duration
10. Detect descent and level-off behaviour
11. Estimate fuel consumption
12. Estimate CO₂ emissions
13. Attach weather context
14. Generate dashboard datasets
15. Serve analytics through FastAPI
```

Generated indicators include:

- callsign,
- aircraft type,
- origin,
- destination,
- runway,
- STAR or route label,
- trajectory distance,
- arrival duration,
- descent class,
- level-off count,
- fuel estimate,
- CO₂ estimate,
- environmental-estimation method,
- efficiency score.

---

## Environmental Modelling

### OpenAP-Based Estimation

The project uses [OpenAP](https://openap.dev/) for aircraft performance and environmental estimation where compatible trajectory and aircraft-type information is available.

OpenAP is used to estimate:

- fuel consumption,
- CO₂ emissions.

In simple terms, OpenAP helps estimate how much fuel an aircraft may burn based on aircraft type and flight behaviour. The dashboard uses these estimates to compare arrival flights and identify environmentally significant patterns.

### Fallback Proxy Estimation

OpenAP cannot always be applied to every flight. Some flights may have incomplete information, unsupported aircraft types, or trajectory limitations. To avoid removing these flights from the analysis, the project uses fallback proxy estimation.

This approach keeps the full 407-flight dataset in the dashboard while clearly distinguishing between:

- OpenAP-based estimates,
- fallback proxy estimates.

### CO₂ Conversion

For scenario analysis, estimated fuel saving is converted into CO₂ saving using:

```text
CO₂ saving = fuel saving × 3.16
```

This conversion is used for comparative research analysis and simplified CDO scenario evaluation.

---

## Key Results and Dataset Statistics

The current implemented dataset contains:

| Metric | Value |
|---|---:|
| Arrival flights | 407 |
| Trajectory points | 201,950 |
| OpenAP estimates | 319 |
| Fallback estimates | 88 |
| Weather records | 192 |
| OpenAP coverage | 78.4% |
| Total final fuel estimate | 523,516.32 kg |
| Total final CO₂ estimate | 1,654,311.44 kg |
| Average efficiency score | 76.04 |

The CDO-style scenario analysis estimates potential improvement for flights with reducible level-offs. These values are research estimates and depend on simplified assumptions.

---
## Research Contributions

This project contributes an applied aviation analytics workflow for arrival-performance research.

Main contributions:

1. A complete ADS-B processing pipeline for ESSA arrival flights.
2. A final filtered dataset of 407 Stockholm Arlanda arrival flights.
3. Flight-level trajectory reconstruction and operational metric generation.
4. OpenAP-based fuel and CO₂ estimation with fallback proxy handling.
5. Interactive visualization of arrival trajectories and flight profiles.
6. Weather-context integration for selected arrivals.
7. Runway and arrival-flow scenario analysis.
8. CDO-style improvement and sensitivity simulation.
9. LLM-assisted explanation of aviation analytics results.
10. A deployed full-stack research dashboard suitable for portfolio and research review.

---

## Limitations

This project is a research prototype. The following limitations apply:

- The dataset contains 407 processed ESSA arrival flights, not all possible airport operations.
- The analysis is based on ADS-B data and derived indicators.
- Aircraft mass, airline operational fuel data, and detailed clearance information are not available.
- OpenAP estimates depend on aircraft type and trajectory compatibility.
- Fallback proxy estimates are approximate.
- Weather information is used as contextual surface-weather data.
- Wind aloft and full atmospheric modelling are not included.
- The CDO scenario does not model separation minima, controller workload, runway capacity, pilot instructions, or full aircraft energy management.
- The LLM assistant explains dashboard results but does not produce operational aviation instructions.

---

## Future Work

Potential future extensions include:

- expanding the dataset to additional days or airports,
- validating emissions estimates against more detailed fuel-burn models,
- improving weather integration with wind-aloft data,
- adding aircraft mass estimation,
- modelling arrival sequencing constraints,
- adding runway-capacity and separation constraints,
- comparing conventional arrivals with published CDO procedures,
- adding controller workload indicators if suitable data becomes available,
- improving the LLM assistant with retrieval over project documentation,
- and packaging the processing pipeline for reproducible research.

---

## References

- SCAT ADS-B Dataset, Mendeley Data:  
  https://data.mendeley.com/datasets/8yn985bwz5/1

- OpenAP Aircraft Performance Model:  
  https://openap.dev/

- Stockholm Arlanda Airport / ESSA information:  
  https://www.swedavia.com/arlanda/

- OpenStreetMap:  
  https://www.openstreetmap.org/

- FastAPI:  
  https://fastapi.tiangolo.com/

- React:  
  https://react.dev/

---

## Citation

If you use this repository, dashboard, or methodology in academic or research work, please cite the repository and the original dataset.

Suggested repository citation:

```text
Bukhari, S. M. Z. (2026). LLM-Assisted Stockholm Arlanda Arrival Optimization Dashboard:
ADS-B Trajectory Analysis, Environmental Modelling, and ATM Research Visualization.
GitHub repository: https://github.com/Zeeb270/arlanda-airport-arrival-dashboard
```

Suggested dataset citation:

```text
SCAT ADS-B Dataset, Mendeley Data.
Available at: https://data.mendeley.com/datasets/8yn985bwz5/1
```

---

## Acknowledgements

This project uses real ADS-B trajectory data from the SCAT dataset and environmental modelling concepts supported by OpenAP. The dashboard also uses open-source web technologies including FastAPI, React, Vite, Leaflet, OpenStreetMap, and Recharts.

The project was developed as an aviation analytics portfolio project focused on air traffic management, environmental performance, and interactive research visualization.

---

## License

This repository is released under the MIT License.

The MIT License applies to the source code in this repository. Dataset usage remains subject to the terms and citation requirements of the original dataset provider. Users are responsible for checking the license and citation requirements of the SCAT ADS-B dataset before redistributing or reusing the data.

```text
MIT License

Copyright (c) 2026 Syed Muhammad Zeeshan Bukhari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, subject to the conditions of the MIT License.
```

---

## Disclaimer

This project is for research, education, and portfolio demonstration only. It is not certified for operational aviation use and must not be used for real-time air traffic control, flight planning, aircraft separation, safety-critical decision-making, or regulatory compliance.
