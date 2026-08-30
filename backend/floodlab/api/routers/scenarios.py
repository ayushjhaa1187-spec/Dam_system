"""Scenario registry, breach calculation, and generic customizable simulation endpoints."""
import json
from pathlib import Path
from typing import Optional
import yaml
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from hydrobreach.data.preset_scenarios import INDIAN_PRESET_SCENARIOS, get_preset_by_id
from hydrobreach.models.breach_mechanics import BreachMechanicsEngine, DamBreachInput
from hydrobreach.models.geospatial_etl.raster_processor import DEMProcessor

from floodlab.schemas.generic_scenario import ScenarioConfig, GenericSimulationResult
from floodlab.validation.dataset_validator import GenericScenarioValidator, DatasetValidationError
from floodlab.services.simulation_runner import run_simulation

router = APIRouter()

SCENARIO_DIR = Path(__file__).parents[4] / "configs" / "scenarios"
DATASETS_DIR = Path(__file__).parents[4] / "datasets"


class CustomBreachRequest(BaseModel):
    dam_name: str = Field(..., description="Name of dam or river blockage")
    dam_type: str = Field(default="rockfill")
    dam_height_m: float = Field(..., ge=1.0)
    reservoir_volume_m3: float = Field(..., ge=100.0)
    hydraulic_head_m: float = Field(..., ge=0.5)
    crest_length_m: Optional[float] = None
    breach_mode: str = Field(default="overtopping")
    material_cohesion: str = Field(default="medium")
    model_override: str = Field(default="auto")


class ValidateConfigRequest(BaseModel):
    config: Optional[ScenarioConfig] = None
    config_path: Optional[str] = None


@router.get("/presets")
async def list_presets():
    """Returns all pre-configured Indian river and dam scenarios."""
    return {"scenarios": INDIAN_PRESET_SCENARIOS}


@router.get("/presets/{preset_id}")
async def get_preset(preset_id: str):
    """Returns details for a specific Indian preset scenario."""
    preset = get_preset_by_id(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail=f"Preset {preset_id} not found.")
    return preset


@router.get("/datasets")
async def list_custom_datasets():
    """
    Discovers and lists all registered generic basin datasets present in the datasets/ repository folder.
    """
    discovered = []
    if DATASETS_DIR.exists():
        for d in DATASETS_DIR.iterdir():
            if d.is_dir():
                cfg_file = d / "scenario_config.json"
                if not cfg_file.exists():
                    cfg_file = d / "scenario_config.yaml"
                if cfg_file.exists():
                    try:
                        with open(cfg_file, "r", encoding="utf-8") as f:
                            raw = json.load(f) if cfg_file.suffix == ".json" else yaml.safe_load(f)
                        discovered.append({
                            "basin_id": d.name,
                            "scenario_id": raw.get("scenario_id", d.name),
                            "basin_name": raw.get("basin", {}).get("name", d.name),
                            "dam_name": raw.get("dam", {}).get("name", "Unknown Dam"),
                            "config_path": str(cfg_file.resolve()),
                            "files": [f.name for f in d.iterdir() if f.is_file()]
                        })
                    except Exception:
                        pass
    return {"datasets": discovered}


@router.post("/validate")
async def validate_scenario_config(req: ValidateConfigRequest):
    """
    Performs pre-flight physical and spatial validation on a ScenarioConfig.
    """
    cfg = None
    if req.config:
        cfg = req.config
    elif req.config_path:
        p = Path(req.config_path)
        if not p.exists():
            raise HTTPException(status_code=404, detail=f"Config file not found at {p}")
        with open(p, "r", encoding="utf-8") as f:
            raw = json.load(f) if p.suffix == ".json" else yaml.safe_load(f)
        cfg = ScenarioConfig(**raw).resolve_paths(base_dir=p.parent)
    else:
        raise HTTPException(status_code=400, detail="Must provide either 'config' object or 'config_path'")

    report = GenericScenarioValidator.validate(cfg, raise_on_error=False)
    return report.model_dump()


@router.post("/run-custom", response_model=GenericSimulationResult)
async def run_custom_scenario(config: ScenarioConfig):
    """
    Executes a flood inundation simulation run based on arbitrary user-provided ScenarioConfig.
    """
    try:
        result = run_simulation(config)
        return result
    except DatasetValidationError as e:
        raise HTTPException(status_code=400, detail={"error": "Dataset validation failed", "details": e.report.model_dump()})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation run failed: {str(e)}")


@router.get("")
async def list_scenarios():
    return {"scenarios": INDIAN_PRESET_SCENARIOS}


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    preset = get_preset_by_id(scenario_id)
    if preset:
        return preset
    if SCENARIO_DIR.exists():
        for f in SCENARIO_DIR.glob("*.yaml"):
            with open(f) as fh:
                data = yaml.safe_load(fh)
            if data.get("scenario_id") == scenario_id or f.stem == scenario_id:
                return data
    # Check in datasets/
    if DATASETS_DIR.exists():
        for d in DATASETS_DIR.iterdir():
            if d.is_dir():
                cfg_f = d / "scenario_config.json"
                if cfg_f.exists():
                    with open(cfg_f, "r", encoding="utf-8") as fh:
                        data = json.load(fh)
                    if data.get("scenario_id") == scenario_id or d.name == scenario_id:
                        return data
    raise HTTPException(404, f"Scenario {scenario_id} not found")


@router.post("/calculate-breach")
async def calculate_breach(req: CustomBreachRequest):
    """
    Computes breach dimensions, formation time, peak discharge, and synthesized hydrograph.
    """
    inp = DamBreachInput(
        dam_name=req.dam_name,
        dam_type=req.dam_type,
        dam_height_m=req.dam_height_m,
        reservoir_volume_m3=req.reservoir_volume_m3,
        hydraulic_head_m=req.hydraulic_head_m,
        crest_length_m=req.crest_length_m,
        breach_mode=req.breach_mode,
        material_cohesion=req.material_cohesion,
    )
    result = BreachMechanicsEngine.evaluate(inp, model_type=req.model_override)
    return result


@router.get("/dem-profile")
async def get_dem_profile(
    reach_length_km: float = Query(25.0, ge=5.0, le=150.0),
    upstream_elev_m: float = Query(2200.0, ge=100.0),
    downstream_elev_m: float = Query(1100.0, ge=0.0),
):
    """Generates DEM cross sections and thalweg profile for the river valley reach."""
    return DEMProcessor.generate_synthetic_river_dem(
        reach_length_km=reach_length_km,
        upstream_elev_m=upstream_elev_m,
        downstream_elev_m=downstream_elev_m,
    )
