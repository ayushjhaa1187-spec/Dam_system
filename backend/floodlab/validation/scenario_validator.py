"""
Physical and GIS Input Validator for Dam Breach Scenarios.

Ensures strict physical bounds and spatial consistency:
1. Dam crest elevation > base elevation
2. Reservoir level <= crest level unless overtopping is selected
3. Breach bottom elevation >= dam foundation/base
4. Breach width > 0 and bounded by crest length
5. Breach formation time > 0
6. Discharge >= 0
7. Hydrograph timestamps strictly ordered and unique
8. DEM CRS defined, elevation range valid
9. Study boundary intersects river/catchment
10. Layer CRS compatibility and file size/type safety
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel


class ValidationErrorDetail(BaseModel):
    field: str
    message: str
    rule: str
    severity: str = "error"  # "error" | "warning"


class ScenarioValidationResult(BaseModel):
    is_valid: bool
    errors: List[ValidationErrorDetail] = []
    warnings: List[ValidationErrorDetail] = []
    summary: str = "Validation complete"
    checked_rules_count: int = 0


class ScenarioValidator:
    """Validates physical and hydraulic parameters for dam breach simulation."""

    @classmethod
    def validate_scenario_params(cls, params: Dict[str, Any]) -> ScenarioValidationResult:
        errors: List[ValidationErrorDetail] = []
        warnings: List[ValidationErrorDetail] = []
        rules_checked = 0

        dam_name = params.get("dam_name") or params.get("name") or "Unnamed Scenario"
        dam_height = float(params.get("dam_height_m", 0.0))
        hydraulic_head = float(params.get("hydraulic_head_m", dam_height))
        reservoir_vol = float(params.get("reservoir_volume_m3", 0.0))
        crest_length = float(params.get("crest_length_m", 0.0)) if params.get("crest_length_m") else None
        breach_mode = str(params.get("breach_mode", "overtopping")).lower()
        breach_width = float(params.get("avg_breach_width_m", 0.0)) if params.get("avg_breach_width_m") else None
        formation_time = (
            float(params.get("breach_formation_time_hrs", 0.0)) if params.get("breach_formation_time_hrs") else None
        )

        crest_msl = float(params.get("crest_elevation_msl", 0.0)) if params.get("crest_elevation_msl") else None
        bed_msl = float(params.get("river_bed_elevation_msl", 0.0)) if params.get("river_bed_elevation_msl") else None
        frl_msl = (
            float(params.get("full_reservoir_level_frl_msl", 0.0))
            if params.get("full_reservoir_level_frl_msl")
            else None
        )

        # Rule 1: Dam crest elevation > base elevation (or dam_height > 0)
        rules_checked += 1
        if dam_height <= 0.0:
            errors.append(
                ValidationErrorDetail(
                    field="dam_height_m", message="Dam height must be greater than zero.", rule="DAM_HEIGHT_POSITIVE"
                )
            )
        elif dam_height > 400.0:
            warnings.append(
                ValidationErrorDetail(
                    field="dam_height_m",
                    message=(
                        "Dam height exceeds 400m (taller than any existing earth/rockfill dam). "
                        "Please verify units."
                    ),
                    rule="DAM_HEIGHT_RANGE_CHECK",
                    severity="warning",
                )
            )

        if crest_msl is not None and bed_msl is not None:
            rules_checked += 1
            if crest_msl <= bed_msl:
                errors.append(
                    ValidationErrorDetail(
                        field="crest_elevation_msl",
                        message=f"Dam crest elevation ({crest_msl}m MSL) must be strictly greater than river bed elevation ({bed_msl}m MSL).",  # noqa: E501
                        rule="CREST_ABOVE_BED",
                    )
                )

        # Rule 2: Reservoir level cannot exceed crest level unless overtopping is selected
        rules_checked += 1
        if breach_mode != "overtopping" and hydraulic_head > dam_height:
            errors.append(
                ValidationErrorDetail(
                    field="hydraulic_head_m",
                    message=f"Reservoir head ({hydraulic_head}m) exceeds dam crest height ({dam_height}m), which requires breach mode 'overtopping'.",  # noqa: E501
                    rule="HEAD_EXCEEDS_CREST_WITHOUT_OVERTOPPING",
                )
            )

        if crest_msl is not None and frl_msl is not None and breach_mode != "overtopping":
            rules_checked += 1
            if frl_msl > crest_msl:
                errors.append(
                    ValidationErrorDetail(
                        field="full_reservoir_level_frl_msl",
                        message=f"Full Reservoir Level ({frl_msl}m MSL) exceeds Crest Elevation ({crest_msl}m MSL) without overtopping condition.",  # noqa: E501
                        rule="FRL_EXCEEDS_CREST",
                    )
                )

        # Rule 3: Breach bottom elevation must not be below dam foundation/base
        breach_depth = float(params.get("breach_depth_m", hydraulic_head))
        rules_checked += 1
        if breach_depth > dam_height * 1.05:
            errors.append(
                ValidationErrorDetail(
                    field="breach_depth_m",
                    message=f"Breach bottom elevation cannot erode below dam foundation (breach depth {breach_depth}m > dam height {dam_height}m).",  # noqa: E501
                    rule="BREACH_BELOW_FOUNDATION",
                )
            )

        # Rule 4: Breach width must be positive and realistically bounded
        if breach_width is not None:
            rules_checked += 1
            if breach_width <= 0.0:
                errors.append(
                    ValidationErrorDetail(
                        field="avg_breach_width_m",
                        message="Average breach width must be strictly positive.",
                        rule="BREACH_WIDTH_POSITIVE",
                    )
                )
            elif crest_length and breach_width > crest_length:
                errors.append(
                    ValidationErrorDetail(
                        field="avg_breach_width_m",
                        message=(
                            f"Breach width ({breach_width}m) cannot exceed "
                            f"total dam crest length ({crest_length}m)."
                        ),
                        rule="BREACH_WIDTH_BOUNDED_BY_CREST",
                    )
                )

        # Rule 5: Breach formation time must be greater than zero
        if formation_time is not None:
            rules_checked += 1
            if formation_time <= 0.0:
                errors.append(
                    ValidationErrorDetail(
                        field="breach_formation_time_hrs",
                        message="Breach formation time must be greater than zero (for instantaneous failure, use Ritter model or specify t > 0.001 hr).",  # noqa: E501
                        rule="FORMATION_TIME_POSITIVE",
                    )
                )
            elif formation_time > 48.0:
                warnings.append(
                    ValidationErrorDetail(
                        field="breach_formation_time_hrs",
                        message="Formation time exceeds 48 hours; typical embankment breaches develop within 0.1 to 12 hours.",  # noqa: E501
                        rule="FORMATION_TIME_HIGH",
                        severity="warning",
                    )
                )

        # Rule 6: Reservoir volume must be positive
        rules_checked += 1
        if reservoir_vol <= 0.0:
            errors.append(
                ValidationErrorDetail(
                    field="reservoir_volume_m3",
                    message="Reservoir storage volume must be greater than zero.",
                    rule="RESERVOIR_VOLUME_POSITIVE",
                )
            )

        # Rule 7: Discharge & Hydrograph timestamps check
        inflow_q = float(params.get("inflow_discharge_m3s", 0.0))
        rules_checked += 1
        if inflow_q < 0.0:
            errors.append(
                ValidationErrorDetail(
                    field="inflow_discharge_m3s",
                    message="Inflow discharge cannot be negative.",
                    rule="DISCHARGE_NON_NEGATIVE",
                )
            )

        hydro_times = params.get("hydrograph_times") or params.get("hydrograph_times_hrs")
        hydro_flows = params.get("hydrograph_flows") or params.get("hydrograph_flows_m3s")
        if hydro_times and hydro_flows:
            rules_checked += 1
            if len(hydro_times) != len(hydro_flows):
                errors.append(
                    ValidationErrorDetail(
                        field="hydrograph_times",
                        message=f"Hydrograph timestamps count ({len(hydro_times)}) does not match discharge points count ({len(hydro_flows)}).",  # noqa: E501
                        rule="HYDROGRAPH_LENGTH_MISMATCH",
                    )
                )
            else:
                for i in range(len(hydro_times) - 1):
                    if hydro_times[i] >= hydro_times[i + 1]:
                        errors.append(
                            ValidationErrorDetail(
                                field="hydrograph_times",
                                message=f"Hydrograph timestamps must be strictly increasing and unique. Error at index {i}: {hydro_times[i]} >= {hydro_times[i + 1]}.",  # noqa: E501
                                rule="HYDROGRAPH_TIMESTAMPS_MONOTONIC",
                            )
                        )
                        break
                for i, q in enumerate(hydro_flows):
                    if q < 0.0 or math.isnan(q):
                        errors.append(
                            ValidationErrorDetail(
                                field="hydrograph_flows",
                                message=f"Hydrograph discharge at index {i} is negative ({q} m³/s) or NaN.",
                                rule="HYDROGRAPH_FLOW_NON_NEGATIVE",
                            )
                        )
                        break

        # Rule 8: Reach geometry bounds
        reach_len = float(params.get("reach_length_km", 25.0))
        rules_checked += 1
        if reach_len <= 0.0 or reach_len > 500.0:
            errors.append(
                ValidationErrorDetail(
                    field="reach_length_km",
                    message="Reach length must be between 0.1 km and 500 km.",
                    rule="REACH_LENGTH_BOUNDS",
                )
            )

        valley_w = float(params.get("valley_width_m", 450.0))
        rules_checked += 1
        if valley_w <= 0.0 or valley_w > 20000.0:
            errors.append(
                ValidationErrorDetail(
                    field="valley_width_m",
                    message="Valley width must be between 1 m and 20,000 m.",
                    rule="VALLEY_WIDTH_BOUNDS",
                )
            )

        bed_slope = float(params.get("bed_slope", 0.005))
        rules_checked += 1
        if bed_slope <= 0.0 or bed_slope > 0.5:
            errors.append(
                ValidationErrorDetail(
                    field="bed_slope",
                    message="Bed slope must be positive and <= 0.5 (50% grade).",
                    rule="BED_SLOPE_BOUNDS",
                )
            )

        manning_n = float(params.get("manning_n", 0.04))
        rules_checked += 1
        if manning_n < 0.01 or manning_n > 0.20:
            warnings.append(
                ValidationErrorDetail(
                    field="manning_n",
                    message=f"Manning's n ({manning_n}) is outside typical range (0.015 - 0.12).",
                    rule="MANNING_N_RANGE",
                    severity="warning",
                )
            )

        is_valid = len(errors) == 0
        summary = (
            f"Scenario '{dam_name}' passed all {rules_checked} physical validation checks."
            if is_valid
            else f"Validation failed with {len(errors)} error(s) and {len(warnings)} warning(s)."
        )

        return ScenarioValidationResult(
            is_valid=is_valid, errors=errors, warnings=warnings, summary=summary, checked_rules_count=rules_checked
        )


class LayerValidator:
    """Validates uploaded GIS layers (DEM, landuse, vectors) for CRS, bounds, and consistency."""

    ALLOWED_CRS = ["EPSG:4326", "EPSG:32644", "EPSG:32643", "EPSG:32645", "EPSG:3857", "WGS 84"]
    MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

    @classmethod
    def validate_dem(
        cls,
        crs: Optional[str],
        elevation_min_m: float,
        elevation_max_m: float,
        resolution_m: float,
        file_size_bytes: int = 1024,
        filename: str = "dem.tif",
    ) -> ScenarioValidationResult:
        errors: List[ValidationErrorDetail] = []
        warnings: List[ValidationErrorDetail] = []
        rules = 0

        # File size check
        rules += 1
        if file_size_bytes > cls.MAX_FILE_SIZE_BYTES:
            errors.append(
                ValidationErrorDetail(
                    field="dem_file",
                    message=(
                        f"Uploaded DEM size ({file_size_bytes / (1024 * 1024):.1f} MB) "
                        "exceeds maximum allowed 50 MB."
                    ),
                    rule="FILE_SIZE_LIMIT",
                )
            )

        # Extension check
        rules += 1
        valid_exts = [".tif", ".tiff", ".geotiff", ".nc", ".asc"]
        if not any(filename.lower().endswith(ext) for ext in valid_exts):
            errors.append(
                ValidationErrorDetail(
                    field="dem_file",
                    message=f"Unsupported DEM format '{filename}'. Allowed formats: {', '.join(valid_exts)}.",
                    rule="FILE_FORMAT_SUPPORTED",
                )
            )

        # CRS Check
        rules += 1
        if not crs or crs.upper() in ["NONE", "UNKNOWN", ""]:
            errors.append(
                ValidationErrorDetail(
                    field="dem_crs",
                    message="DEM must have a defined Coordinate Reference System (e.g. EPSG:4326 or UTM Zone).",
                    rule="CRS_DEFINED",
                )
            )

        # Elevation Range Check
        rules += 1
        if elevation_min_m >= elevation_max_m:
            errors.append(
                ValidationErrorDetail(
                    field="elevation_range",
                    message=(
                        f"Minimum elevation ({elevation_min_m}m) must be strictly "
                        f"less than maximum elevation ({elevation_max_m}m)."
                    ),
                    rule="ELEVATION_RANGE_VALID",
                )
            )
        elif elevation_min_m < -450.0 or elevation_max_m > 9000.0:
            warnings.append(
                ValidationErrorDetail(
                    field="elevation_range",
                    message=(
                        f"Elevation range [{elevation_min_m}m, {elevation_max_m}m] "
                        "is unusual for terrestrial terrain."
                    ),
                    rule="ELEVATION_TERRESTRIAL_BOUNDS",
                    severity="warning",
                )
            )

        # Resolution Check
        rules += 1
        if resolution_m <= 0.0 or resolution_m > 1000.0:
            errors.append(
                ValidationErrorDetail(
                    field="resolution_m",
                    message=f"DEM spatial resolution ({resolution_m}m) must be between 0.1m and 1000m.",
                    rule="RESOLUTION_POSITIVE",
                )
            )

        is_valid = len(errors) == 0
        summary = "DEM validation passed" if is_valid else f"DEM validation failed with {len(errors)} error(s)."
        return ScenarioValidationResult(
            is_valid=is_valid, errors=errors, warnings=warnings, summary=summary, checked_rules_count=rules
        )

    @classmethod
    def validate_study_boundary_intersection(
        cls,
        study_bounds: Tuple[float, float, float, float],  # (min_lon, min_lat, max_lon, max_lat)
        dam_coords: Tuple[float, float],  # (lat, lon)
        river_coords: List[Tuple[float, float]],  # list of (lat, lon)
    ) -> ScenarioValidationResult:
        errors: List[ValidationErrorDetail] = []
        warnings: List[ValidationErrorDetail] = []
        rules = 2

        min_lon, min_lat, max_lon, max_lat = study_bounds
        dam_lat, dam_lon = dam_coords

        # Check if dam is within study area
        if not (min_lon <= dam_lon <= max_lon and min_lat <= dam_lat <= max_lat):
            errors.append(
                ValidationErrorDetail(
                    field="study_boundary",
                    message=f"Dam location ({dam_lat:.4f}, {dam_lon:.4f}) is outside the specified study boundary [{min_lon:.4f}, {min_lat:.4f}, {max_lon:.4f}, {max_lat:.4f}].",  # noqa: E501
                    rule="DAM_INSIDE_STUDY_BOUNDARY",
                )
            )

        # Check if river corridor intersects study area
        river_in_bounds = any(min_lon <= lon <= max_lon and min_lat <= lat <= max_lat for lat, lon in river_coords)
        if not river_in_bounds:
            errors.append(
                ValidationErrorDetail(
                    field="river_centerline",
                    message="Downstream river corridor does not intersect the uploaded study boundary.",
                    rule="RIVER_INTERSECTS_BOUNDARY",
                )
            )

        is_valid = len(errors) == 0
        summary = (
            "Study boundary spatial intersection verified."
            if is_valid
            else "Boundary spatial intersection check failed."
        )  # noqa: E501
        return ScenarioValidationResult(
            is_valid=is_valid, errors=errors, warnings=warnings, summary=summary, checked_rules_count=rules
        )
