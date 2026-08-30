"""
ML Ensemble Flood Probability Predictor Engine.
Combines XGBoost, LightGBM, and CatBoost inside a scikit-learn VotingRegressor
to predict continuous FloodProbability based on 20 environmental and infrastructural risk factors.
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "MonsoonIntensity",
    "TopographyDrainage",
    "RiverManagement",
    "Deforestation",
    "Urbanization",
    "ClimateChange",
    "DamsQuality",
    "Siltation",
    "AgriculturalPractices",
    "Encroachments",
    "IneffectiveDisasterPreparedness",
    "DrainageSystems",
    "CoastalVulnerability",
    "Landslides",
    "Watersheds",
    "DeterioratingInfrastructure",
    "PopulationScore",
    "WetlandLoss",
    "InadequatePlanning",
    "PoliticalFactors",
]

FEATURE_DESCRIPTIONS = {
    "MonsoonIntensity": "Intensity of seasonal monsoonal precipitation and cloudburst susceptibility (0-16)",
    "TopographyDrainage": "Natural topographic slope, steepness, and runoff concentration speed (0-16)",
    "RiverManagement": "Adequacy of river channelization, embankments, and sediment dredging (0-16)",
    "Deforestation": "Canopy loss, slope denudation, and vegetative clearing in catchment (0-16)",
    "Urbanization": "Impervious surface percentage and dense urban flood corridor footprint (0-16)",
    "ClimateChange": "Long-term temperature anomaly and frequency of extreme rainfall anomalies (0-16)",
    "DamsQuality": "Structural health, spillway integrity, and age/safety index of dams (0-16, 16=best)",
    "Siltation": "Sediment deposition load in reservoirs, riverbed aggradation, and choke points (0-16)",
    "AgriculturalPractices": "Terracing, soil tillage exposure, and agricultural runoff susceptibility (0-16)",
    "Encroachments": "Settlements and illegal constructions within designated floodplains (0-16)",
    "IneffectiveDisasterPreparedness": "Gaps in early warning sirens, EOC readiness, and evacuation drills (0-16)",
    "DrainageSystems": "Capacity and maintenance status of stormwater drainage culverts (0-16, 16=best)",
    "CoastalVulnerability": "Tidal backwater, storm surge, or downstream river confluence risk (0-16)",
    "Landslides": "Frequency of slope failures, debris flows, and landslide dam blocks (0-16)",
    "Watersheds": "Catchment area scale, dendritic drainage density, and river confluence index (0-16)",
    "DeterioratingInfrastructure": "Aging bridges, scour vulnerability, and degraded river revetments (0-16)",
    "PopulationScore": "Downstream human settlement density in direct inundation pathways (0-16)",
    "WetlandLoss": "Loss of natural wetlands, riparian buffers, and sponge reservoirs (0-16)",
    "InadequatePlanning": "Lack of zonation enforcement, master plan non-compliance, and blind spots (0-16)",
    "PoliticalFactors": "Inter-state water governance friction, delay in emergency releases (0-16)",
}

FEATURE_CATEGORIES = {
    "Hydrometeorological": ["MonsoonIntensity", "ClimateChange"],
    "Topography & Catchment": [
        "TopographyDrainage",
        "Deforestation",
        "Watersheds",
        "Landslides",
        "WetlandLoss",
    ],
    "Infrastructure & Dam Safety": [
        "DamsQuality",
        "Siltation",
        "DeterioratingInfrastructure",
        "DrainageSystems",
        "RiverManagement",
    ],
    "Socio-Economic & Preparedness": [
        "Urbanization",
        "PopulationScore",
        "AgriculturalPractices",
        "CoastalVulnerability",
        "Encroachments",
        "IneffectiveDisasterPreparedness",
        "InadequatePlanning",
        "PoliticalFactors",
    ],
}

DEFAULT_PRESETS = [
    {
        "id": "tehri_extreme_monsoon",
        "name": "Tehri Dam Outburst (PMF + Seismic Inflow)",
        "description": "Extreme Himalayan cloudburst with maximum siltation and high downstream population risk.",
        "category": "Catastrophic Breach",
        "features": {
            "MonsoonIntensity": 14,
            "TopographyDrainage": 12,
            "RiverManagement": 5,
            "Deforestation": 11,
            "Urbanization": 9,
            "ClimateChange": 13,
            "DamsQuality": 4,
            "Siltation": 14,
            "AgriculturalPractices": 7,
            "Encroachments": 10,
            "IneffectiveDisasterPreparedness": 9,
            "DrainageSystems": 4,
            "CoastalVulnerability": 2,
            "Landslides": 15,
            "Watersheds": 13,
            "DeterioratingInfrastructure": 11,
            "PopulationScore": 12,
            "WetlandLoss": 8,
            "InadequatePlanning": 10,
            "PoliticalFactors": 7,
        },
    },
    {
        "id": "chamoli_glof_landslide",
        "name": "Chamoli / Rishi Ganga Flash Outburst",
        "description": "Steep gorge landslide dam blockage & sudden breach with extreme debris load.",
        "category": "Landslide Dam Outburst",
        "features": {
            "MonsoonIntensity": 11,
            "TopographyDrainage": 15,
            "RiverManagement": 3,
            "Deforestation": 12,
            "Urbanization": 4,
            "ClimateChange": 14,
            "DamsQuality": 5,
            "Siltation": 15,
            "AgriculturalPractices": 4,
            "Encroachments": 6,
            "IneffectiveDisasterPreparedness": 11,
            "DrainageSystems": 3,
            "CoastalVulnerability": 1,
            "Landslides": 16,
            "Watersheds": 14,
            "DeterioratingInfrastructure": 12,
            "PopulationScore": 7,
            "WetlandLoss": 6,
            "InadequatePlanning": 12,
            "PoliticalFactors": 5,
        },
    },
    {
        "id": "urban_monsoon_inundation",
        "name": "Downstream Urban Conurbation Inundation",
        "description": "Severe urban drainage choking, extensive floodplain encroachment, and intense storm surge.",
        "category": "Urban Flash Flood",
        "features": {
            "MonsoonIntensity": 12,
            "TopographyDrainage": 6,
            "RiverManagement": 4,
            "Deforestation": 9,
            "Urbanization": 15,
            "ClimateChange": 10,
            "DamsQuality": 8,
            "Siltation": 11,
            "AgriculturalPractices": 3,
            "Encroachments": 15,
            "IneffectiveDisasterPreparedness": 12,
            "DrainageSystems": 2,
            "CoastalVulnerability": 8,
            "Landslides": 4,
            "Watersheds": 9,
            "DeterioratingInfrastructure": 13,
            "PopulationScore": 15,
            "WetlandLoss": 14,
            "InadequatePlanning": 14,
            "PoliticalFactors": 9,
        },
    },
    {
        "id": "normal_controlled_baseline",
        "name": "Controlled Operational Release (Baseline)",
        "description": "Standard controlled discharge with sound dam health, unblocked drainage, and low risk.",
        "category": "Standard Operation",
        "features": {
            "MonsoonIntensity": 4,
            "TopographyDrainage": 4,
            "RiverManagement": 12,
            "Deforestation": 3,
            "Urbanization": 4,
            "ClimateChange": 4,
            "DamsQuality": 14,
            "Siltation": 3,
            "AgriculturalPractices": 4,
            "Encroachments": 3,
            "IneffectiveDisasterPreparedness": 2,
            "DrainageSystems": 13,
            "CoastalVulnerability": 2,
            "Landslides": 2,
            "Watersheds": 4,
            "DeterioratingInfrastructure": 3,
            "PopulationScore": 4,
            "WetlandLoss": 3,
            "InadequatePlanning": 2,
            "PoliticalFactors": 2,
        },
    },
]


def classify_risk(prob: float) -> Tuple[str, str, str]:
    """Returns (category, color_hex, severity_description)."""
    if prob < 0.38:
        return "LOW", "#10b981", "Minimal flood potential; routine monitoring sufficient."
    elif prob < 0.52:
        return "MODERATE", "#3b82f6", "Elevated runoff probability; verify drainage clear paths."
    elif prob < 0.68:
        return "HIGH", "#f59e0b", "High risk of flash flooding / overtopping; alert local emergency units."
    elif prob < 0.80:
        return "SEVERE", "#f97316", "Severe inundation hazard; prepare evacuation corridors and deploy barriers."
    else:
        return "CRITICAL", "#ef4444", "Catastrophic breach / flood probability; initiate immediate emergency action plan."


class FloodEnsemblePredictor:
    """
    Core ML Ensemble Predictor for continuous Flood Probability estimation.
    Ensemble includes:
      - XGBoost (XGBRegressor)
      - LightGBM (LGBMRegressor)
      - CatBoost (CatBoostRegressor)
    Aggregated via scikit-learn VotingRegressor.
    """

    _instance: Optional[FloodEnsemblePredictor] = None
    _lock = threading.Lock()

    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path or self._resolve_data_path()
        self.model_cache_path = self._resolve_model_cache_path()
        self.ensemble = None
        self.models_dict = {}
        self.metrics: Dict[str, Any] = {}
        self.feature_importances: Dict[str, float] = {}
        self.training_sample_count = 0
        self.is_trained = False

        # Attempt to load or train model
        self._initialize_model()

    @classmethod
    def get_instance(cls) -> FloodEnsemblePredictor:
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def _resolve_data_path(self) -> str:
        candidates = [
            os.path.join(os.path.dirname(__file__), "data", "flood.csv"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "Flood_Predictor", "flood.csv"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "flood.csv"),
            "flood.csv",
            "Flood_Predictor/flood.csv",
        ]
        for p in candidates:
            if os.path.exists(p):
                return os.path.abspath(p)
        return os.path.abspath(candidates[0])

    def _resolve_model_cache_path(self) -> str:
        return os.path.join(os.path.dirname(__file__), "data", "flood_ensemble_model.joblib")

    def _initialize_model(self):
        """Loads cached model or trains on default dataset."""
        if os.path.exists(self.model_cache_path):
            try:
                cached = joblib.load(self.model_cache_path)
                self.ensemble = cached.get("ensemble")
                self.models_dict = cached.get("models_dict", {})
                self.metrics = cached.get("metrics", {})
                self.feature_importances = cached.get("feature_importances", {})
                self.training_sample_count = cached.get("training_sample_count", 5000)
                self.is_trained = True
                logger.info("Loaded pre-trained FloodEnsemblePredictor from cache.")
                return
            except Exception as e:
                logger.warning("Could not load cached model (%s); will re-train.", e)

        # Train on dataset if available
        if os.path.exists(self.data_path):
            self.train(self.data_path)
        else:
            logger.warning("No dataset found at %s. Will generate default dataset.", self.data_path)
            self._generate_and_train_default()

    def _generate_and_train_default(self):
        """Generates synthetic benchmark and trains ensemble."""
        os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
        np.random.seed(42)
        n_samples = 3000
        data = {}
        for feat in FEATURE_NAMES:
            data[feat] = np.clip(np.random.poisson(lam=5.0, size=n_samples) + np.random.randint(0, 3, size=n_samples), 0, 16)
        df = pd.DataFrame(data)
        feature_sum = df.sum(axis=1)
        raw_prob = (
            0.05
            + 0.00445 * feature_sum
            + 0.0008 * (df["MonsoonIntensity"] * (16 - df["DamsQuality"]))
            + 0.0006 * (df["Deforestation"] * df["Landslides"])
            + 0.0005 * (df["Urbanization"] * (16 - df["DrainageSystems"]))
            + np.random.normal(0, 0.015, size=n_samples)
        )
        df["FloodProbability"] = np.clip(np.round(raw_prob, 4), 0.05, 0.98)
        df.to_csv(self.data_path, index=False)
        self.train(self.data_path)

    def train(self, csv_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Trains the XGBoost + LightGBM + CatBoost VotingRegressor ensemble.
        Calculates and stores R², MSE, and MAE metrics.
        """
        path = csv_path or self.data_path
        if not os.path.exists(path):
            raise FileNotFoundError(f"Training dataset not found at: {path}")

        df = pd.read_csv(path)
        if "FloodProbability" not in df.columns:
            raise ValueError("Dataset missing 'FloodProbability' target column.")

        X = df[FEATURE_NAMES]
        y = df["FloodProbability"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # 1. Define constituent models with graceful fallbacks
        estimators = []
        models_dict = {}

        # XGBoost
        try:
            from xgboost import XGBRegressor
            xgb = XGBRegressor(n_estimators=200, learning_rate=0.05, random_state=42, n_jobs=2)
            estimators.append(("xgb", xgb))
            models_dict["xgboost"] = "XGBRegressor (n_estimators=200, lr=0.05)"
        except ImportError:
            from sklearn.ensemble import GradientBoostingRegressor
            xgb = GradientBoostingRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
            estimators.append(("xgb", xgb))
            models_dict["xgboost"] = "GradientBoostingRegressor (fallback)"

        # LightGBM
        try:
            from lightgbm import LGBMRegressor
            lgb = LGBMRegressor(n_estimators=200, learning_rate=0.05, random_state=42, verbose=-1, n_jobs=2)
            estimators.append(("lgb", lgb))
            models_dict["lightgbm"] = "LGBMRegressor (n_estimators=200, lr=0.05)"
        except ImportError:
            from sklearn.ensemble import HistGradientBoostingRegressor
            lgb = HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, random_state=42)
            estimators.append(("lgb", lgb))
            models_dict["lightgbm"] = "HistGradientBoostingRegressor (fallback)"

        # CatBoost
        try:
            from catboost import CatBoostRegressor
            cat = CatBoostRegressor(iterations=200, learning_rate=0.05, verbose=0, random_state=42, thread_count=2)
            estimators.append(("cat", cat))
            models_dict["catboost"] = "CatBoostRegressor (iterations=200, lr=0.05)"
        except ImportError:
            from sklearn.ensemble import RandomForestRegressor
            cat = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=2)
            estimators.append(("cat", cat))
            models_dict["catboost"] = "RandomForestRegressor (fallback)"

        # 2. Ensemble (VotingRegressor)
        from sklearn.ensemble import VotingRegressor
        ensemble = VotingRegressor(estimators=estimators)
        ensemble.fit(X_train, y_train)

        # 3. Evaluation
        y_pred = ensemble.predict(X_test)
        r2 = float(r2_score(y_test, y_pred))
        mse = float(mean_squared_error(y_test, y_pred))
        mae = float(mean_absolute_error(y_test, y_pred))

        # Compute individual model metrics
        model_scores = {}
        for name, est in ensemble.named_estimators_.items():
            sub_pred = est.predict(X_test)
            model_scores[name] = {
                "r2_score": round(float(r2_score(y_test, sub_pred)), 4),
                "mse": round(float(mean_squared_error(y_test, sub_pred)), 6),
                "mae": round(float(mean_absolute_error(y_test, sub_pred)), 4),
            }

        # Compute feature importances
        importances = np.zeros(len(FEATURE_NAMES))
        for name, est in ensemble.named_estimators_.items():
            if hasattr(est, "feature_importances_"):
                imp = est.feature_importances_
                # Normalize
                if np.sum(imp) > 0:
                    imp = imp / np.sum(imp)
                importances += imp
        importances = importances / len(ensemble.named_estimators_)
        feat_imp_dict = {
            FEATURE_NAMES[i]: round(float(importances[i]), 4)
            for i in range(len(FEATURE_NAMES))
        }
        # Sort by importance descending
        feat_imp_dict = dict(sorted(feat_imp_dict.items(), key=lambda item: item[1], reverse=True))

        self.ensemble = ensemble
        self.models_dict = models_dict
        self.metrics = {
            "r2_score": round(r2, 4),
            "r2_score_pct": round(r2 * 100, 2),
            "mse": round(mse, 6),
            "mse_pct": round(mse * 100, 4),
            "mae": round(mae, 4),
            "mae_pct": round(mae * 100, 4),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "total_samples": int(len(df)),
            "ensemble_weights": {
                "xgboost": 0.333,
                "lightgbm": 0.333,
                "catboost": 0.334,
            },
            "sub_model_metrics": model_scores,
        }
        self.feature_importances = feat_imp_dict
        self.training_sample_count = len(df)
        self.is_trained = True

        # Cache to disk
        try:
            os.makedirs(os.path.dirname(self.model_cache_path), exist_ok=True)
            joblib.dump(
                {
                    "ensemble": self.ensemble,
                    "models_dict": self.models_dict,
                    "metrics": self.metrics,
                    "feature_importances": self.feature_importances,
                    "training_sample_count": self.training_sample_count,
                },
                self.model_cache_path,
            )
            logger.info("Saved trained model cache to %s", self.model_cache_path)
        except Exception as e:
            logger.warning("Could not cache model to disk: %s", e)

        return self.get_metrics()

    def get_metrics(self) -> Dict[str, Any]:
        """Returns comprehensive model metrics and metadata."""
        return {
            "status": "TRAINED" if self.is_trained else "UNTRAINED",
            "model_architecture": "XGBoost + LightGBM + CatBoost VotingRegressor",
            "metrics": self.metrics,
            "feature_importances": self.feature_importances,
            "feature_categories": FEATURE_CATEGORIES,
            "feature_descriptions": FEATURE_DESCRIPTIONS,
            "feature_names": FEATURE_NAMES,
            "training_samples": self.training_sample_count,
        }

    def predict_single(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts continuous flood probability for a single set of 20 features.
        Returns probability, risk level, contributor ranking, and actionable mitigations.
        """
        if not self.is_trained or self.ensemble is None:
            self._initialize_model()

        # Build feature row with defaults (mean ~ 5.0)
        row = []
        cleaned_features = {}
        for feat in FEATURE_NAMES:
            val = float(features.get(feat, 5.0))
            val = max(0.0, min(16.0, val))
            row.append(val)
            cleaned_features[feat] = val

        X_input = pd.DataFrame([row], columns=FEATURE_NAMES)
        pred_prob = float(self.ensemble.predict(X_input)[0])
        # Clip to [0.0, 1.0]
        pred_prob = max(0.01, min(0.99, round(pred_prob, 4)))

        # Sub-model predictions
        sub_preds = {}
        for name, est in self.ensemble.named_estimators_.items():
            sub_preds[name] = round(float(est.predict(X_input)[0]), 4)

        # Risk classification
        risk_cat, color_hex, risk_desc = classify_risk(pred_prob)

        # Top contributing risk factors
        factor_scores = []
        for feat in FEATURE_NAMES:
            val = cleaned_features[feat]
            # Inverse weighting for positive qualities (e.g. DamsQuality, DrainageSystems)
            if feat in ["DamsQuality", "DrainageSystems"]:
                impact_factor = (16.0 - val) * self.feature_importances.get(feat, 0.05)
            else:
                impact_factor = val * self.feature_importances.get(feat, 0.05)
            factor_scores.append(
                {
                    "feature": feat,
                    "value": val,
                    "impact_score": round(float(impact_factor), 4),
                    "description": FEATURE_DESCRIPTIONS.get(feat, ""),
                }
            )

        factor_scores.sort(key=lambda x: x["impact_score"], reverse=True)

        # Actionable recommendations based on top risk drivers
        mitigations = self._generate_mitigations(cleaned_features, factor_scores[:4])

        return {
            "flood_probability": pred_prob,
            "flood_probability_pct": round(pred_prob * 100, 2),
            "risk_category": risk_cat,
            "color_hex": color_hex,
            "severity_description": risk_desc,
            "sub_model_predictions": sub_preds,
            "top_risk_factors": factor_scores[:6],
            "all_features": cleaned_features,
            "mitigation_recommendations": mitigations,
            "model_used": "XGBoost + LightGBM + CatBoost VotingRegressor (Ensemble)",
        }

    def predict_batch(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Predicts flood probability for multiple scenarios."""
        return [self.predict_single(rec) for rec in records]

    def _generate_mitigations(
        self, features: Dict[str, float], top_factors: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Generates domain-specific mitigation steps based on highest risk contributors."""
        recs = []
        for factor in top_factors:
            f_name = factor["feature"]
            val = factor["value"]

            if f_name == "MonsoonIntensity" and val > 8:
                recs.append({
                    "target": "Spillway & Reservoirs",
                    "action": "Initiate pre-depletion drawdown on upstream dams to buffer extreme monsoon surge.",
                    "urgency": "HIGH",
                })
            elif f_name == "DamsQuality" and val < 8:
                recs.append({
                    "target": "Dam Structural Health",
                    "action": "Immediate geotechnical piezometer and seepage survey; reduce full reservoir level (FRL).",
                    "urgency": "CRITICAL",
                })
            elif f_name == "Siltation" and val > 8:
                recs.append({
                    "target": "Reservoir & Channel Sediment",
                    "action": "Activate bottom outlet scouring flushes and clear downstream bridge aggradation.",
                    "urgency": "MEDIUM",
                })
            elif f_name == "Landslides" and val > 9:
                recs.append({
                    "target": "Himalayan Slopes & Tributaries",
                    "action": "Deploy UAV LiDAR for landslide dam monitoring on steep tributary gorges.",
                    "urgency": "HIGH",
                })
            elif f_name == "DrainageSystems" and val < 8:
                recs.append({
                    "target": "Urban & Valley Culverts",
                    "action": "Mobilize municipal heavy pumps and unblock stormwater outfalls.",
                    "urgency": "HIGH",
                })
            elif f_name == "IneffectiveDisasterPreparedness" and val > 8:
                recs.append({
                    "target": "Emergency Ops Center (EOC)",
                    "action": "Trigger automated siren broadcast and test SMS geo-fenced warning beacons.",
                    "urgency": "CRITICAL",
                })
            elif f_name == "Encroachments" and val > 8:
                recs.append({
                    "target": "Floodplain Management",
                    "action": "Enforce temporary exclusion zonation in low-lying Riverfront settlements.",
                    "urgency": "HIGH",
                })

        if not recs:
            recs.append({
                "target": "Routine Surveillance",
                "action": "Maintain standard 6-hourly telemetry logging and automated satellite SAR surveillance.",
                "urgency": "LOW",
            })
        return recs

    def map_scenario_to_features(self, scenario_dict: Dict[str, Any]) -> Dict[str, float]:
        """
        Maps hydrodynamic scenario parameters (e.g. Tehri Dam, Rishi Ganga)
        to the 20 ML flood prediction feature space.
        """
        # Default baseline
        feats = {f: 5.0 for f in FEATURE_NAMES}

        # Dam Height / Volume impact
        dam_h = float(scenario_dict.get("dam_height_m", 260.5))
        vol = float(scenario_dict.get("reservoir_volume_m3", 3.54e9))
        is_hypo = bool(scenario_dict.get("is_hypothetical", False))

        if dam_h > 200 or vol > 1e9:
            feats["DamsQuality"] = 4.0 if is_hypo else 14.0
            feats["Watersheds"] = 14.0
            feats["TopographyDrainage"] = 13.0
            feats["MonsoonIntensity"] = 12.0
            feats["Landslides"] = 11.0
            feats["Siltation"] = 12.0
            feats["PopulationScore"] = 12.0
            feats["Deforestation"] = 9.0
            feats["RiverManagement"] = 6.0
        elif "landslide" in str(scenario_dict.get("dam_type", "")).lower():
            feats["DamsQuality"] = 3.0
            feats["Landslides"] = 16.0
            feats["TopographyDrainage"] = 15.0
            feats["Siltation"] = 14.0
            feats["MonsoonIntensity"] = 10.0
            feats["Watersheds"] = 12.0
            feats["PopulationScore"] = 7.0
            feats["IneffectiveDisasterPreparedness"] = 11.0
        else:
            feats["DamsQuality"] = 9.0
            feats["MonsoonIntensity"] = 8.0
            feats["TopographyDrainage"] = 7.0

        return feats


_PREDICTOR_INSTANCE: Optional[FloodEnsemblePredictor] = None


def get_flood_predictor() -> FloodEnsemblePredictor:
    """Singleton getter for the FloodEnsemblePredictor engine."""
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None:
        _PREDICTOR_INSTANCE = FloodEnsemblePredictor.get_instance()
    return _PREDICTOR_INSTANCE
