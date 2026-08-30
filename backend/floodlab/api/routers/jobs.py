"""
Job queue and multi-stage simulation execution endpoints.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from floodlab.services.job_service import JobService, SimulationJob

router = APIRouter()


class SubmitJobRequest(BaseModel):
    preset_id: Optional[str] = None
    scenario_id: Optional[str] = None
    solver_type: Optional[str] = "coupled"
    breach_model: Optional[str] = "auto"
    custom_params: Optional[Dict[str, Any]] = None

    model_config = {"extra": "allow"}


@router.post("/submit", response_model=SimulationJob)
async def submit_simulation_job(req: SubmitJobRequest):
    """
    Submits a dam breach scenario for asynchronous background execution.
    Transitions through real multi-stage workflow:
    validating -> queued -> preprocessing_dem -> generating_mesh -> running -> post_processing -> exporting -> completed
    """
    params = req.custom_params or {}
    scen_id = req.scenario_id or req.preset_id or params.get("id") or "tehri_dam_bhagirathi"
    if not params:
        from hydrobreach.data.preset_scenarios import get_preset_by_id

        preset = get_preset_by_id(scen_id)
        if preset:
            params = dict(preset)

    job = JobService().submit_job(
        scenario_params=params,
        solver_type=req.solver_type or "coupled",
        breach_model=req.breach_model or "auto",
        scenario_id=scen_id,
    )
    return job


@router.get("", response_model=list[dict])
async def list_all_jobs():
    """Returns history of all active, completed, failed, and cancelled simulation runs."""
    return JobService().list_jobs()


@router.get("/{job_id}", response_model=SimulationJob)
async def get_job_status(job_id: str):
    """Fetches real-time execution status, current stage, logs, and queue progress."""
    job = JobService().get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    return job


@router.post("/{job_id}/cancel", response_model=SimulationJob)
async def cancel_job(job_id: str):
    """Cancels a running simulation job."""
    job = JobService().cancel_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    return job


@router.post("/{job_id}/retry", response_model=SimulationJob)
async def retry_job(job_id: str):
    """Retries a failed or cancelled simulation run."""
    job = JobService().retry_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    return job


@router.get("/{job_id}/report")
async def download_run_report(job_id: str):
    """Downloads formatted Markdown report summarizing the simulation results and damage assessment."""
    report_md = JobService().generate_run_report_markdown(job_id)
    return Response(
        content=report_md,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=HydroBreach_Report_{job_id}.md"},
    )
