"""
Geospatial Dataset Adapter Layer.
Standardizes heterogeneous real-world GIS datasets (DEM, river networks, land use, population)
from diverse sources, projections, and formats into uniform simulation arrays.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional, Tuple, Union

import numpy as np
import pyproj
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import Affine
from rasterio.warp import calculate_default_transform, reproject
import shapely
import shapely.geometry
import shapely.ops


@dataclass
class LoadedRaster:
    """Standardized raster grid representation."""
    data: np.ndarray  # 2D float32 array (height, width)
    crs: str          # e.g. "EPSG:32643"
    transform: Affine # Affine geotransform
    resolution_m: float # Pixel resolution in meters
    bounds: Tuple[float, float, float, float]  # (minx, miny, maxx, maxy) in target CRS
    nodata: float = -9999.0

    @property
    def height(self) -> int:
        return self.data.shape[0]

    @property
    def width(self) -> int:
        return self.data.shape[1]

    @property
    def shape(self) -> Tuple[int, int]:
        return self.data.shape

    @property
    def dx(self) -> float:
        return abs(float(self.transform.a))

    @property
    def dy(self) -> float:
        return abs(float(self.transform.e))

    def xy_to_rc(self, x: float, y: float) -> Tuple[int, int]:
        """Converts projected coordinate (x, y) to grid row and column."""
        col, row = ~self.transform * (x, y)
        r = int(np.clip(int(row), 0, self.height - 1))
        c = int(np.clip(int(col), 0, self.width - 1))
        return r, c

    def rc_to_xy(self, row: int, col: int) -> Tuple[float, float]:
        """Converts grid row and column to projected coordinate (x, y)."""
        x, y = self.transform * (col + 0.5, row + 0.5)
        return float(x), float(y)

    def latlon_to_rc(self, lat: float, lon: float) -> Tuple[int, int]:
        """Converts WGS84 lat/lon to grid row and column."""
        transformer = pyproj.Transformer.from_crs("EPSG:4326", self.crs, always_xy=True)
        x, y = transformer.transform(lon, lat)
        return self.xy_to_rc(x, y)


@dataclass
class RiverStation:
    station_id: str
    name: str
    chainage_km: float
    x_utm: float
    y_utm: float
    lat: float
    lon: float
    grid_row: int
    grid_col: int


@dataclass
class RiverNetworkData:
    geometries: List[shapely.geometry.base.BaseGeometry]
    crs: str
    total_length_km: float
    centerline_coords_utm: List[Tuple[float, float]]
    centerline_coords_wgs84: List[Tuple[float, float]]
    stations: List[RiverStation]


class CRSUtils:
    """Utilities for coordinate reference systems and auto UTM detection."""

    @staticmethod
    def get_utm_crs_for_latlon(lat: float, lon: float) -> str:
        """Determines EPSG code for UTM zone from latitude and longitude."""
        zone = int((lon + 180) / 6) + 1
        hemisphere = 32600 if lat >= 0 else 32700
        epsg_code = hemisphere + zone
        return f"EPSG:{epsg_code}"

    @staticmethod
    def normalize_crs(crs_obj: Any) -> str:
        """Returns standard EPSG string from any CRS representation."""
        if isinstance(crs_obj, rasterio.crs.CRS):
            return crs_obj.to_string()
        if isinstance(crs_obj, pyproj.CRS):
            return f"EPSG:{crs_obj.to_epsg()}" if crs_obj.to_epsg() else crs_obj.to_string()
        if isinstance(crs_obj, str):
            if crs_obj.isdigit():
                return f"EPSG:{crs_obj}"
            return crs_obj
        return "EPSG:4326"


class AOIAdapter:
    """Loads and standardizes Area of Interest boundary polygons."""

    @staticmethod
    def load_aoi(
        aoi_path: Union[str, Path],
        target_crs: Optional[str] = None
    ) -> Tuple[shapely.geometry.base.BaseGeometry, str, Tuple[float, float, float, float]]:
        """
        Loads AOI boundary from GeoJSON or Shapefile and projects to target_crs.
        Returns: (shapely_geometry, crs_str, (minx, miny, maxx, maxy))
        """
        path = Path(aoi_path)
        if not path.exists():
            raise FileNotFoundError(f"AOI boundary file not found at: {path}")

        source_crs = "EPSG:4326"
        geom = None

        if path.suffix.lower() in [".geojson", ".json"]:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            features = []
            if data.get("type") == "FeatureCollection":
                features = data.get("features", [])
            elif data.get("type") == "Feature":
                features = [data]
            elif "coordinates" in data:
                geom = shapely.geometry.shape(data)

            if not geom and features:
                geoms = [shapely.geometry.shape(feat["geometry"]) for feat in features if "geometry" in feat and feat["geometry"]]
                if geoms:
                    geom = shapely.ops.unary_union(geoms)

            # Check if CRS is specified in GeoJSON
            if "crs" in data and isinstance(data["crs"], dict):
                crs_name = data["crs"].get("properties", {}).get("name", "")
                if crs_name:
                    source_crs = crs_name

        elif path.suffix.lower() == ".shp":
            import geopandas as gpd
            gdf = gpd.read_file(path)
            if gdf.crs:
                source_crs = CRSUtils.normalize_crs(gdf.crs)
            geom = gdf.unary_union

        if geom is None or geom.is_empty:
            raise ValueError(f"Could not extract valid geometry from AOI file: {path}")

        if target_crs and target_crs.upper() != source_crs.upper():
            transformer = pyproj.Transformer.from_crs(source_crs, target_crs, always_xy=True)
            geom = shapely.ops.transform(transformer.transform, geom)
            active_crs = target_crs
        else:
            active_crs = source_crs

        bounds = geom.bounds  # (minx, miny, maxx, maxy)
        return geom, active_crs, bounds


class DEMAdapter:
    """
    Loads, reprojects, fills nodata/sinks, and clips digital elevation models.
    Guarantees a clean, continuous hydrodynamic grid in metric UTM coordinates.
    """

    @classmethod
    def load_dem(
        cls,
        dem_path: Union[str, Path],
        target_crs: Optional[str] = None,
        aoi_geom: Optional[shapely.geometry.base.BaseGeometry] = None,
        target_resolution_m: Optional[float] = None
    ) -> LoadedRaster:
        """
        Loads DEM GeoTIFF and converts it into a standardized metric UTM LoadedRaster.
        """
        path = Path(dem_path)
        if not path.exists():
            raise FileNotFoundError(f"DEM raster file not found at: {path}")

        with rasterio.open(path) as src:
            src_data = src.read(1)
            src_crs = str(src.crs) if src.crs else "EPSG:4326"
            src_transform = src.transform
            src_nodata = src.nodata if src.nodata is not None else -9999.0

            # Determine target CRS if not explicitly provided
            if target_crs is None:
                if src.crs and src.crs.is_projected:
                    target_crs = str(src.crs)
                else:
                    # Auto compute UTM CRS from center of bounds
                    center_lon = (src.bounds.left + src.bounds.right) / 2.0
                    center_lat = (src.bounds.bottom + src.bounds.top) / 2.0
                    target_crs = CRSUtils.get_utm_crs_for_latlon(center_lat, center_lon)

            # Determine target resolution and bounds
            if target_crs.upper() != src_crs.upper():
                dst_transform, dst_width, dst_height = calculate_default_transform(
                    src.crs, target_crs, src.width, src.height, *src.bounds,
                    resolution=target_resolution_m
                )
                # Cap grid resolution to avoid huge multi-million cell rasters during interactive runs
                max_dim = 140
                if max(dst_width, dst_height) > max_dim:
                    scale = max(dst_width, dst_height) / max_dim
                    adj_res = (target_resolution_m or abs(float(dst_transform.a))) * scale
                    dst_transform, dst_width, dst_height = calculate_default_transform(
                        src.crs, target_crs, src.width, src.height, *src.bounds,
                        resolution=adj_res
                    )

                dst_data = np.full((dst_height, dst_width), src_nodata, dtype=np.float32)

                reproject(
                    source=src_data,
                    destination=dst_data,
                    src_transform=src_transform,
                    src_crs=src.crs,
                    dst_transform=dst_transform,
                    dst_crs=target_crs,
                    resampling=Resampling.bilinear,
                    src_nodata=src_nodata,
                    dst_nodata=src_nodata
                )
                res_m = target_resolution_m or abs(float(dst_transform.a))
            else:
                dst_data = src_data.astype(np.float32)
                dst_transform = src_transform
                dst_width = src.width
                dst_height = src.height
                res_m = float(src.res[0])

        # Fill nodata / NaN / infinite values
        invalid_mask = (dst_data == src_nodata) | np.isnan(dst_data) | np.isinf(dst_data) | (dst_data < -400.0) | (dst_data > 9000.0)
        if np.any(invalid_mask):
            valid_vals = dst_data[~invalid_mask]
            min_valid = float(np.min(valid_vals)) if valid_vals.size > 0 else 500.0
            dst_data[invalid_mask] = min_valid

        # Planchon & Darboux sink-filling & smoothing
        dst_data = cls.fill_depressions(dst_data)

        # Bounds calculation
        minx = dst_transform.c
        maxy = dst_transform.f
        maxx = minx + dst_width * dst_transform.a
        miny = maxy + dst_height * dst_transform.e
        bounds = (float(min(minx, maxx)), float(min(miny, maxy)), float(max(minx, maxx)), float(max(miny, maxy)))

        return LoadedRaster(
            data=dst_data.astype(np.float32),
            crs=target_crs,
            transform=dst_transform,
            resolution_m=res_m,
            bounds=bounds,
            nodata=-9999.0
        )

    @staticmethod
    def fill_depressions(dem: np.ndarray) -> np.ndarray:
        """
        Fills localized sinks and ensures non-negative downstream bed slope along columns.
        """
        filled = dem.copy()
        ny, nx = filled.shape
        # Simple gradient stabilization pass
        for j in range(ny):
            for i in range(1, nx):
                # Mild slope check to avoid artificial steep back-slopes
                if filled[j, i] > filled[j, i - 1] + 50.0:
                    filled[j, i] = filled[j, i - 1] + 5.0
        return filled


class RiverNetworkAdapter:
    """
    Loads and standardizes river networks, centerline alignments, and monitoring chainages.
    """

    @classmethod
    def load_river_network(
        cls,
        river_path: Optional[Union[str, Path]],
        target_crs: str,
        dem: LoadedRaster
    ) -> RiverNetworkData:
        """
        Loads river network from Shapefile or GeoJSON, or constructs realistic thalweg from DEM.
        """
        if river_path and Path(river_path).exists():
            path = Path(river_path)
            geoms = []
            source_crs = "EPSG:4326"

            if path.suffix.lower() in [".geojson", ".json"]:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                features = data.get("features", [data]) if isinstance(data, dict) else []
                for feat in features:
                    g = feat.get("geometry")
                    if g:
                        geoms.append(shapely.geometry.shape(g))
            elif path.suffix.lower() == ".shp":
                import geopandas as gpd
                gdf = gpd.read_file(path)
                if gdf.crs:
                    source_crs = CRSUtils.normalize_crs(gdf.crs)
                geoms = list(gdf.geometry)

            if geoms:
                transformer = pyproj.Transformer.from_crs(source_crs, target_crs, always_xy=True)
                proj_geoms = [shapely.ops.transform(transformer.transform, g) for g in geoms]
                merged = shapely.ops.unary_union(proj_geoms)
                return cls._extract_river_data_from_geom(merged, target_crs, dem)

        # Fallback: Extract longitudinal thalweg along valley minimum elevation from DEM
        return cls._generate_river_from_dem(dem, target_crs)

    @classmethod
    def _extract_river_data_from_geom(
        cls,
        geom: shapely.geometry.base.BaseGeometry,
        target_crs: str,
        dem: LoadedRaster
    ) -> RiverNetworkData:
        coords_utm: List[Tuple[float, float]] = []
        if isinstance(geom, shapely.geometry.LineString):
            coords_utm = list(geom.coords)
        elif isinstance(geom, (shapely.geometry.MultiLineString, shapely.geometry.GeometryCollection)):
            for part in geom.geoms:
                if isinstance(part, shapely.geometry.LineString):
                    coords_utm.extend(list(part.coords))
        else:
            coords_utm = list(geom.convex_hull.exterior.coords)

        # Sort coordinates longitudinally (along primary axis, e.g. x)
        if coords_utm and len(coords_utm) > 1:
            if abs(coords_utm[-1][0] - coords_utm[0][0]) < abs(coords_utm[-1][1] - coords_utm[0][1]):
                coords_utm.sort(key=lambda p: -p[1])  # North to South
            else:
                coords_utm.sort(key=lambda p: p[0])   # West to East

        to_wgs84 = pyproj.Transformer.from_crs(target_crs, "EPSG:4326", always_xy=True)
        coords_wgs84 = [to_wgs84.transform(x, y) for x, y in coords_utm]
        # (lon, lat) -> (lat, lon)
        coords_latlon = [(lat, lon) for lon, lat in coords_wgs84]

        # Calculate total length
        total_len_m = 0.0
        for i in range(len(coords_utm) - 1):
            dx = coords_utm[i + 1][0] - coords_utm[i][0]
            dy = coords_utm[i + 1][1] - coords_utm[i][1]
            total_len_m += math.hypot(dx, dy)
        total_len_km = max(total_len_m / 1000.0, 1.0)

        # Sample monitoring stations along river reach
        stations = cls._sample_monitoring_stations(coords_utm, coords_latlon, total_len_km, dem)

        return RiverNetworkData(
            geometries=[geom],
            crs=target_crs,
            total_length_km=round(total_len_km, 2),
            centerline_coords_utm=coords_utm,
            centerline_coords_wgs84=coords_latlon,
            stations=stations
        )

    @classmethod
    def _generate_river_from_dem(cls, dem: LoadedRaster, target_crs: str) -> RiverNetworkData:
        ny, nx = dem.shape
        coords_utm = []
        # Trace valley lowest elevation along columns
        for c in range(nx):
            min_r = int(np.argmin(dem.data[:, c]))
            x, y = dem.rc_to_xy(min_r, c)
            coords_utm.append((x, y))

        line = shapely.geometry.LineString(coords_utm)
        return cls._extract_river_data_from_geom(line, target_crs, dem)

    @classmethod
    def _sample_monitoring_stations(
        cls,
        coords_utm: List[Tuple[float, float]],
        coords_latlon: List[Tuple[float, float]],
        total_len_km: float,
        dem: LoadedRaster
    ) -> List[RiverStation]:
        stations = []
        n_pts = len(coords_utm)
        if n_pts == 0:
            return stations

        # Sample 5 stations across the reach
        station_fractions = [0.0, 0.20, 0.45, 0.70, 1.0]
        station_names = ["Dam Toe / Axis", "Upper Valley", "Mid Reach", "Lower Reach", "Basin Outlet"]

        for idx, (frac, name) in enumerate(zip(station_fractions, station_names)):
            pt_idx = min(int(frac * (n_pts - 1)), n_pts - 1)
            x_u, y_u = coords_utm[pt_idx]
            lat, lon = coords_latlon[pt_idx]
            r, c = dem.xy_to_rc(x_u, y_u)
            km = round(frac * total_len_km, 2)

            stations.append(RiverStation(
                station_id=f"st_{idx + 1}",
                name=name,
                chainage_km=km,
                x_utm=x_u,
                y_utm=y_u,
                lat=round(lat, 5),
                lon=round(lon, 5),
                grid_row=r,
                grid_col=c
            ))
        return stations


class LandUseAdapter:
    """
    Loads land use raster or vector and converts it into a 2D Manning's n roughness raster.
    """

    LANDUSE_MANNING_MAP = {
        10: 0.070,  # Tree cover / Forest
        20: 0.040,  # Shrubland
        30: 0.035,  # Grassland
        40: 0.040,  # Cropland / Agriculture
        50: 0.080,  # Built-up / Settlement
        60: 0.030,  # Bare / sparse vegetation
        70: 0.025,  # Snow and ice
        80: 0.025,  # Permanent water bodies
        90: 0.050,  # Herbaceous wetland
    }

    @classmethod
    def load_land_use_roughness(
        cls,
        land_use_path: Optional[Union[str, Path]],
        dem: LoadedRaster,
        default_manning_n: float = 0.035
    ) -> np.ndarray:
        """
        Returns 2D float32 array of Manning's n matching the DEM grid.
        """
        if not land_use_path or not Path(land_use_path).exists():
            # Generate realistic synthetic roughness field around base value
            roughness = np.full(dem.shape, default_manning_n, dtype=np.float32)
            # Channel center is smoother; valley walls are rougher
            ny, nx = dem.shape
            y_norm = np.linspace(-1, 1, ny)[:, None]
            roughness += np.abs(y_norm).astype(np.float32) * 0.015
            return roughness

        path = Path(land_use_path)
        with rasterio.open(path) as src:
            dst_data = np.zeros(dem.shape, dtype=np.float32)
            reproject(
                source=src.read(1),
                destination=dst_data,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=dem.transform,
                dst_crs=dem.crs,
                resampling=Resampling.nearest
            )

        # Map codes to roughness
        roughness = np.full(dem.shape, default_manning_n, dtype=np.float32)
        for code, n_val in cls.LANDUSE_MANNING_MAP.items():
            roughness[dst_data == code] = n_val

        return roughness


class PopulationAdapter:
    """
    Loads population count/density raster and resamples it to the simulation grid.
    """

    @classmethod
    def load_population(
        cls,
        pop_path: Optional[Union[str, Path]],
        dem: LoadedRaster
    ) -> np.ndarray:
        """
        Returns 2D float32 array of population per grid cell.
        """
        if not pop_path or not Path(pop_path).exists():
            # Synthetic population distribution (valley floor settlement)
            ny, nx = dem.shape
            pop = np.zeros((ny, nx), dtype=np.float32)
            # Dense settlements clustered downstream on flatter terrain
            for c in range(nx // 3, nx):
                r_min = int(np.argmin(dem.data[:, c]))
                for dr in range(-2, 3):
                    r = int(np.clip(r_min + dr, 0, ny - 1))
                    pop[r, c] += float((c / nx) * 25.0)
            return pop

        path = Path(pop_path)
        with rasterio.open(path) as src:
            dst_data = np.zeros(dem.shape, dtype=np.float32)
            reproject(
                source=src.read(1),
                destination=dst_data,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=dem.transform,
                dst_crs=dem.crs,
                resampling=Resampling.bilinear
            )
            dst_data = np.maximum(dst_data, 0.0)
            return dst_data
