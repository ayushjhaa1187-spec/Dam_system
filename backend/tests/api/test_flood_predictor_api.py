"""Integration tests for Flood Predictor API endpoints."""

from fastapi.testclient import TestClient
from floodlab.api.main import app

client = TestClient(app)


def test_get_flood_predictor_metrics():
    res = client.get("/api/flood-predictor/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "TRAINED"
    assert "metrics" in data
    assert data["metrics"]["r2_score"] > 0.70
    assert "feature_importances" in data


def test_get_flood_predictor_presets():
    res = client.get("/api/flood-predictor/presets")
    assert res.status_code == 200
    data = res.json()
    assert "presets" in data
    assert len(data["presets"]) >= 4
    assert "feature_names" in data


def test_post_predict_flood_probability():
    payload = {
        "scenario_id": "tehri_extreme_monsoon",
        "features": {
            "MonsoonIntensity": 15.0,
            "Landslides": 16.0,
            "DamsQuality": 3.0,
        },
        "scenario_name": "Tehri Severe Risk Test",
        "include_submodels": True,
    }
    res = client.post("/api/flood-predictor/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "flood_probability" in data
    assert 0.0 <= data["flood_probability"] <= 1.0
    assert data["risk_category"] in ["HIGH", "SEVERE", "CRITICAL"]
    assert "sub_model_predictions" in data
    assert "top_risk_factors" in data
    assert "mitigation_recommendations" in data


def test_post_batch_predict():
    payload = {
        "items": [
            {"scenario_id": "tehri_extreme_monsoon"},
            {"scenario_id": "normal_controlled_baseline"},
        ]
    }
    res = client.post("/api/flood-predictor/batch-predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert len(data["results"]) == 2
    assert data["results"][0]["flood_probability"] > data["results"][1]["flood_probability"]


def test_simulation_run_includes_flood_prediction():
    res = client.post(
        "/api/simulations/run",
        json={
            "scenario_id": "tehri_severe_breach",
            "solver_type": "coupled",
            "breach_model": "froehlich_2008",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "flood_prediction" in data
    assert "flood_probability" in data["flood_prediction"]
    assert "risk_category" in data["flood_prediction"]
