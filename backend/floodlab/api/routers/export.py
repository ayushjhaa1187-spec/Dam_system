from fastapi import APIRouter
from fastapi.responses import FileResponse
from floodlab.exporters.gis import GISExporter

router = APIRouter()
exporter = GISExporter("/tmp")


@router.get("/{run_id}/shapefile")
async def export_shapefile(run_id: str):
    filepath = exporter.export_shp({}, run_id)
    return FileResponse(filepath, filename=f"{run_id}_shapefile.zip")


@router.get("/{run_id}/kml")
async def export_kml(run_id: str):
    filepath = exporter.export_kml({}, run_id)
    return FileResponse(filepath, filename=f"{run_id}.kml")


@router.get("/{run_id}/geojson")
async def export_geojson(run_id: str):
    filepath = exporter.export_geojson({}, run_id)
    return FileResponse(filepath, filename=f"{run_id}.geojson")


@router.get("/{run_id}/geotiff/{raster_type}")
async def export_geotiff(run_id: str, raster_type: str):
    # Dummy, return empty file for geotiff
    filepath = f"/tmp/{run_id}_{raster_type}.tif"
    with open(filepath, "w") as f:
        f.write("DUMMY TIFF")
    return FileResponse(filepath, filename=f"{run_id}_{raster_type}.tif")


@router.get("/{run_id}/csv/combined")
async def export_csv(run_id: str):
    filepath = exporter.export_csv([{"rank": 1, "settlement": "Tehri"}], f"{run_id}_report")
    return FileResponse(filepath, filename=f"{run_id}_report.csv")


@router.get("/{run_id}/pdf")
async def export_pdf(run_id: str):
    filepath = exporter.export_pdf(run_id)
    return FileResponse(filepath, filename=f"{run_id}_report.pdf")


@router.get("/{run_id}/package")
async def export_package(run_id: str):
    filepath = exporter.export_shp({}, run_id)
    return FileResponse(filepath, filename=f"{run_id}_package.zip")

