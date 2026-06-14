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

### Final Processed Dataset

| Item | Value |
|---|---:|
| Airport | Stockholm Arlanda Airport / ESSA |
| Traffic type | Arrival flights only |
| Final flights | 407 |
| Trajectory points | 201,950 |
| OpenAP estimates | 319 flights |
| Fallback estimates | 88 flights |
| Weather records | 192 hourly records |

### Why This Dataset Was Chosen

The SCAT ADS-B dataset was selected because it provides real aircraft trajectory data for the Stockholm region. This makes it suitable for aviation research involving:

- arrival path reconstruction,
- descent behaviour analysis,
- runway-arrival flow analysis,
- environmental estimation,
- and dashboard-based trajectory visualization.

The project focuses only on arrivals because arrival procedures are directly related to descent efficiency, level-off behaviour, runway sequencing, CDO analysis, and terminal-area emissions.

### Dataset Limitations

The dataset is suitable for research prototyping and exploratory analysis, but it has limitations:

- it does not represent all possible ESSA operations,
- ADS-B data may contain gaps or incomplete fields,
- aircraft mass and detailed airline operational data are not available,
- weather is used as contextual information rather than full atmospheric modelling,
- and environmental values are model-based estimates, not certified airline fuel records.

### Citation Guidance

Users of this repository should cite the original SCAT ADS-B dataset when reusing or discussing the data source.

Recommended dataset citation format:

```text
SCAT ADS-B Dataset, Mendeley Data.
Available at: https://data.mendeley.com/datasets/8yn985bwz5/1

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
