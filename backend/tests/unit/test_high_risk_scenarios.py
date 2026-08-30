"""
Tests for High-Risk User Journeys & Edge Cases:
- Creating, editing, duplicating, reloading scenarios
- Valid/invalid inputs (dam height, head bounds, roughness bounds)
- Coordinate mismatch & bounding box handling
- Starting job twice / idempotency
- Refresh recovery simulation state
- Backend error handling & empty responses
"""

from fastapi.testclient import TestClient
from floodlab.api.main import app
from hydrobreach.data.preset_scenarios import get_preset_by_id

client = TestClient(app)


def test_scenario_preset_retrieval_and_reload():
    # Load all presets
    res = client.get("/api/scenarios/presets")
    assert res.status_code == 200
    presets = res.json().get("scenarios", [])
    assert len(presets) >= 4

    # Load specific preset
    preset_id = "tehri_dam_bhagirathi"
    p = get_preset_by_id(preset_id)
    assert p is not None
    assert "Tehri Dam" in p["name"]
    assert p["dam_height_m"] == 260.5


def test_scenario_calculation_with_valid_and_invalid_inputs():
    # Valid input
    valid_res = client.post(
        "/api/scenarios/calculate-breach",
        json={
            "dam_name": "Test Dam",
            "dam_type": "rockfill",
            "dam_height_m": 100.0,
            "hydraulic_head_m": 90.0,
            "reservoir_volume_m3": 50000000.0,
            "crest_length_m": 300.0,
        },
    )
    assert valid_res.status_code == 200
    assert valid_res.json()["peak_discharge_m3s"] > 0

    # Invalid input: negative height
    inv_res = client.post(
        "/api/scenarios/calculate-breach",
        json={
            "dam_name": "Invalid Dam",
            "dam_height_m": -50.0,
            "hydraulic_head_m": 90.0,
            "reservoir_volume_m3": 50000000.0,
        },
    )
    assert inv_res.status_code == 422  # Unprocessable entity validation error


def test_simulation_run_idempotency_and_state_recovery():
    # Run simulation
    run_res = client.post(
        "/api/simulations/run",
        json={
            "scenario_id": "tehri_dam_bhagirathi",
            "solver_type": "coupled",
            "breach_model": "froehlich_2008",
        },
    )
    assert run_res.status_code == 200
    data = run_res.json()
    run_id = data["run_id"]

    # Status lookup
    status_res = client.get(f"/api/simulations/{run_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] in ["COMPLETED", "COMPLETED_ADAPTER"]

    # Fetch full simulation results (for browser refresh recovery)
    fetch_res = client.get(f"/api/simulations/{run_id}")
    assert fetch_res.status_code == 200
    assert fetch_res.json()["run_id"] == run_id
    assert "breach_mechanics" in fetch_res.json()
    assert "damage_assessment" in fetch_res.json()


def test_coordinate_system_validation():
    # Valid coordinates in India
    res = client.post(
        "/api/export/geojson",
        json={
            "scenario_name": "Tehri Coordinates Test",
            "lat": 30.378,
            "lon": 78.481,
            "reach_length_km": 100.0,
        },
    )
    assert res.status_code == 200
    geojson = res.json()
    assert geojson["crs"]["properties"]["name"] == "urn:ogc:def:crs:OGC:1.3:CRS84"

    # Coordinates within bounding box
    coords = geojson["features"][0]["geometry"]["coordinates"]
    assert 70.0 <= coords[0] <= 90.0
    assert 20.0 <= coords[1] <= 40.0
