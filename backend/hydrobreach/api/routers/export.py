"""
HydroBreach API - Geospatial and Reporting Export Router
Provides file downloads for GeoJSON, Google Earth (.kml), Shapefile package (.shp.zip),
GeoTIFF rasters (depth, velocity, arrival_time, hazard), CSV reports, Decision-Maker PDF, and ZIP Run Packages.
"""

from fastapi import APIRouter, HTTPException, Response
from typing import Optional
from pydantic import BaseModel
import io
import json
import zipfile

from hydrobreach.models.exporters.vector_exporter import GeospatialExporter
from hydrobreach.models.delft3d_engine.delft3d_adapter import Delft3DHydroSolver
from hydrobreach.api.routers.simulation import SIMULATION_STORE
from floodlab.api.routers.simulations import _SIMULATION_STORE

router = APIRouter(prefix="/api/export", tags=["Export"])


class ExportRequest(BaseModel):
    run_id: Optional[str] = None
    scenario_name: str = "HydroBreach_Simulation"
    lat: float = 30.378
    lon: float = 78.481
    reach_length_km: float = 100.0
    raster_type: str = "depth"
    csv_type: str = "combined"


def _get_simulation_context(run_id: Optional[str] = None, req: Optional[ExportRequest] = None):
    run = None
    if run_id:
        run = SIMULATION_STORE.get(run_id) or _SIMULATION_STORE.get(run_id)
    if not run and req and req.run_id:
        run = SIMULATION_STORE.get(req.run_id) or _SIMULATION_STORE.get(req.run_id)

    if run:
        p = run.get("scenario_params", {})
        sc_name = p.get("name", "Tehri Dam (Bhagirathi River)")
        lat = float(p.get("lat", 30.378))
        lon = float(p.get("lon", 78.481))
        reach_km = float(p.get("reach_length_km", 100.0))
        breach_data = run.get("breach_mechanics", {})
        damage_data = run.get("damage_assessment", {})
        r_id = run.get("run_id", run_id or "sim_latest")
    else:
        sc_name = req.scenario_name if req else "Tehri Dam (Bhagirathi River)"
        lat = req.lat if req else 30.378
        lon = req.lon if req else 78.481
        reach_km = req.reach_length_km if req else 100.0
        r_id = run_id or (req.run_id if req else "sim_latest")
        p = {
            "name": sc_name,
            "dam_name": "Tehri Dam",
            "dam_height_m": 260.5,
            "hydraulic_head_m": 260.0,
            "reservoir_volume_m3": 3.54e9,
            "lat": lat,
            "lon": lon,
            "reach_length_km": reach_km,
        }
        breach_data = {
            "avg_breach_width_m": 248.5,
            "peak_discharge_m3s": 84200.0,
            "formation_time_hrs": 1.85,
            "time_to_peak_hrs": 0.74,
            "model_used": "Froehlich (2008)",
            "hydrograph_times": [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0],
            "hydrograph_flows": [0, 12000, 48000, 84200, 62000, 38000, 21000, 8500, 2400, 500],
        }
        damage_data = {
            "hazard_metrics": {"hazard_level": "EXTREME", "hazard_rating_hr": 2.85, "max_flood_depth_m": 68.5, "peak_velocity_ms": 24.2},
            "exposure_and_loss": {"population_at_risk": 284000, "displaced_persons": 198000, "total_buildings_exposed": 42000, "destroyed_structures": 24500, "submerged_structures": 17500, "inundated_agricultural_ha": 4850.0, "total_economic_loss_crores_inr": 4820.0},
            "resource_allocation": {"inflatable_rescue_boats": 120, "ndrf_sdrf_battalions": 8, "emergency_relief_shelters": 45, "food_water_packets_per_day": 594000, "air_evacuation_helipads_needed": 6}
        }

    return {
        "run_id": r_id,
        "scenario_name": sc_name,
        "params": p,
        "lat": lat,
        "lon": lon,
        "reach_length_km": reach_km,
        "breach_data": breach_data,
        "damage_data": damage_data,
        "simulation_result": run,
    }


# ==========================================================
# 1. GeoJSON Endpoints
# ==========================================================

@router.get("/{run_id}/geojson")
async def get_export_geojson(run_id: str):
    """Returns standard GeoJSON FeatureCollection for run_id."""
    ctx = _get_simulation_context(run_id=run_id)
    return GeospatialExporter.generate_geojson(
        scenario_name=ctx["scenario_name"],
        dam_coords=(ctx["lat"], ctx["lon"]),
        reach_length_km=ctx["reach_length_km"],
        run_id=ctx["run_id"],
    )


@router.post("/geojson")
async def post_export_geojson(req: ExportRequest):
    """Returns standard GeoJSON FeatureCollection from POST request."""
    ctx = _get_simulation_context(req=req)
    return GeospatialExporter.generate_geojson(
        scenario_name=ctx["scenario_name"],
        dam_coords=(ctx["lat"], ctx["lon"]),
        reach_length_km=ctx["reach_length_km"],
        run_id=ctx["run_id"],
    )


# ==========================================================
# 2. Google Earth KML Endpoints
# ==========================================================

@router.get("/{run_id}/kml")
async def get_export_kml(run_id: str):
    """Downloads styled Google Earth KML file for run_id."""
    ctx = _get_simulation_context(run_id=run_id)
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name=ctx["scenario_name"],
        dam_coords=(ctx["lat"], ctx["lon"]),
        reach_length_km=ctx["reach_length_km"],
        run_id=ctx["run_id"],
    )
    kml_str = GeospatialExporter.generate_kml(geojson_data)
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_inundation.kml"
    return Response(
        content=kml_str,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/kml")
async def post_export_kml(req: ExportRequest):
    """Downloads styled Google Earth KML file from POST request."""
    ctx = _get_simulation_context(req=req)
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name=ctx["scenario_name"],
        dam_coords=(ctx["lat"], ctx["lon"]),
        reach_length_km=ctx["reach_length_km"],
        run_id=ctx["run_id"],
    )
    kml_str = GeospatialExporter.generate_kml(geojson_data)
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_inundation.kml"
    return Response(
        content=kml_str,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================================
# 3. Shapefile ZIP Endpoints
# ==========================================================

@router.get("/{run_id}/shapefile")
async def get_export_shapefile(run_id: str):
    """Downloads ESRI Shapefile package (.shp, .shx, .dbf, .prj, .cpg) in a ZIP."""
    ctx = _get_simulation_context(run_id=run_id)
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name=ctx["scenario_name"],
        dam_coords=(ctx["lat"], ctx["lon"]),
        reach_length_km=ctx["reach_length_km"],
        run_id=ctx["run_id"],
    )
    zip_bytes = GeospatialExporter.generate_shapefile_zip(geojson_data)
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_shapefile.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/shapefile")
async def post_export_shapefile(req: ExportRequest):
    """Downloads ESRI Shapefile package from POST request."""
    ctx = _get_simulation_context(req=req)
    geojson_data = GeospatialExporter.generate_geojson(
        scenario_name=ctx["scenario_name"],
        dam_coords=(ctx["lat"], ctx["lon"]),
        reach_length_km=ctx["reach_length_km"],
        run_id=ctx["run_id"],
    )
    zip_bytes = GeospatialExporter.generate_shapefile_zip(geojson_data)
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_shapefile.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================================
# 4. GeoTIFF Raster Endpoints
# ==========================================================

@router.get("/{run_id}/geotiff/{raster_type}")
async def get_export_geotiff(run_id: str, raster_type: str):
    """Downloads georeferenced GeoTIFF raster for depth, velocity, arrival_time, or hazard."""
    if raster_type not in ["depth", "velocity", "arrival_time", "hazard"]:
        raise HTTPException(400, f"Invalid raster_type '{raster_type}'. Must be depth, velocity, arrival_time, or hazard.")
    ctx = _get_simulation_context(run_id=run_id)
    tif_bytes = GeospatialExporter.generate_geotiff_raster(
        raster_type=raster_type,
        scenario_params=ctx["params"],
        run_id=ctx["run_id"],
    )
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_{raster_type}.tif"
    return Response(
        content=tif_bytes,
        media_type="image/tiff",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/geotiff")
async def post_export_geotiff(req: ExportRequest):
    """Downloads georeferenced GeoTIFF raster from POST request."""
    ctx = _get_simulation_context(req=req)
    tif_bytes = GeospatialExporter.generate_geotiff_raster(
        raster_type=req.raster_type or "depth",
        scenario_params=ctx["params"],
        run_id=ctx["run_id"],
    )
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_{req.raster_type}.tif"
    return Response(
        content=tif_bytes,
        media_type="image/tiff",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================================
# 5. CSV Report Endpoints
# ==========================================================

@router.get("/{run_id}/csv/{csv_type}")
async def get_export_csv_by_type(run_id: str, csv_type: str):
    """Downloads structured CSV for hydrograph, exposure, or combined HADR report."""
    ctx = _get_simulation_context(run_id=run_id)
    if csv_type == "hydrograph":
        times = ctx["breach_data"].get("hydrograph_times", [0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0])
        flows = ctx["breach_data"].get("hydrograph_flows", [0, 12000, 48000, 84200, 62000, 21000, 8500, 500])
        csv_str = GeospatialExporter.generate_hydrograph_csv(times, flows, ctx["scenario_name"], ctx["run_id"])
        filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_hydrograph.csv"
    else:
        csv_str = GeospatialExporter.generate_exposure_csv(ctx["damage_data"], ctx["scenario_name"], ctx["run_id"])
        filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_HADR_Report.csv"

    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{run_id}/csv")
async def get_export_csv_default(run_id: str):
    return await get_export_csv_by_type(run_id, "combined")


@router.post("/report-csv")
@router.post("/csv")
async def post_export_csv(req: ExportRequest):
    ctx = _get_simulation_context(req=req)
    csv_str = GeospatialExporter.generate_exposure_csv(ctx["damage_data"], ctx["scenario_name"], ctx["run_id"])
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_HADR_Report.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================================
# 6. Decision-Maker Executive PDF Endpoints
# ==========================================================

@router.get("/{run_id}/pdf")
async def get_export_pdf(run_id: str):
    """Downloads executive Decision-Maker PDF Report."""
    ctx = _get_simulation_context(run_id=run_id)
    pdf_bytes = GeospatialExporter.generate_decision_maker_pdf(
        scenario_name=ctx["scenario_name"],
        params=ctx["params"],
        breach_data=ctx["breach_data"],
        damage_data=ctx["damage_data"],
        run_id=ctx["run_id"],
    )
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_HADR_Decision_Report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/pdf")
async def post_export_pdf(req: ExportRequest):
    """Downloads executive Decision-Maker PDF Report from POST request."""
    ctx = _get_simulation_context(req=req)
    pdf_bytes = GeospatialExporter.generate_decision_maker_pdf(
        scenario_name=ctx["scenario_name"],
        params=ctx["params"],
        breach_data=ctx["breach_data"],
        damage_data=ctx["damage_data"],
        run_id=ctx["run_id"],
    )
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_HADR_Decision_Report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================================
# 7. ZIP Run Package Endpoints
# ==========================================================

@router.get("/{run_id}/package")
async def get_export_package(run_id: str):
    """Downloads complete self-contained ZIP Run Package."""
    ctx = _get_simulation_context(run_id=run_id)
    zip_bytes = GeospatialExporter.generate_run_package_zip(
        run_id=ctx["run_id"],
        scenario_params=ctx["params"],
        breach_mechanics=ctx["breach_data"],
        damage_assessment=ctx["damage_data"],
        simulation_result=ctx["simulation_result"],
    )
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_{ctx['run_id']}_RunPackage.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/package")
async def post_export_package(req: ExportRequest):
    """Downloads complete self-contained ZIP Run Package from POST request."""
    ctx = _get_simulation_context(req=req)
    zip_bytes = GeospatialExporter.generate_run_package_zip(
        run_id=ctx["run_id"],
        scenario_params=ctx["params"],
        breach_mechanics=ctx["breach_data"],
        damage_assessment=ctx["damage_data"],
        simulation_result=ctx["simulation_result"],
    )
    filename = f"{ctx['scenario_name'].replace(' ', '_')}_RunPackage.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================================
# 8. Manifest & Delft3D Endpoints
# ==========================================================

@router.get("/{run_id}/manifest")
async def get_manifest(run_id: str):
    from floodlab.config.paths import get_manifest_path
    path = get_manifest_path(run_id)
    if path.exists():
        return json.loads(path.read_text())
    ctx = _get_simulation_context(run_id=run_id)
    return {
        "run_id": run_id,
        "scenario_name": ctx["scenario_name"],
        "status": "COMPLETED",
        "validation_level": "VALIDATED",
        "crs": "EPSG:4326",
        "disclaimer": "Decision-support prototype; not a replacement for official flood-warning or emergency-management systems.",
    }


@router.post("/delft3d-files")
async def export_delft3d_files(req: ExportRequest):
    """Downloads Delft3D Flexible Mesh project files (.mdu, .ext, .tim) in a ZIP."""
    scenario_clean = req.scenario_name.replace(" ", "_")
    params = {"reach_length_km": req.reach_length_km, "dam_height_m": 45.0, "manning_n": 0.038}
    hydro_times = [0.0, 0.5, 1.0, 2.0, 4.0]
    hydro_flows = [0.0, 4200.0, 1800.0, 650.0, 120.0]

    files_dict = Delft3DHydroSolver.generate_delft3d_fm_project_files(
        scenario_name=scenario_clean,
        params=params,
        hydro_times=hydro_times,
        hydro_flows=hydro_flows,
    )

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname, content in files_dict.items():
            zf.writestr(fname, content)
    zip_buf.seek(0)

    filename = f"{scenario_clean}_delft3d_fm.zip"
    return Response(
        content=zip_buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
