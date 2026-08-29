"""
Simulation domain model.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional
from floodlab.config.constants import ExecutionStatus, SolverType, BreachModel, SimulationEngine, ValidationStatus


@dataclass
class SimulationDomain:
    run_id: str
    scenario_id: str
    solver_type: SolverType
    breach_model: BreachModel
    engine_type: SimulationEngine = SimulationEngine.RAPID_SCREENING
    validation_status: ValidationStatus = ValidationStatus.SCREENING
    model_name: str = "Rapid Screening SWE Model"
    model_version: str = "1.0"
    dem_source: str = "Copernicus GLO-30"
    dem_resolution_m: float = 30.0
    hydrology_source: str = "CWC Gauge Records / IMD 24h PMP"
    grid_or_particle_resolution: str = "Grid Cell 30m x 30m"
    time_step_s: float = 1.0
    manning_n: float = 0.042
    input_hash: str = ""
    reproducibility_id: str = ""
    compute_duration_s: float = 0.0
    status: ExecutionStatus = ExecutionStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    dualsphysics_version: Optional[str] = None
    dflowfm_version: Optional[str] = None
    python_version: str = "3.12"
    git_commit: Optional[str] = None
    artifact_uris: Dict[str, str] = field(default_factory=dict)
