import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.analytics import load_analytics_summary
from app.data_loader import (
    get_flight_by_id,
    get_trajectory_by_flight_id,
    load_flights,
    load_summary,
)


app = FastAPI(
    title="Arlanda Arrival Dashboard API",
    description=(
        "Backend API for Stockholm Arlanda arrival trajectory analysis, "
        "CDO assessment, and environmental performance metrics."
    ),
    version="0.1.0",
)


frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Arlanda Arrival Dashboard API is running",
        "docs": "/docs",
    }


@app.get("/api/summary")
def api_summary():
    try:
        return load_summary()
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))

@app.get("/api/analytics/summary")
def api_analytics_summary():
    try:
        return load_analytics_summary()
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))

@app.get("/api/flights")
def api_flights():
    try:
        return load_flights()
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/flights/{flight_id}")
def api_flight_detail(flight_id: str):
    try:
        return get_flight_by_id(flight_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/flights/{flight_id}/trajectory")
def api_flight_trajectory(flight_id: str):
    try:
        return get_trajectory_by_flight_id(flight_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))