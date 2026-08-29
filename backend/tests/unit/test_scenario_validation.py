"""
Tests for physical constraint validation and GIS layer checks.
"""
import pytest
from floodlab.validation.scenario_validator import ScenarioValidator, LayerValidator


def test_valid_scenario_passes():
    valid_params = {
        "dam_name": "Tehri Dam",
        "dam_height_m": 260.5,
        "hydraulic_head_m": 260.0,
        "reservoir_volume_m3": 3.54e9,
        "crest_length_m": 575.0,
        "breach_mode": "overtopping",
        "reach_length_km": 100.0,
        "valley_width_m": 450.0,
        "bed_slope": 0.0055,
        "manning_n": 0.042,
    }
    res = ScenarioValidator.validate_scenario_params(valid_params)
    assert res.is_valid is True
    assert len(res.errors) == 0


def test_invalid_head_exceeds_crest_without_overtopping():
    invalid_params = {
        "dam_name": "Tehri Dam",
        "dam_height_m": 100.0,
        "hydraulic_head_m": 120.0,  # exceeds crest
        "reservoir_volume_m3": 1e6,
        "breach_mode": "piping",  # not overtopping
    }
    res = ScenarioValidator.validate_scenario_params(invalid_params)
    assert res.is_valid is False
    assert any(e.rule == "HEAD_EXCEEDS_CREST_WITHOUT_OVERTOPPING" for e in res.errors)


def test_invalid_negative_dam_height():
    invalid_params = {
        "dam_name": "Invalid Dam",
        "dam_height_m": -10.0,
        "reservoir_volume_m3": 1e6,
    }
    res = ScenarioValidator.validate_scenario_params(invalid_params)
    assert res.is_valid is False
    assert any(e.rule == "DAM_HEIGHT_POSITIVE" for e in res.errors)


def test_invalid_breach_width_exceeds_crest():
    invalid_params = {
        "dam_name": "Invalid Dam",
        "dam_height_m": 50.0,
        "reservoir_volume_m3": 1e6,
        "crest_length_m": 200.0,
        "avg_breach_width_m": 350.0,  # exceeds crest
    }
    res = ScenarioValidator.validate_scenario_params(invalid_params)
    assert res.is_valid is False
    assert any(e.rule == "BREACH_WIDTH_BOUNDED_BY_CREST" for e in res.errors)


def test_invalid_non_monotonic_hydrograph():
    invalid_params = {
        "dam_name": "Hydro Test Dam",
        "dam_height_m": 50.0,
        "reservoir_volume_m3": 1e6,
        "hydrograph_times": [0.0, 1.0, 0.5, 2.0],  # not monotonic
        "hydrograph_flows": [0.0, 500.0, 1200.0, 200.0],
    }
    res = ScenarioValidator.validate_scenario_params(invalid_params)
    assert res.is_valid is False
    assert any(e.rule == "HYDROGRAPH_TIMESTAMPS_MONOTONIC" for e in res.errors)


def test_dem_layer_validation():
    # Valid DEM
    valid_res = LayerValidator.validate_dem(
        crs="EPSG:32644",
        elevation_min_m=280.0,
        elevation_max_m=2400.0,
        resolution_m=30.0,
        file_size_bytes=5 * 1024 * 1024,
        filename="tehri_dem.tif"
    )
    assert valid_res.is_valid is True

    # Invalid DEM (min elevation > max elevation)
    invalid_res = LayerValidator.validate_dem(
        crs="EPSG:4326",
        elevation_min_m=3000.0,
        elevation_max_m=1000.0,
        resolution_m=30.0,
        filename="broken.tif"
    )
    assert invalid_res.is_valid is False
    assert any(e.rule == "ELEVATION_RANGE_VALID" for e in invalid_res.errors)
