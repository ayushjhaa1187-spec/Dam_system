"""
Integration tests for Customizable Simulation Framework (Deliverable ii).
Verifies that the exact same generic pipeline runs on different real basin datasets,
producing distinct, terrain-driven hydrodynamic results without code modification.
"""

import json
from pathlib import Path
import numpy as np
import rasterio
from fastapi.testclient import TestClient

from floodlab.api.main import app
from floodlab.services.simulation_runner import run_simulation
from floodlab.schemas.generic_scenario import GenericSimulationResult

DATASETS_DIR = Path(__file__).parents[3] / "datasets"
client = TestClient(app)


def test_dual_basin_generic_simulation_run(tmp_path):
    """
    Core Deliverable (ii) verification test:
    1. Run simulation on Chenab River Basin.
    2. Run simulation on Kosi River Basin.
    3. Verify that both runs succeed and generate distinct, terrain-plausible flood maps.
    """
    chenab_cfg = DATASETS_DIR / "chenab" / "scenario_config.json"
    kosi_cfg = DATASETS_DIR / "kosi" / "scenario_config.json"

    assert chenab_cfg.exists(), f"Chenab config missing at {chenab_cfg}"
    assert kosi_cfg.exists(), f"Kosi config missing at {kosi_cfg}"

    # 1. Execute Chenab Scenario Run
    out_chenab = tmp_path / "chenab_output"
    res_chenab = run_simulation(config=chenab_cfg, output_dir=out_chenab)

    assert isinstance(res_chenab, GenericSimulationResult)
    assert res_chenab.status == "COMPLETED"
    assert res_chenab.scenario_id == "chenab-jk-worstcase"
    assert res_chenab.basin_name == "Chenab River Basin"
    assert res_chenab.dam_name == "Baglihar Dam (Chenab)"
    assert res_chenab.peak_discharge_m3s > 50000.0  # High head Himalayan dam
    assert res_chenab.max_inundated_area_km2 > 0.0
    assert len(res_chenab.station_probes) >= 3

    # Verify Chenab exported files
    assert (out_chenab / "max_depth.tif").exists()
    assert (out_chenab / "arrival_time.tif").exists()
    assert (out_chenab / "flood_extent.geojson").exists()
    assert (out_chenab / "Q(t).csv").exists()
    assert (out_chenab / "run_metadata.json").exists()

    with rasterio.open(out_chenab / "max_depth.tif") as src:
        assert str(src.crs) == "EPSG:32643"
        arr = src.read(1)
        assert arr.shape == (src.height, src.width)
        assert np.max(arr) > 10.0  # Deep gorge depth

    # 2. Execute Kosi Scenario Run
    out_kosi = tmp_path / "kosi_output"
    res_kosi = run_simulation(config=kosi_cfg, output_dir=out_kosi)

    assert isinstance(res_kosi, GenericSimulationResult)
    assert res_kosi.status == "COMPLETED"
    assert res_kosi.scenario_id == "kosi-bihar-monsoon-breach"
    assert res_kosi.basin_name == "Kosi River Basin"
    assert res_kosi.dam_name == "Kosi Barrage / Dam"
    assert res_kosi.max_inundated_area_km2 > 0.0

    # Verify Kosi exported files
    assert (out_kosi / "max_depth.tif").exists()
    assert (out_kosi / "arrival_time.tif").exists()
    assert (out_kosi / "flood_extent.geojson").exists()
    assert (out_kosi / "Q(t).csv").exists()
    assert (out_kosi / "run_metadata.json").exists()

    with rasterio.open(out_kosi / "max_depth.tif") as src:
        assert str(src.crs) == "EPSG:32645"
        arr = src.read(1)
        # In shallow alluvial plain, max depth is significantly lower than deep mountain gorge
        assert np.max(arr) < 50.0

    # 3. Assert Outputs are Distinct and Reflect Differing Topography
    assert res_chenab.scenario_id != res_kosi.scenario_id
    assert res_chenab.peak_discharge_m3s != res_kosi.peak_discharge_m3s
    assert res_chenab.max_flood_depth_m != res_kosi.max_flood_depth_m
    assert res_chenab.output_rasters["max_depth"].crs != res_kosi.output_rasters["max_depth"].crs

    # Compare exposure: Bihar plain has much higher exposed population
    assert res_kosi.exposure.population_at_risk > res_chenab.exposure.population_at_risk


def test_api_generic_scenario_endpoints():
    """Verifies FastAPI endpoints for custom dataset scenarios."""
    chenab_cfg_path = str((DATASETS_DIR / "chenab" / "scenario_config.json").resolve())

    # 1. Test Dataset List
    resp = client.get("/api/scenarios/datasets")
    assert resp.status_code == 200
    data = resp.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 2
    basin_names = [d["basin_name"] for d in data["datasets"]]
    assert "Chenab River Basin" in basin_names
    assert "Kosi River Basin" in basin_names

    # 2. Test Validation Endpoint
    val_resp = client.post("/api/scenarios/validate", json={"config_path": chenab_cfg_path})
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["is_valid"] is True
    assert len(val_data["errors"]) == 0

    # 3. Test Direct Scenario Run via API
    with open(chenab_cfg_path, "r", encoding="utf-8") as f:
        raw_cfg = json.load(f)

    run_resp = client.post("/api/scenarios/run-custom", json=raw_cfg)
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["status"] == "COMPLETED"
    assert run_data["scenario_id"] == "chenab-jk-worstcase"
    assert "output_rasters" in run_data
    assert "max_depth" in run_data["output_rasters"]
