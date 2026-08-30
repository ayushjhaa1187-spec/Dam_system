"""
Unit tests for pre-flight generic scenario dataset validator.
"""

import pytest
from pathlib import Path
from floodlab.schemas.generic_scenario import (
    ScenarioConfig,
    BasinConfig,
    InputsConfig,
    DamConfig,
    BreachConfig,
    RunSettingsConfig,
)
from floodlab.validation.dataset_validator import GenericScenarioValidator, DatasetValidationError

DATASETS_DIR = Path(__file__).parents[3] / "datasets"


def test_valid_chenab_scenario_validation():
    cfg_path = DATASETS_DIR / "chenab" / "scenario_config.json"
    if cfg_path.exists():
        import json

        with open(cfg_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        cfg = ScenarioConfig(**raw).resolve_paths(base_dir=cfg_path.parent)
        report = GenericScenarioValidator.validate(cfg, raise_on_error=False)
        assert report.is_valid is True
        assert len(report.errors) == 0
        assert report.checked_rules_count >= 5


def test_valid_kosi_scenario_validation():
    cfg_path = DATASETS_DIR / "kosi" / "scenario_config.json"
    if cfg_path.exists():
        import json

        with open(cfg_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        cfg = ScenarioConfig(**raw).resolve_paths(base_dir=cfg_path.parent)
        report = GenericScenarioValidator.validate(cfg, raise_on_error=False)
        assert report.is_valid is True
        assert len(report.errors) == 0


def test_missing_dem_fails_validation():
    cfg = ScenarioConfig(
        scenario_id="invalid-test",
        basin=BasinConfig(name="Fake Basin", aoi_boundary=str(DATASETS_DIR / "chenab" / "aoi.geojson")),
        inputs=InputsConfig(dem="non_existent_dem.tif"),
        dam=DamConfig(name="Fake Dam", location=[33.15, 75.35], height_m=50.0, storage_volume_mcm=100.0),
        breach=BreachConfig(),
        run_settings=RunSettingsConfig(),
    )
    report = GenericScenarioValidator.validate(cfg, raise_on_error=False)
    assert report.is_valid is False
    assert any(e.rule_code == "DEM_FILE_NOT_FOUND" for e in report.errors)

    with pytest.raises(DatasetValidationError):
        GenericScenarioValidator.validate(cfg, raise_on_error=True)


def test_dam_outside_aoi_fails_validation():
    cfg = ScenarioConfig(
        scenario_id="out-of-bounds-dam",
        basin=BasinConfig(name="Chenab Basin", aoi_boundary=str(DATASETS_DIR / "chenab" / "aoi.geojson")),
        inputs=InputsConfig(dem=str(DATASETS_DIR / "chenab" / "dem.tif")),
        dam=DamConfig(
            name="Faraway Dam", location=[12.97, 77.59], height_m=50.0, storage_volume_mcm=100.0
        ),  # Bangalore coords
        breach=BreachConfig(),
        run_settings=RunSettingsConfig(),
    )
    report = GenericScenarioValidator.validate(cfg, raise_on_error=False)
    assert report.is_valid is False
    assert any(e.rule_code == "DAM_OUTSIDE_AOI" for e in report.errors)


def test_invalid_dam_height_fails():
    cfg = ScenarioConfig(
        scenario_id="negative-height-dam",
        basin=BasinConfig(name="Chenab Basin", aoi_boundary=str(DATASETS_DIR / "chenab" / "aoi.geojson")),
        inputs=InputsConfig(dem=str(DATASETS_DIR / "chenab" / "dem.tif")),
        dam=DamConfig(name="Neg Dam", location=[33.15, 75.35], height_m=1.0, storage_volume_mcm=100.0),
        breach=BreachConfig(failure_type="invalid_mode"),
        run_settings=RunSettingsConfig(),
    )
    report = GenericScenarioValidator.validate(cfg, raise_on_error=False)
    assert report.is_valid is False
    assert any(e.rule_code == "BREACH_TYPE_INVALID" for e in report.errors)
