"""
Unit tests for geospatial dataset adapters (DEM, RiverNetwork, LandUse, Population, AOI).
"""
import pytest
import numpy as np
from pathlib import Path
from floodlab.geospatial.dataset_adapters import (
    AOIAdapter,
    CRSUtils,
    DEMAdapter,
    LandUseAdapter,
    PopulationAdapter,
    RiverNetworkAdapter,
    LoadedRaster,
)

DATASETS_DIR = Path(__file__).parents[3] / "datasets"


def test_crs_utils():
    # Test UTM zone derivation
    utm_jk = CRSUtils.get_utm_crs_for_latlon(33.15, 75.35)
    assert utm_jk == "EPSG:32643"

    utm_uk = CRSUtils.get_utm_crs_for_latlon(30.38, 78.48)
    assert utm_uk == "EPSG:32644"

    utm_bihar = CRSUtils.get_utm_crs_for_latlon(26.85, 86.95)
    assert utm_bihar == "EPSG:32645"


def test_aoi_adapter_chenab():
    aoi_path = DATASETS_DIR / "chenab" / "aoi.geojson"
    if aoi_path.exists():
        geom, crs, bounds = AOIAdapter.load_aoi(aoi_path, target_crs="EPSG:32643")
        assert geom is not None
        assert not geom.is_empty
        assert crs == "EPSG:32643"
        assert len(bounds) == 4
        assert bounds[0] < bounds[2]
        assert bounds[1] < bounds[3]


def test_dem_adapter_chenab():
    dem_path = DATASETS_DIR / "chenab" / "dem.tif"
    if dem_path.exists():
        dem = DEMAdapter.load_dem(dem_path, target_crs="EPSG:32643", target_resolution_m=30.0)
        assert isinstance(dem, LoadedRaster)
        assert dem.crs == "EPSG:32643"
        assert dem.height > 10 and dem.width > 10
        assert not np.any(np.isnan(dem.data))
        assert not np.any(dem.data == -9999.0)
        assert np.min(dem.data) >= 500.0  # Mountainous terrain

        # Test coordinate transforms
        r, c = dem.latlon_to_rc(33.15, 75.35)
        assert 0 <= r < dem.height
        assert 0 <= c < dem.width


def test_river_network_adapter():
    dem_path = DATASETS_DIR / "chenab" / "dem.tif"
    river_path = DATASETS_DIR / "chenab" / "river.geojson"
    if dem_path.exists() and river_path.exists():
        dem = DEMAdapter.load_dem(dem_path, target_crs="EPSG:32643")
        river_data = RiverNetworkAdapter.load_river_network(river_path, target_crs=dem.crs, dem=dem)
        assert river_data.total_length_km > 0.0
        assert len(river_data.stations) >= 3
        for st in river_data.stations:
            assert 0 <= st.grid_row < dem.height
            assert 0 <= st.grid_col < dem.width


def test_land_use_and_population_adapters():
    dem_path = DATASETS_DIR / "kosi" / "dem.tif"
    lu_path = DATASETS_DIR / "kosi" / "landuse.tif"
    pop_path = DATASETS_DIR / "kosi" / "population.tif"
    if dem_path.exists() and lu_path.exists() and pop_path.exists():
        dem = DEMAdapter.load_dem(dem_path, target_crs="EPSG:32645")
        roughness = LandUseAdapter.load_land_use_roughness(lu_path, dem=dem, default_manning_n=0.030)
        assert roughness.shape == dem.shape
        assert np.all(roughness >= 0.015)
        assert np.all(roughness <= 0.15)

        pop_grid = PopulationAdapter.load_population(pop_path, dem=dem)
        assert pop_grid.shape == dem.shape
        assert np.all(pop_grid >= 0.0)
        assert np.sum(pop_grid) > 0.0
