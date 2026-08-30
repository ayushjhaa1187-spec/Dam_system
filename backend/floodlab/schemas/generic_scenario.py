"""
Generic Scenario Configuration and Simulation Result Schemas.
Allows HydroShield to execute flood inundation simulations on arbitrary basins
and input datasets without code modifications.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class BasinConfig(BaseModel):
    """Basin identification and geographical area of interest (AOI)."""
    name: str = Field(..., description="Name of the river basin or study area")
    aoi_boundary: str = Field(..., description="Path to AOI GeoJSON or Shapefile boundary polygon")
    description: Optional[str] = Field(default=None, description="Optional description of the basin")
    state: Optional[str] = Field(default=None, description="State / Province")
    country: Optional[str] = Field(default="India", description="Country")


class InputsConfig(BaseModel):
    """File paths to input geospatial datasets."""
    dem: str = Field(..., description="Path to Digital Elevation Model (GeoTIFF / raster)")
    river_network: Optional[str] = Field(default=None, description="Path to River Network (Shapefile or GeoJSON)")
    land_use: Optional[str] = Field(default=None, description="Optional path to Land Use / Land Cover raster or vector")
    population: Optional[str] = Field(default=None, description="Optional path to Population density raster or vector")
    infrastructure: Optional[str] = Field(default=None, description="Optional path to critical infrastructure vector")


class DamConfig(BaseModel):
    """Dam structural geometry, reservoir capacity, and coordinates."""
    name: str = Field(..., description="Name of the dam or hydraulic structure")
    location: List[float] = Field(
        ...,
        description="Dam location coordinates [latitude, longitude] in WGS84",
        min_length=2,
        max_length=2
    )
    height_m: float = Field(..., gt=0.0, description="Structural dam height in meters")
    storage_volume_mcm: Optional[float] = Field(default=None, gt=0.0, description="Reservoir storage volume in Million Cubic Meters (MCM)")
    storage_volume_m3: Optional[float] = Field(default=None, gt=0.0, description="Reservoir storage volume in Cubic Meters (m³)")
    hydraulic_head_m: Optional[float] = Field(default=None, gt=0.0, description="Hydraulic head at breach initiation in meters")
    crest_length_m: Optional[float] = Field(default=None, gt=0.0, description="Total dam crest length in meters")
    dam_type: Optional[str] = Field(default="rockfill", description="Dam construction type (e.g. rockfill, earthfill, concrete_gravity, masonry)")
    crest_elevation_msl: Optional[float] = Field(default=None, description="Crest elevation in meters MSL")
    river_bed_elevation_msl: Optional[float] = Field(default=None, description="River bed elevation at dam axis in meters MSL")

    @property
    def effective_storage_m3(self) -> float:
        """Returns storage volume normalized to cubic meters."""
        if self.storage_volume_m3 is not None and self.storage_volume_m3 > 0:
            return float(self.storage_volume_m3)
        if self.storage_volume_mcm is not None and self.storage_volume_mcm > 0:
            return float(self.storage_volume_mcm * 1e6)
        return float(max(self.height_m ** 2.5 * 1000.0, 1e6))

    @property
    def effective_hydraulic_head_m(self) -> float:
        """Returns effective hydraulic head in meters."""
        if self.hydraulic_head_m is not None and self.hydraulic_head_m > 0:
            return float(self.hydraulic_head_m)
        return float(self.height_m * 0.95)

    @property
    def lat(self) -> float:
        return self.location[0]

    @property
    def lon(self) -> float:
        return self.location[1]


class BreachConfig(BaseModel):
    """Dam breach initiation mechanism and failure geometry."""
    failure_type: str = Field(
        default="overtopping",
        description="Failure mode: overtopping, piping, instantaneous, or structural_collapse"
    )
    breach_width_m: Optional[float] = Field(default=None, gt=0.0, description="Average breach width in meters")
    breach_formation_time_hr: Optional[float] = Field(default=None, gt=0.0, description="Breach development time in hours")
    reservoir_level_pct: Optional[float] = Field(default=100.0, gt=0.0, le=150.0, description="Reservoir water level as % of full height")
    breach_model: Optional[str] = Field(
        default="froehlich_2008",
        description="Empirical formula: froehlich_2008, macdonald, von_thun, or ritter"
    )
    breach_depth_m: Optional[float] = Field(default=None, gt=0.0, description="Final breach depth in meters")
    side_slope_z: Optional[float] = Field(default=1.0, ge=0.0, description="Breach side slope z (zH : 1V)")


class RunSettingsConfig(BaseModel):
    """Numerical parameters and solver controls."""
    grid_resolution_m: float = Field(default=30.0, gt=0.5, le=1000.0, description="Simulation grid cell size in meters")
    manning_n: float = Field(default=0.035, gt=0.01, le=0.20, description="Default Manning's roughness coefficient")
    simulation_duration_hr: float = Field(default=24.0, gt=0.1, le=168.0, description="Total hydrodynamic simulation duration in hours")
    time_step_s: Optional[float] = Field(default=None, gt=0.01, le=120.0, description="Optional fixed or max timestep in seconds")
    cfl: Optional[float] = Field(default=0.5, gt=0.05, le=0.95, description="Courant-Friedrichs-Lewy (CFL) stability number")
    target_crs: Optional[str] = Field(default=None, description="Optional target projected CRS (e.g. EPSG:32643). If null, auto-computed from location.")
    output_interval_s: Optional[float] = Field(default=300.0, description="Interval for recording time-series animation frames")
    wet_threshold_m: Optional[float] = Field(default=0.10, description="Water depth threshold (m) to classify cell as inundated")


class ScenarioConfig(BaseModel):
    """
    Unified Scenario Configuration describing an entire simulation run on arbitrary datasets.
    """
    scenario_id: str = Field(..., description="Unique scenario identifier (e.g. chenab-jk-worstcase)")
    basin: BasinConfig = Field(..., description="Basin and study boundary metadata")
    inputs: InputsConfig = Field(..., description="Input GIS dataset filepaths")
    dam: DamConfig = Field(..., description="Dam structural specifications")
    breach: BreachConfig = Field(default_factory=BreachConfig, description="Dam breach mechanics settings")
    run_settings: RunSettingsConfig = Field(default_factory=RunSettingsConfig, description="Numerical simulation controls")
    description: Optional[str] = Field(default=None, description="Scenario narrative description")

    model_config = {"protected_namespaces": ()}

    def resolve_paths(self, base_dir: Optional[Union[str, Path]] = None) -> ScenarioConfig:
        """
        Resolves relative filepaths in inputs and basin against a base directory or workspace root.
        """
        if base_dir is None:
            base_dir = Path.cwd()
        else:
            base_dir = Path(base_dir)

        def _resolve(p: Optional[str]) -> Optional[str]:
            if not p:
                return p
            path_obj = Path(p)
            if not path_obj.is_absolute():
                candidates = [
                    base_dir / path_obj,
                    Path.cwd() / path_obj,
                    Path.cwd().parent / path_obj,
                    Path(__file__).parents[3] / path_obj,
                ]
                for cand in candidates:
                    if cand.exists():
                        return str(cand.resolve())
                return str(candidates[0].resolve())
            return p

        data = self.model_dump()
        data["basin"]["aoi_boundary"] = _resolve(data["basin"]["aoi_boundary"])
        data["inputs"]["dem"] = _resolve(data["inputs"]["dem"])
        if data["inputs"].get("river_network"):
            data["inputs"]["river_network"] = _resolve(data["inputs"]["river_network"])
        if data["inputs"].get("land_use"):
            data["inputs"]["land_use"] = _resolve(data["inputs"]["land_use"])
        if data["inputs"].get("population"):
            data["inputs"]["population"] = _resolve(data["inputs"]["population"])
        if data["inputs"].get("infrastructure"):
            data["inputs"]["infrastructure"] = _resolve(data["inputs"]["infrastructure"])

        return ScenarioConfig(**data)


class HydrographResult(BaseModel):
    """Breach outflow hydrograph result."""
    peak_discharge_m3s: float
    time_to_peak_hr: float
    formation_time_hr: float
    breach_width_m: float
    total_volume_m3: float
    time_series_hr: List[float]
    discharge_series_m3s: List[float]
    model_used: str


class RasterOutputMeta(BaseModel):
    """Metadata for generated output rasters."""
    layer_name: str
    file_path: str
    min_value: float
    max_value: float
    mean_value: float
    unit: str
    crs: str
    resolution_m: float
    shape: List[int]
    bounds: List[float]


class StationProbeResult(BaseModel):
    """Downstream river monitoring station time series."""
    station_id: str
    station_name: str
    chainage_km: float
    arrival_time_min: float
    peak_depth_m: float
    peak_velocity_ms: float
    flood_duration_hr: float
    time_minutes: List[float]
    depth_series_m: List[float]
    discharge_series_m3s: List[float]


class ExposureSummary(BaseModel):
    """Downstream human and infrastructural exposure metrics."""
    total_inundated_area_km2: float
    population_at_risk: int
    buildings_affected: int
    roads_submerged_km: float
    land_use_breakdown: List[Dict[str, Any]] = []
    hazard_score: float = 0.0


class GenericSimulationResult(BaseModel):
    """
    Standardized, verifiable simulation result returned by run_simulation().
    """
    scenario_id: str
    run_id: str
    status: str
    basin_name: str
    dam_name: str
    peak_discharge_m3s: float
    max_inundated_area_km2: float
    max_flood_depth_m: float
    max_flow_velocity_ms: float
    flood_arrival_min_dam: float
    flood_arrival_min_outlet: float
    hydrograph: HydrographResult
    station_probes: List[StationProbeResult]
    exposure: ExposureSummary
    output_rasters: Dict[str, RasterOutputMeta]
    output_vectors: Dict[str, str]
    output_directory: str
    execution_time_seconds: float
    provenance: Dict[str, Any]

    model_config = {"protected_namespaces": ()}
