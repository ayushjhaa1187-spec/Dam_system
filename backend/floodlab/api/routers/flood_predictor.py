"""
FastAPI Router for ML Ensemble Flood Probability Predictor.
Exposes endpoints for real-time inference, batch predictions, model evaluation metrics,
scenario presets, and model retraining.
"""

from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from floodlab.engines.flood_predictor.flood_ensemble import (
    get_flood_predictor,
    FEATURE_NAMES,
    FEATURE_DESCRIPTIONS,
    FEATURE_CATEGORIES,
    DEFAULT_PRESETS,
)

router = APIRouter()


class FloodPredictRequest(BaseModel):
    features: Optional[Dict[str, float]] = Field(
        default=None,
        description="20 environmental/risk features (0 to 16 scale)",
    )
    scenario_id: Optional[str] = Field(default=None, description="Preset scenario ID if using preset")
    scenario_name: Optional[str] = Field(default=None, description="Optional label for this analysis")
    include_submodels: bool = Field(default=True, description="Include individual XGB, LGB, CatBoost predictions")

    model_config = {"protected_namespaces": ()}


class BatchFloodPredictRequest(BaseModel):
    items: List[FloodPredictRequest]

    model_config = {"protected_namespaces": ()}


@router.get("/metrics")
async def get_model_metrics():
    """
    Returns ensemble model performance evaluation metrics:
    R² score, MSE, MAE, individual model weights, and feature importance rankings.
    """
    predictor = get_flood_predictor()
    return predictor.get_metrics()


@router.get("/presets")
async def get_presets():
    """
    Returns curated benchmark scenario presets (e.g. Tehri Outburst, Chamoli GLOF, Urban Blockage).
    """
    return {
        "presets": DEFAULT_PRESETS,
        "feature_names": FEATURE_NAMES,
        "feature_descriptions": FEATURE_DESCRIPTIONS,
        "feature_categories": FEATURE_CATEGORIES,
    }


@router.post("/predict")
async def predict_flood_probability(req: FloodPredictRequest):
    """
    Predicts continuous Flood Probability using XGBoost + LightGBM + CatBoost VotingRegressor.
    Returns probability (0-100%), risk category, top risk drivers, and mitigation recommendations.
    """
    predictor = get_flood_predictor()

    input_features = req.features or {}
    # If scenario_id preset requested
    if req.scenario_id:
        preset = next((p for p in DEFAULT_PRESETS if p["id"] == req.scenario_id), None)
        if preset:
            merged = dict(preset["features"])
            if req.features:
                merged.update(req.features)
            input_features = merged

    result = predictor.predict_single(input_features)
    result["scenario_name"] = req.scenario_name or req.scenario_id or "Custom Environmental Profile"

    if not req.include_submodels:
        result.pop("sub_model_predictions", None)

    return result


@router.post("/batch-predict")
async def batch_predict_flood_probability(req: BatchFloodPredictRequest):
    """
    Predicts continuous Flood Probability for a batch of locations/scenarios.
    """
    predictor = get_flood_predictor()
    results = []
    for item in req.items:
        feats = item.features or {}
        if item.scenario_id:
            preset = next((p for p in DEFAULT_PRESETS if p["id"] == item.scenario_id), None)
            if preset:
                merged = dict(preset["features"])
                if item.features:
                    merged.update(item.features)
                feats = merged
        res = predictor.predict_single(feats)
        res["scenario_name"] = item.scenario_name or item.scenario_id or "Batch Item"
        results.append(res)
    return {"results": results, "total_processed": len(results)}


@router.post("/train")
async def retrain_model(background_tasks: BackgroundTasks):
    """
    Triggers re-training and re-evaluation of the VotingRegressor ensemble on flood.csv.
    """
    predictor = get_flood_predictor()
    try:
        metrics = predictor.train()
        return {
            "status": "SUCCESS",
            "message": "Model retrained and cached successfully.",
            "metrics": metrics,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
