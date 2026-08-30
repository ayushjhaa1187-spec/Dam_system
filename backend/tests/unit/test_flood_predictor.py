"""Unit tests for ML Ensemble Flood Probability Predictor Engine."""
import pytest
from floodlab.engines.flood_predictor import (
    FloodEnsemblePredictor,
    get_flood_predictor,
    FEATURE_NAMES,
    FEATURE_DESCRIPTIONS,
    FEATURE_CATEGORIES,
    DEFAULT_PRESETS,
    classify_risk,
)


def test_feature_definitions():
    assert len(FEATURE_NAMES) == 20
    assert "MonsoonIntensity" in FEATURE_NAMES
    assert "DamsQuality" in FEATURE_NAMES
    assert "Landslides" in FEATURE_NAMES
    assert "FloodProbability" not in FEATURE_NAMES

    # Descriptions
    assert len(FEATURE_DESCRIPTIONS) == 20
    for feat in FEATURE_NAMES:
        assert feat in FEATURE_DESCRIPTIONS


def test_classify_risk():
    assert classify_risk(0.20)[0] == "LOW"
    assert classify_risk(0.45)[0] == "MODERATE"
    assert classify_risk(0.60)[0] == "HIGH"
    assert classify_risk(0.75)[0] == "SEVERE"
    assert classify_risk(0.90)[0] == "CRITICAL"


def test_predictor_singleton():
    p1 = get_flood_predictor()
    p2 = get_flood_predictor()
    assert p1 is p2
    assert p1.is_trained is True


def test_predictor_metrics():
    predictor = get_flood_predictor()
    metrics_info = predictor.get_metrics()
    assert metrics_info["status"] == "TRAINED"
    metrics = metrics_info["metrics"]
    assert "r2_score" in metrics
    assert metrics["r2_score"] > 0.70  # High ensemble accuracy target
    assert "mse" in metrics
    assert "mae" in metrics
    assert metrics_info["training_samples"] > 0
    assert len(metrics_info["feature_importances"]) == 20


def test_predict_single_preset():
    predictor = get_flood_predictor()
    preset = DEFAULT_PRESETS[0]  # Tehri extreme
    res = predictor.predict_single(preset["features"])

    assert 0.0 <= res["flood_probability"] <= 1.0
    assert 0.0 <= res["flood_probability_pct"] <= 100.0
    assert res["risk_category"] in ["LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]
    assert "sub_model_predictions" in res
    assert "top_risk_factors" in res
    assert len(res["top_risk_factors"]) > 0
    assert len(res["mitigation_recommendations"]) > 0


def test_predict_single_low_risk():
    predictor = get_flood_predictor()
    low_feats = {f: 1.0 for f in FEATURE_NAMES}
    low_feats["DamsQuality"] = 15.0
    low_feats["DrainageSystems"] = 15.0
    res = predictor.predict_single(low_feats)

    assert res["flood_probability"] <= 0.50
    assert res["risk_category"] in ["LOW", "MODERATE"]


def test_predict_batch():
    predictor = get_flood_predictor()
    batch = [
        {"MonsoonIntensity": 14, "DamsQuality": 2},
        {"MonsoonIntensity": 3, "DamsQuality": 15},
    ]
    results = predictor.predict_batch(batch)
    assert len(results) == 2
    assert results[0]["flood_probability"] > results[1]["flood_probability"]


def test_map_scenario_to_features():
    predictor = get_flood_predictor()
    tehri_scenario = {
        "dam_height_m": 260.5,
        "reservoir_volume_m3": 3.54e9,
        "is_hypothetical": True,
        "dam_type": "rockfill",
    }
    feats = predictor.map_scenario_to_features(tehri_scenario)
    assert feats["DamsQuality"] == 4.0
    assert feats["MonsoonIntensity"] == 12.0
