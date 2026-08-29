"""
Unit & Integration Tests for Comprehensive Multi-Format Exporters:
- GeoJSON (EPSG:4326, properties, disclaimers)
- KML (OGC 2.2, 3D polygons, placemarks)
- Shapefile ZIP (.shp, .shx, .dbf, .prj, .cpg)
- GeoTIFF rasters via rasterio (depth, velocity, arrival_time, hazard)
- CSV (hydrograph, exposure, logistics)
- Decision-Maker Executive PDF Report via ReportLab
- Complete ZIP Run Package
- Router export endpoints
"""

import io
import json
import zipfile
import pytest
import numpy as np
import rasterio

from hydrobreach.models.exporters.vector_exporter import GeospatialExporter
from fastapi.testclient import TestClient
from floodlab.api.main import app

client = TestClient(app)


def test_geojson_export_structure():
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name="Tehri Dam (Bhagirathi River)",
        dam_coords=(30.378, 78.481),
        reach_length_km=100.0,
        run_id="test_run_01",
        validation_status="VALIDATED",
    )

    assert geojson_data["type"] == "FeatureCollection"
    assert "properties" in geojson_data
    assert geojson_data["properties"]["crs"] == "EPSG:4326"
    assert geojson_data["properties"]["run_id"] == "test_run_01"
    assert "disclaimer" in geojson_data["properties"]
    assert "units" in geojson_data["properties"]

    features = geojson_data["features"]
    assert len(features) >= 5

    # Check dam axis point
    dam_feat = next((f for f in features if "Dam Axis" in f["properties"].get("name", "")), None)
    assert dam_feat is not None
    assert dam_feat["geometry"]["type"] == "Point"

    # Check hazard zone polygon
    zone_feat = next((f for f in features if f["geometry"]["type"] == "Polygon"), None)
    assert zone_feat is not None
    assert "hazard_rating" in zone_feat["properties"]
    assert "disclaimer" in zone_feat["properties"]


def test_kml_export_structure():
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name="Tehri Dam",
        dam_coords=(30.378, 78.481),
        reach_length_km=100.0,
        run_id="test_kml_run",
    )
    kml_str = GeospatialExporter.generate_kml(geojson_data)

    assert "<?xml version=" in kml_str
    assert '<kml xmlns="http://www.opengis.net/kml/2.2">' in kml_str
    assert "</kml>" in kml_str
    assert "<Placemark>" in kml_str
    assert "<Polygon>" in kml_str
    assert "<extrude>1</extrude>" in kml_str
    assert "test_kml_run" in kml_str


def test_shapefile_zip_export_structure():
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name="Tehri Dam",
        dam_coords=(30.378, 78.481),
        reach_length_km=100.0,
        run_id="test_shp_run",
    )
    shp_zip_bytes = GeospatialExporter.generate_shapefile_zip(geojson_data)

    assert len(shp_zip_bytes) > 200
    zip_buf = io.BytesIO(shp_zip_bytes)
    with zipfile.ZipFile(zip_buf, "r") as zf:
        namelist = zf.namelist()
        assert "inundation_hazard_zones.shp" in namelist
        assert "inundation_hazard_zones.shx" in namelist
        assert "inundation_hazard_zones.dbf" in namelist
        assert "inundation_hazard_zones.prj" in namelist
        assert "inundation_hazard_zones.cpg" in namelist
        assert "README_METADATA.txt" in namelist

        prj_content = zf.read("inundation_hazard_zones.prj").decode("utf-8")
        assert "WGS_1984" in prj_content

        cpg_content = zf.read("inundation_hazard_zones.cpg").decode("utf-8")
        assert "UTF-8" in cpg_content


def test_geotiff_raster_generation():
    params = {"name": "Tehri", "lat": 30.378, "lon": 78.481, "reach_length_km": 100.0, "dam_height_m": 260.5}

    for r_type in ["depth", "velocity", "arrival_time", "hazard"]:
        tif_bytes = GeospatialExporter.generate_geotiff_raster(
            raster_type=r_type,
            scenario_params=params,
            run_id="test_raster_run",
        )
        assert len(tif_bytes) > 500

        with rasterio.open(io.BytesIO(tif_bytes)) as ds:
            assert ds.crs.to_string() == "EPSG:4326"
            assert ds.count == 1
            assert ds.width == 120
            assert ds.height == 120
            assert ds.nodata == -9999.0

            tags = ds.tags()
            assert tags.get("RASTER_TYPE") == r_type
            assert tags.get("RUN_ID") == "test_raster_run"
            assert "UNITS" in tags
            assert "DISCLAIMER" in tags


def test_csv_exports():
    times = [0.0, 0.5, 1.0, 1.5, 2.0]
    flows = [0.0, 15000.0, 84200.0, 45000.0, 12000.0]

    hydro_csv = GeospatialExporter.generate_hydrograph_csv(times, flows, "Tehri Dam", "run_hydro_01")
    assert "# HydroBreach Outflow Hydrograph Export" in hydro_csv
    assert "Time_hrs,Time_min,Discharge_m3s,Cumulative_Volume_Mm3" in hydro_csv
    assert "0.000,0.0,0.0" in hydro_csv

    damage_data = {
        "hazard_metrics": {"hazard_level": "EXTREME", "hazard_rating_hr": 2.85, "max_flood_depth_m": 68.5, "peak_velocity_ms": 24.2},
        "exposure_and_loss": {"population_at_risk": 284000, "displaced_persons": 198000, "total_buildings_exposed": 42000, "destroyed_structures": 24500, "submerged_structures": 17500, "inundated_agricultural_ha": 4850.0, "total_economic_loss_crores_inr": 4820.0},
    }
    exp_csv = GeospatialExporter.generate_exposure_csv(damage_data, "Tehri Dam", "run_exp_01")
    assert "# HydroBreach HADR Settlement Exposure & Disaster Impact Summary" in exp_csv
    assert "Sirain Village" in exp_csv
    assert "284000" in exp_csv


def test_decision_maker_pdf_generation():
    params = {"name": "Tehri Dam", "dam_height_m": 260.5, "reservoir_volume_m3": 3.54e9}
    breach_data = {"peak_discharge_m3s": 84200.0, "formation_time_hrs": 1.85, "avg_breach_width_m": 248.5, "model_used": "Froehlich (2008)"}
    damage_data = {
        "hazard_metrics": {"hazard_level": "EXTREME", "hazard_rating_hr": 2.85, "max_flood_depth_m": 68.5, "peak_velocity_ms": 24.2},
        "exposure_and_loss": {"population_at_risk": 284000, "displaced_persons": 198000, "total_buildings_exposed": 42000, "destroyed_structures": 24500, "submerged_structures": 17500, "inundated_agricultural_ha": 4850.0, "total_economic_loss_crores_inr": 4820.0},
        "resource_allocation": {"ndrf_sdrf_battalions": 8, "inflatable_rescue_boats": 120, "emergency_relief_shelters": 45, "food_water_packets_per_day": 594000, "air_evacuation_helipads_needed": 6}
    }

    pdf_bytes = GeospatialExporter.generate_decision_maker_pdf(
        scenario_name="Tehri Dam",
        params=params,
        breach_data=breach_data,
        damage_data=damage_data,
        run_id="run_pdf_test",
    )

    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")


def test_run_package_zip_generation():
    params = {"name": "Tehri Dam", "lat": 30.378, "lon": 78.481, "reach_length_km": 100.0, "dam_height_m": 260.5, "reservoir_volume_m3": 3.54e9}
    breach = {"peak_discharge_m3s": 84200.0, "formation_time_hrs": 1.85, "hydrograph_times": [0, 1, 2], "hydrograph_flows": [0, 84200, 10000]}
    damage = {
        "hazard_metrics": {"hazard_level": "EXTREME", "hazard_rating_hr": 2.85, "max_flood_depth_m": 68.5, "peak_velocity_ms": 24.2},
        "exposure_and_loss": {"population_at_risk": 284000, "displaced_persons": 198000, "total_buildings_exposed": 42000, "destroyed_structures": 24500, "submerged_structures": 17500, "inundated_agricultural_ha": 4850.0, "total_economic_loss_crores_inr": 4820.0},
        "resource_allocation": {"ndrf_sdrf_battalions": 8, "inflatable_rescue_boats": 120, "emergency_relief_shelters": 45, "food_water_packets_per_day": 594000}
    }

    zip_bytes = GeospatialExporter.generate_run_package_zip(
        run_id="test_pkg_01",
        scenario_params=params,
        breach_mechanics=breach,
        damage_assessment=damage,
    )

    assert len(zip_bytes) > 2000
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        names = zf.namelist()
        assert "manifest.json" in names
        assert "parameters.json" in names
        assert "outputs.json" in names
        assert "vectors/inundation_hazard_zones.geojson" in names
        assert "vectors/inundation_hazard_zones.kml" in names
        assert "vectors/shapefile_package.zip" in names
        assert "rasters/depth_m.tif" in names
        assert "rasters/velocity_ms.tif" in names
        assert "reports/HADR_Decision_Report.pdf" in names
        assert "reports/hydrograph.csv" in names
        assert "reports/settlement_exposure.csv" in names
        assert "CITATIONS.md" in names
        assert "DISCLAIMER.txt" in names


def test_export_router_endpoints():
    run_id = "test_endpoint_run"

    # GeoJSON
    res = client.get(f"/api/export/{run_id}/geojson")
    assert res.status_code == 200
    assert res.json()["type"] == "FeatureCollection"

    # KML
    res = client.get(f"/api/export/{run_id}/kml")
    assert res.status_code == 200
    assert "<kml" in res.text

    # Shapefile
    res = client.get(f"/api/export/{run_id}/shapefile")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"

    # GeoTIFF
    res = client.get(f"/api/export/{run_id}/geotiff/depth")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/tiff"

    # CSV
    res = client.get(f"/api/export/{run_id}/csv/hydrograph")
    assert res.status_code == 200
    assert "Discharge_m3s" in res.text

    # PDF
    res = client.get(f"/api/export/{run_id}/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"

    # Package
    res = client.get(f"/api/export/{run_id}/package")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
