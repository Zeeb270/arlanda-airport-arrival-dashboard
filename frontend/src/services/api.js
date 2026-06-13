const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function getSummary() {
  return request("/api/summary")
}

export function getAnalyticsSummary() {
  return request("/api/analytics/summary")
}

export function getOptimizationCandidates(limit = 25) {
  return request(`/api/optimization/candidates?limit=${limit}`)
}

export function getCdoSimulation(limit = 25) {
  return request(`/api/optimization/cdo-simulation?limit=${limit}`)
}

export function getFlights() {
  return request("/api/flights")
}

export function getFlight(flightId) {
  return request(`/api/flights/${flightId}`)
}

export function getTrajectory(flightId) {
  return request(`/api/flights/${flightId}/trajectory`)
}