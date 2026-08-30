"""
Pre-Flight Dataset & Scenario Validator for HydroShield Generic Simulation Framework.
Verifies file integrity, CRS validity, AOI overlap, spatial containment, and physical bounds.
"""

from __future__ import annotations

from pathlib import Path
from typing import List

import pyproj
import rasterio
import shapely.geometry
from pydantic import BaseModel

from floodlab.geospatial.dataset_adapters import AOIAdapter
from floodlab.schemas.generic_scenario import ScenarioConfig


class ValidationIssue(BaseModel):
    field: str
    message: str
    rule_code: str
    severity: str = "ERROR"  # "ERROR" | "WARNING"


class ValidationReport(BaseModel):
    is_valid: bool
    scenario_id: str
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []
    checked_rules_count: int = 0
    summary: str = ""


class DatasetValidationError(Exception):
    """Raised when scenario dataset pre-flight validation fails."""

    def __init__(self, report: ValidationReport):
        self.report = report
        error_msgs = "\n - ".join([f"[{e.rule_code}] {e.field}: {e.message}" for e in report.errors])
        super().__init__(
            f"Dataset validation failed for scenario '{report.scenario_id}' with {len(report.errors)} error(s):\n - {error_msgs}"
        )


class GenericScenarioValidator:
    """Pre-flight validator ensuring datasets and scenario parameters are physically & spatially consistent."""

    @classmethod
    def validate(cls, config: ScenarioConfig, raise_on_error: bool = True) -> ValidationReport:
        errors: List[ValidationIssue] = []
        warnings: List[ValidationIssue] = []
        rules = 0

        # 1. Basin & AOI Boundary Checks
        rules += 1
        aoi_path = Path(config.basin.aoi_boundary)
        aoi_geom = None
        if not aoi_path.exists():
            errors.append(
                ValidationIssue(
                    field="basin.aoi_boundary",
                    message=f"AOI boundary file does not exist at '{aoi_path}'.",
                    rule_code="AOI_FILE_NOT_FOUND",
                )
            )
        else:
            try:
                aoi_geom, aoi_crs, aoi_bounds = AOIAdapter.load_aoi(aoi_path, target_crs="EPSG:4326")
                if not aoi_geom.is_valid:
                    warnings.append(
                        ValidationIssue(
                            field="basin.aoi_boundary",
                            message="AOI boundary geometry has self-intersections or is topologically invalid.",
                            rule_code="AOI_GEOM_INVALID",
                            severity="WARNING",
                        )
                    )
            except Exception as e:
                errors.append(
                    ValidationIssue(
                        field="basin.aoi_boundary",
                        message=f"Failed to parse AOI boundary file: {str(e)}",
                        rule_code="AOI_PARSE_FAILED",
                    )
                )

        # 2. Input DEM Checks
        rules += 1
        dem_path = Path(config.inputs.dem)
        dem_bounds_wgs84 = None
        if not dem_path.exists():
            errors.append(
                ValidationIssue(
                    field="inputs.dem",
                    message=f"DEM raster file does not exist at '{dem_path}'.",
                    rule_code="DEM_FILE_NOT_FOUND",
                )
            )
        else:
            try:
                with rasterio.open(dem_path) as src:
                    rules += 1
                    if not src.crs:
                        errors.append(
                            ValidationIssue(
                                field="inputs.dem",
                                message="DEM GeoTIFF has no defined Coordinate Reference System (CRS).",
                                rule_code="DEM_CRS_UNDEFINED",
                            )
                        )
                    else:
                        to_wgs84 = pyproj.Transformer.from_crs(src.crs, "EPSG:4326", always_xy=True)
                        b = src.bounds
                        min_lon, min_lat = to_wgs84.transform(b.left, b.bottom)
                        max_lon, max_lat = to_wgs84.transform(b.right, b.top)
                        dem_bounds_wgs84 = (
                            min(min_lon, max_lon),
                            min(min_lat, max_lat),
                            max(min_lon, max_lon),
                            max(min_lat, max_lat),
                        )

                    rules += 1
                    if src.width < 2 or src.height < 2:
                        errors.append(
                            ValidationIssue(
                                field="inputs.dem",
                                message=f"DEM dimensions ({src.width}x{src.height}) are too small for simulation.",
                                rule_code="DEM_DIMENSIONS_TOO_SMALL",
                            )
                        )
            except Exception as e:
                errors.append(
                    ValidationIssue(
                        field="inputs.dem", message=f"Failed to open DEM file: {str(e)}", rule_code="DEM_READ_ERROR"
                    )
                )

        # 3. Dam Location & Spatial Intersection Checks
        dam = config.dam
        dam_lat, dam_lon = dam.lat, dam.lon
        rules += 1
        if not (-90.0 <= dam_lat <= 90.0 and -180.0 <= dam_lon <= 180.0):
            errors.append(
                ValidationIssue(
                    field="dam.location",
                    message=f"Dam coordinates [{dam_lat}, {dam_lon}] are out of valid WGS84 range.",
                    rule_code="DAM_COORDS_OUT_OF_RANGE",
                )
            )
        elif aoi_geom is not None:
            rules += 1
            dam_pt = shapely.geometry.Point(dam_lon, dam_lat)
            # Check with a slight buffer (approx 1000m ~ 0.01 deg) in case dam is right on the boundary
            if not aoi_geom.buffer(0.015).contains(dam_pt):
                errors.append(
                    ValidationIssue(
                        field="dam.location",
                        message=f"Dam location [{dam_lat:.4f}, {dam_lon:.4f}] is outside the specified AOI boundary.",
                        rule_code="DAM_OUTSIDE_AOI",
                    )
                )

        # Check DEM and AOI overlap
        if dem_bounds_wgs84 and aoi_geom:
            rules += 1
            dem_poly = shapely.geometry.box(*dem_bounds_wgs84)
            if not aoi_geom.intersects(dem_poly):
                errors.append(
                    ValidationIssue(
                        field="inputs.dem",
                        message="DEM bounding box does not intersect the study area AOI boundary.",
                        rule_code="DEM_AOI_NO_INTERSECTION",
                    )
                )

        # 4. Optional River Network, Land Use & Population File Checks
        if config.inputs.river_network:
            rules += 1
            riv_path = Path(config.inputs.river_network)
            if not riv_path.exists():
                warnings.append(
                    ValidationIssue(
                        field="inputs.river_network",
                        message=f"River network vector not found at '{riv_path}'; thalweg will be derived directly from DEM.",
                        rule_code="RIVER_FILE_MISSING_FALLBACK",
                        severity="WARNING",
                    )
                )

        if config.inputs.land_use:
            rules += 1
            lu_path = Path(config.inputs.land_use)
            if not lu_path.exists():
                warnings.append(
                    ValidationIssue(
                        field="inputs.land_use",
                        message=f"Land use file not found at '{lu_path}'; uniform roughness will be applied.",
                        rule_code="LANDUSE_FILE_MISSING_FALLBACK",
                        severity="WARNING",
                    )
                )

        if config.inputs.population:
            rules += 1
            pop_path = Path(config.inputs.population)
            if not pop_path.exists():
                warnings.append(
                    ValidationIssue(
                        field="inputs.population",
                        message=f"Population dataset not found at '{pop_path}'; baseline settlement density will be used.",
                        rule_code="POPULATION_FILE_MISSING_FALLBACK",
                        severity="WARNING",
                    )
                )

        # 5. Dam Structural & Physical Bounds
        rules += 1
        if dam.height_m <= 0.0:
            errors.append(
                ValidationIssue(
                    field="dam.height_m",
                    message="Dam height must be strictly positive.",
                    rule_code="DAM_HEIGHT_POSITIVE",
                )
            )
        elif dam.height_m > 400.0:
            warnings.append(
                ValidationIssue(
                    field="dam.height_m",
                    message=f"Dam height {dam.height_m}m exceeds tallest earth/rockfill dams in world.",
                    rule_code="DAM_HEIGHT_HIGH",
                    severity="WARNING",
                )
            )

        rules += 1
        storage_m3 = dam.effective_storage_m3
        if storage_m3 <= 0.0:
            errors.append(
                ValidationIssue(
                    field="dam.storage_volume_mcm",
                    message="Reservoir storage volume must be strictly positive.",
                    rule_code="STORAGE_VOLUME_POSITIVE",
                )
            )

        # 6. Breach Parameters Check
        breach = config.breach
        rules += 1
        valid_failure_types = ["overtopping", "piping", "instantaneous", "structural_collapse"]
        if breach.failure_type.lower() not in valid_failure_types:
            errors.append(
                ValidationIssue(
                    field="breach.failure_type",
                    message=f"Invalid failure type '{breach.failure_type}'. Supported: {', '.join(valid_failure_types)}.",
                    rule_code="BREACH_TYPE_INVALID",
                )
            )

        if breach.breach_width_m is not None and breach.breach_width_m <= 0.0:
            errors.append(
                ValidationIssue(
                    field="breach.breach_width_m",
                    message="Breach width must be strictly positive.",
                    rule_code="BREACH_WIDTH_POSITIVE",
                )
            )

        if breach.breach_formation_time_hr is not None and breach.breach_formation_time_hr <= 0.0:
            errors.append(
                ValidationIssue(
                    field="breach.breach_formation_time_hr",
                    message="Breach formation time must be strictly positive.",
                    rule_code="FORMATION_TIME_POSITIVE",
                )
            )

        # 7. Run Settings Controls
        settings = config.run_settings
        rules += 1
        if settings.grid_resolution_m <= 0.0:
            errors.append(
                ValidationIssue(
                    field="run_settings.grid_resolution_m",
                    message="Grid resolution must be greater than zero.",
                    rule_code="GRID_RES_POSITIVE",
                )
            )

        if settings.simulation_duration_hr <= 0.0:
            errors.append(
                ValidationIssue(
                    field="run_settings.simulation_duration_hr",
                    message="Simulation duration must be greater than zero.",
                    rule_code="DURATION_POSITIVE",
                )
            )

        is_valid = len(errors) == 0
        summary = (
            f"Scenario '{config.scenario_id}' passed all {rules} pre-flight dataset and physics validation checks."
            if is_valid
            else f"Scenario '{config.scenario_id}' pre-flight check failed with {len(errors)} error(s) and {len(warnings)} warning(s)."
        )

        report = ValidationReport(
            is_valid=is_valid,
            scenario_id=config.scenario_id,
            errors=errors,
            warnings=warnings,
            checked_rules_count=rules,
            summary=summary,
        )

        if raise_on_error and not is_valid:
            raise DatasetValidationError(report)

        return report
