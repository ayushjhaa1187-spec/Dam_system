"""
Scenario schemas.
"""

from typing import Optional
from pydantic import BaseModel


class DownstreamStationSchema(BaseModel):
    id: str
    name: str
    chainage_km: float
    landmark: Optional[str] = None


class DamConfig(BaseModel):
    name: str
    river: str
    reservoir_level_m: float
    storage_m3: float


class BreachConfig(BaseModel):
    model: str
    width_min_m: float
    width_max_m: float
    formation_time_min: float


class HydraulicsConfig(BaseModel):
    manning_n_source: str
    downstream_boundary: str


class SolverConfig(BaseModel):
    mode: str
    mesh_resolution_m: float


class ProvenanceConfig(BaseModel):
    scenario_type: str
    created_by: str


class ScenarioConfig(BaseModel):
    scenario_id: str
    mode: str
    dam: DamConfig
    breach: BreachConfig
    hydraulics: HydraulicsConfig
    solver: SolverConfig
    provenance: ProvenanceConfig


class ScenarioCreate(ScenarioConfig):
    pass


class ScenarioUpdate(BaseModel):
    mode: Optional[str] = None
    dam: Optional[DamConfig] = None
    breach: Optional[BreachConfig] = None
    hydraulics: Optional[HydraulicsConfig] = None
    solver: Optional[SolverConfig] = None
    provenance: Optional[ProvenanceConfig] = None


class ScenarioRead(ScenarioConfig):
    id: Optional[str] = None

    model_config = {"from_attributes": True}
