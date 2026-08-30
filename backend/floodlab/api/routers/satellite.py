"""
FloodLab API - Satellite Surveillance & Google Earth Engine Router
"""

from fastapi import APIRouter, Response
from typing import List
from pydantic import BaseModel, Field
import json

from hydrobreach.models.gee_monitor.gee_service import GEESentinel1Monitor
from floodlab.satellite.gee import GEESentinel1Module

router = APIRouter()


class SARAnalysisRequest(BaseModel):
    bbox: List[float] = Field(
        default=[79.65, 30.35, 79.95, 30.60],
        description="[min_lon, min_lat, max_lon, max_lat]",
    )
    pre_event_date: str = Field(default="2026-08-10")
    post_event_date: str = Field(default="2026-08-24")
    polarization: str = Field(default="VV", description="VV, VH, or VV+VH")
    sensor_type: str = Field(default="sentinel_1_sar", description="sentinel_1_sar or sentinel_2_optical")
    apply_permanent_water_mask: bool = Field(default=True)
    apply_slope_mask: bool = Field(default=True)
    max_slope_deg: float = Field(default=8.0)
    cloud_cover_pct: float = Field(default=15.0)


@router.get("/alerts")
async def get_alerts():
    alerts = GEESentinel1Monitor.get_active_alerts()
    return {"alerts": alerts, "zones": GEESentinel1Monitor.SURVEILLANCE_ZONES, "total_active_alerts": len(alerts)}


@router.get("/zones")
async def get_zones():
    return {"zones": GEESentinel1Monitor.SURVEILLANCE_ZONES}


@router.post("/analyse")
@router.post("/analyze")
async def analyze_sar(req: SARAnalysisRequest):
    return GEESentinel1Monitor.run_on_demand_sar_analysis(
        bbox=req.bbox,
        pre_date=req.pre_event_date,
        post_date=req.post_event_date,
        polarization=req.polarization,
        sensor_type=req.sensor_type,
        apply_permanent_water_mask=req.apply_permanent_water_mask,
        apply_slope_mask=req.apply_slope_mask,
        max_slope_deg=req.max_slope_deg,
        cloud_cover_pct=req.cloud_cover_pct,
    )


@router.post("/export-detected-polygon")
async def export_detected_polygon(req: SARAnalysisRequest):
    result = GEESentinel1Monitor.run_on_demand_sar_analysis(
        bbox=req.bbox,
        pre_date=req.pre_event_date,
        post_date=req.post_event_date,
        polarization=req.polarization,
        sensor_type=req.sensor_type,
        apply_permanent_water_mask=req.apply_permanent_water_mask,
        apply_slope_mask=req.apply_slope_mask,
    )
    observed_feature = result.get("geojson_layers", {}).get("observed_extent", {})
    geojson_collection = {
        "type": "FeatureCollection",
        "name": f"Sentinel_Detected_Flood_Extent_{req.post_event_date}",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "properties": result.get("sensor_metadata", {}),
        "features": [observed_feature] if observed_feature else [],
    }

    content_str = json.dumps(geojson_collection, indent=2)
    filename = f"satellite_detected_flood_{req.post_event_date}.geojson"
    return Response(
        content=content_str,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/sentinel1")
async def process_sentinel1(body: dict):
    module = GEESentinel1Module()
    return module.execute_workflow(
        body.get("aoi", {}), body.get("pre_event", "2023-01-01"), body.get("post_event", "2023-01-05")
    )
