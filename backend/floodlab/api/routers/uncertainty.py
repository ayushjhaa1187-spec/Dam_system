from fastapi import APIRouter
from floodlab.engines.uncertainty.ensemble import UncertaintyEnsemble

router = APIRouter()


@router.post("/ensemble")
async def run_uncertainty_ensemble(body: dict):
    engine = UncertaintyEnsemble()
    return engine.run_ensemble(body, body.get("num_runs", 20))
