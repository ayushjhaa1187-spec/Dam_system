from typing import List
from pydantic import BaseModel


class RasterLayer(BaseModel):
    layer_name: str
    url: str
    min_value: float
    max_value: float
    unit: str


class VectorLayer(BaseModel):
    layer_name: str
    format: str
    url: str


class ExposureResult(BaseModel):
    population_at_risk: int
    buildings_affected: int
    critical_infrastructure_affected: int
    economic_loss_estimate: float


class RunMetadata(BaseModel):
    execution_time_seconds: float
    solver_version: str
    compute_node: str


class SimulationResult(BaseModel):
    run_id: str
    scenario_id: str
    status: str
    raster_layers: List[RasterLayer]
    vector_layers: List[VectorLayer]
    exposure: ExposureResult
    metadata: RunMetadata
