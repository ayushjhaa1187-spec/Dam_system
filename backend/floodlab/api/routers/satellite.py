"""
FloodLab API - Satellite Surveillance & Google Earth Engine Router
"""

from fastapi import APIRouter, Response
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import json

from hydrobreach.models.gee_monitor.gee_service import GEESentinel1Monitor

router = APIRouter()


class SARAnalysisRequest(BaseModel):
    bbox: List[float] = Field(default=[79.65, 30.35, 79.95, 30.60], description="[min_lon, min_lat, max_lon, max_lat]")
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
async def analyse_sar(body: dict):
    bbox = body.get("bbox", [79.65, 30.35, 79.95, 30.60])
    pre_date = body.get("pre_event_date") or body.get("pre_date", "2026-08-10")
    post_date = body.get("post_event_date") or body.get("post_date", "2026-08-24")
    polarization = body.get("polarization", "VV")
    sensor_type = body.get("sensor_type", "sentinel_1_sar")
    apply_perm_water = body.get("apply_permanent_water_mask", True)
    apply_slope = body.get("apply_slope_mask", True)

    result = GEESentinel1Monitor.run_on_demand_sar_analysis(
        bbox=bbox,
        pre_date=pre_date,
        post_date=post_date,
        polarization=polarization,
        sensor_type=sensor_type,
        apply_permanent_water_mask=apply_perm_water,
        apply_slope_mask=apply_slope,
    )
    return result


@router.post("/export-detected-polygon")
async def export_detected_polygon(body: dict):
    bbox = body.get("bbox", [79.65, 30.35, 79.95, 30.60])
    post_date = body.get("post_event_date", "2026-08-24")
    result = GEESentinel1Monitor.run_on_demand_sar_analysis(
        bbox=bbox,
        post_date=post_date,
    )
    observed_feature = result.get("geojson_layers", {}).get("observed_extent", {})
    geojson_collection = {
        "type": "FeatureCollection",
        "name": f"Sentinel_Detected_Flood_Extent_{post_date}",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "properties": result.get("sensor_metadata", {}),
        "features": [observed_feature] if observed_feature else [],
    }

    content_str = json.dumps(geojson_collection, indent=2)
    filename = f"satellite_detected_flood_{post_date}.geojson"
    return Response(
        content=content_str,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
