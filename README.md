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
