"""
Tests for background simulation job management and stage lifecycle.
"""
import time
from floodlab.services.job_service import JobService, JobStage


def test_job_submission_and_lifecycle():
    service = JobService()
    valid_params = {
        "dam_name": "Tehri Benchmark Test",
        "dam_height_m": 260.5,
        "hydraulic_head_m": 260.0,
        "reservoir_volume_m3": 3.54e9,
        "reach_length_km": 100.0,
    }
    
    job = service.submit_job(scenario_params=valid_params, solver_type="screening")
    assert job.job_id.startswith("job_")
    assert job.run_id.startswith("sim_")
    assert job.state in [JobStage.QUEUED, JobStage.VALIDATING, JobStage.PREPROCESSING_DEM, JobStage.RUNNING, JobStage.COMPLETED]
    
    # Wait for completion
    for _ in range(30):
        current_job = service.get_job(job.job_id)
        if current_job.state in [JobStage.COMPLETED, JobStage.FAILED]:
            break
        time.sleep(0.5)

    completed_job = service.get_job(job.job_id)
    assert completed_job.state == JobStage.COMPLETED
    assert completed_job.result is not None
    assert "breach_mechanics" in completed_job.result


def test_job_markdown_report_generation():
    service = JobService()
    jobs = service.list_jobs()
    assert len(jobs) > 0
    job_id = jobs[0]["job_id"]
    report = service.generate_run_report_markdown(job_id)
    assert "# HydroBreach" in report
    assert "Peak Outflow Discharge" in report
