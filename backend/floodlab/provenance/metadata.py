"""
Run Manifest: immutable provenance record for every simulation run.

Created at run start with inputs and config snapshot.
Updated on completion with output artifact URIs and execution status.
"""

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from floodlab.config.constants import ExecutionStatus
from floodlab.domain.provenance import ProvenanceRecord


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_file(path: Path) -> str:
    """SHA256 of a file's contents."""
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except (FileNotFoundError, OSError):
        return ""


@dataclass
class RunManifest:
    """
    Immutable provenance record for a simulation run.

    Serialised to storage/simulations/<run_id>/manifest.json.
    """

    run_id: str
    scenario_id: str
    solver_type: str
    breach_model: str
    engine_type: str = "rapid_screening"
    validation_status: str = "screening"
    model_name: str = "Rapid Screening SWE Model"
    model_version: str = "1.0.0"
    execution_status: str = ExecutionStatus.PENDING.value
    created_at: str = field(default_factory=_now_iso)
    completed_at: Optional[str] = None
    compute_duration_s: float = 0.0

    # Software environment — versions discovered at runtime
    software: Dict[str, Any] = field(default_factory=dict)

    # DEM provenance
    dem: Dict[str, Any] = field(default_factory=dict)

    # Hydrological forcing provenance
    hydrology: Dict[str, Any] = field(default_factory=dict)

    # Mesh / Particle discretization
    discretization: Dict[str, Any] = field(default_factory=dict)

    # Physical assumptions & boundary conditions
    physical_assumptions: Dict[str, Any] = field(default_factory=dict)

    # Input data snapshots
    input_data: Dict[str, Any] = field(default_factory=dict)

    # Per-value provenance map
    provenance_map: Dict[str, dict] = field(default_factory=dict)

    # Output artifact URIs (relative to run_dir)
    artifact_uris: Dict[str, str] = field(default_factory=dict)

    # Input file hashes & reproducibility ID
    input_file_hashes: Dict[str, str] = field(default_factory=dict)
    input_hash: str = ""
    reproducibility_id: str = ""

    def record_software(
        self,
        python_version: str,
        dualsphysics_version: Optional[str] = None,
        dflowfm_version: Optional[str] = None,
        git_commit: Optional[str] = None,
    ) -> None:
        self.software = {
            "python_version": python_version,
            "dualsphysics_version": dualsphysics_version,
            "dflowfm_version": dflowfm_version,
            "git_commit": git_commit,
        }

    def record_dem(
        self,
        source: str,
        version: str,
        resolution_m: float,
        file_path: Optional[Path] = None,
    ) -> None:
        self.dem = {
            "source": source,
            "version": version,
            "resolution_m": resolution_m,
            "provenance": "REPORTED",
            "file_hash": _hash_file(file_path) if file_path else "",
        }

    def add_provenance(self, key: str, record: ProvenanceRecord) -> None:
        self.provenance_map[key] = record.to_dict()

    def add_artifact(self, key: str, relative_path: str) -> None:
        self.artifact_uris[key] = relative_path

    def hash_input_file(self, key: str, path: Path) -> None:
        self.input_file_hashes[key] = _hash_file(path)

    def mark_complete(self, status: ExecutionStatus, compute_duration_s: float = 0.0) -> None:
        self.execution_status = status.value
        self.completed_at = _now_iso()
        self.compute_duration_s = round(compute_duration_s, 3)

    def to_dict(self) -> dict:
        return {
            "run_id": self.run_id,
            "scenario_id": self.scenario_id,
            "solver_type": self.solver_type,
            "breach_model": self.breach_model,
            "engine_type": self.engine_type,
            "validation_status": self.validation_status,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "execution_status": self.execution_status,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "compute_duration_s": self.compute_duration_s,
            "software": self.software,
            "dem": self.dem,
            "hydrology": self.hydrology,
            "discretization": self.discretization,
            "physical_assumptions": self.physical_assumptions,
            "input_data": self.input_data,
            "provenance_map": self.provenance_map,
            "artifact_uris": self.artifact_uris,
            "input_file_hashes": self.input_file_hashes,
            "input_hash": self.input_hash,
            "reproducibility_id": self.reproducibility_id,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_json(), encoding="utf-8")

    @classmethod
    def from_dict(cls, d: dict) -> "RunManifest":
        m = cls(
            run_id=d["run_id"],
            scenario_id=d["scenario_id"],
            solver_type=d.get("solver_type", "coupled"),
            breach_model=d.get("breach_model", "froehlich_2008"),
            engine_type=d.get("engine_type", "rapid_screening"),
            validation_status=d.get("validation_status", "screening"),
            model_name=d.get("model_name", "Rapid Screening SWE Model"),
            model_version=d.get("model_version", "1.0.0"),
            execution_status=d.get("execution_status", ExecutionStatus.PENDING.value),
            created_at=d.get("created_at", _now_iso()),
            completed_at=d.get("completed_at"),
            compute_duration_s=d.get("compute_duration_s", 0.0),
        )
        m.software = d.get("software", {})
        m.dem = d.get("dem", {})
        m.hydrology = d.get("hydrology", {})
        m.discretization = d.get("discretization", {})
        m.physical_assumptions = d.get("physical_assumptions", {})
        m.input_data = d.get("input_data", {})
        m.provenance_map = d.get("provenance_map", {})
        m.artifact_uris = d.get("artifact_uris", {})
        m.input_file_hashes = d.get("input_file_hashes", {})
        m.input_hash = d.get("input_hash", "")
        m.reproducibility_id = d.get("reproducibility_id", "")
        return m

    @classmethod
    def from_json(cls, s: str) -> "RunManifest":
        return cls.from_dict(json.loads(s))

    @classmethod
    def load(cls, path: Path) -> "RunManifest":
        return cls.from_json(path.read_text(encoding="utf-8"))
