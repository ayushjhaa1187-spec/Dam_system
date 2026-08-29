"""
Unit & Integration Tests for Google Earth Engine & Satellite Surveillance:
- Surveillance zones listing
- Active alerts with provenance
- Sentinel-1 SAR change detection & Otsu thresholding
- Sentinel-2 Optical cloud filtering & MNDWI
- Permanent-water masking
- Slope masking (> 8° false-positive removal)
- Model vs Observation spatial comparison (CSI, POD, FAR, MAE)
- Satellite detected flood polygon export
- Satellite API routes
"""

import pytest
from hydrobreach.models.gee_monitor.gee_service import GEESentinel1Monitor
from fastapi.testclient import TestClient
from floodlab.api.main import app

client = TestClient(app)


def test_gee_zones_listing():
    zones = GEESentinel1Monitor.SURVEILLANCE_ZONES
    assert len(zones) >= 4
    zone_ids = [z["id"] for z in zones]
    assert "zone_rishi_ganga" in zone_ids
    assert "zone_bhagirathi_tehri" in zone_ids


def test_gee_active_alerts():
    alerts = GEESentinel1Monitor.get_active_alerts()
    assert len(alerts) >= 2
    for alt in alerts:
        assert "alert_id" in alt
        assert "impounded_area_ha" in alt
        assert "confidence" in alt
        assert "provenance" in alt
        assert alt["provenance"]["level"] == "OBSERVED / DERIVED"
        assert "disclaimer" in alt["provenance"]


def test_sentinel1_sar_analysis_with_masks():
    bbox = [79.65, 30.35, 79.95, 30.60]
    res = GEESentinel1Monitor.run_on_demand_sar_analysis(
        bbox=bbox,
        pre_date="2026-08-10",
        post_date="2026-08-24",
        polarization="VV",
        sensor_type="sentinel_1_sar",
        apply_permanent_water_mask=True,
        apply_slope_mask=True,
        max_slope_deg=8.0,
    )

    assert res["status"] == "SUCCESS"
    assert "sensor_metadata" in res
    assert "Sentinel-1" in res["sensor_metadata"]["sensor"]
    assert res["sensor_metadata"]["threshold_applied"] == -16.5
    assert "data_latency_hrs" in res["sensor_metadata"]

    # Masking pipeline
    masking = res["masking_pipeline"]
    assert masking["permanent_water_mask_applied"] is True
    assert masking["slope_mask_applied"] is True
    assert masking["permanent_water_masked_ha"] > 0
    assert masking["slope_shadow_masked_ha"] > 0
    assert masking["net_flood_inundation_ha"] < masking["raw_water_detected_ha"]

    # Simulation comparison
    comp = res["simulation_comparison"]
    assert "critical_success_index_csi" in comp
    assert "probability_of_detection_pod" in comp
    assert "false_alarm_ratio_far" in comp
    assert comp["critical_success_index_csi"] > 0.60
    assert "classification_breakdown" in comp
    assert "true_positives_km2" in comp["classification_breakdown"]

    # GeoJSON layers
    layers = res["geojson_layers"]
    assert "observed_extent" in layers
    assert "modelled_extent" in layers
    assert "difference_layer" in layers
    assert layers["observed_extent"]["properties"]["layer_type"] == "OBSERVED_FLOOD_EXTENT"
    assert layers["modelled_extent"]["properties"]["layer_type"] == "MODELLED_INUNDATION"
    assert layers["difference_layer"]["properties"]["layer_type"] == "DIFFERENCE_LAYER"


def test_sentinel2_optical_analysis():
    bbox = [78.30, 30.25, 78.85, 30.70]
    res = GEESentinel1Monitor.run_on_demand_sar_analysis(
        bbox=bbox,
        sensor_type="sentinel_2_optical",
        cloud_cover_pct=12.5,
    )
    assert res["status"] == "SUCCESS"
    assert "Sentinel-2" in res["sensor_metadata"]["sensor"]
    assert "MNDWI" in res["sensor_metadata"]["processing_method"]


def test_satellite_api_endpoints():
    # Alerts
    res = client.get("/api/satellite/alerts")
    assert res.status_code == 200
    assert "alerts" in res.json()

    # Zones
    res = client.get("/api/satellite/zones")
    assert res.status_code == 200
    assert "zones" in res.json()

    # Analyze
    analyze_res = client.post("/api/satellite/analyse", json={
        "bbox": [78.30, 30.25, 78.85, 30.70],
        "sensor_type": "sentinel_1_sar",
        "apply_permanent_water_mask": True,
        "apply_slope_mask": True,
    })
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert "detected_water" in data
    assert "simulation_comparison" in data

    # Export polygon
    export_res = client.post("/api/satellite/export-detected-polygon", json={
        "bbox": [78.30, 30.25, 78.85, 30.70],
    })
    assert export_res.status_code == 200
    assert export_res.headers["content-type"] == "application/geo+json"
    assert export_res.json()["type"] == "FeatureCollection"
