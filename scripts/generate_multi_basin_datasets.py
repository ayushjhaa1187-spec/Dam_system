"""
Script to generate realistic, geographically sound GIS datasets (DEM, AOI, River, Landuse, Population)
and scenario configs for Chenab, Kosi, and Tehri basins.
"""
import json
import os
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from pathlib import Path

BASE_DIR = Path(__file__).parents[1] / "datasets"

def create_geotiff(path: Path, data: np.ndarray, bounds: tuple, crs: str = "EPSG:4326"):
    path.parent.mkdir(parents=True, exist_ok=True)
    minx, miny, maxx, maxy = bounds
    ny, nx = data.shape
    transform = from_bounds(minx, miny, maxx, maxy, nx, ny)
    
    with rasterio.open(
        path, "w",
        driver="GTiff",
        height=ny,
        width=nx,
        count=1,
        dtype=data.dtype,
        crs=crs,
        transform=transform,
        nodata=-9999.0
    ) as dst:
        dst.write(data, 1)
    print(f"Created GeoTIFF: {path} ({nx}x{ny}, {crs})")

def create_geojson(path: Path, geojson_dict: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson_dict, f, indent=2)
    print(f"Created GeoJSON: {path}")

def generate_chenab():
    """
    Chenab River Basin (Jammu & Kashmir)
    Steep mountainous gorge, high velocity, narrow confinement.
    Location: 33.15 N, 75.35 E
    """
    basin_dir = BASE_DIR / "chenab"
    basin_dir.mkdir(parents=True, exist_ok=True)
    
    min_lon, min_lat, max_lon, max_lat = 75.10, 32.95, 75.60, 33.35
    nx, ny = 120, 80
    
    # 1. AOI Boundary
    aoi_poly = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"name": "Chenab River Basin Study Area", "state": "Jammu & Kashmir"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat]
                ]]
            }
        }]
    }
    create_geojson(basin_dir / "aoi.geojson", aoi_poly)
    
    # 2. DEM: Mountain Gorge (Elevation 700m to 2600m)
    x = np.linspace(0, 1, nx)
    y = np.linspace(-1, 1, ny)
    X, Y = np.meshgrid(x, y)
    # Longitudinal slope from east (upstream 1800m) to west (downstream 700m)
    thalweg = 1800.0 - X * 1100.0
    # Meandering channel
    meander = 0.25 * np.sin(2.5 * np.pi * X)
    gorge_walls = ((Y - meander) ** 2) * 900.0
    dem = thalweg + gorge_walls + np.random.normal(0, 5, (ny, nx))
    dem = np.clip(dem, 650.0, 3000.0).astype(np.float32)
    create_geotiff(basin_dir / "dem.tif", dem, (min_lon, min_lat, max_lon, max_lat))
    
    # 3. River Centerline
    river_lons = np.linspace(75.55, 75.15, 50)
    river_lats = 33.15 + 0.08 * np.sin(np.linspace(0, 2.5 * np.pi, 50))
    river_coords = [[round(float(lo), 5), round(float(la), 5)] for lo, la in zip(river_lons, river_lats)]
    river_geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"river_name": "Chenab River", "reach": "Baglihar to Ramban Reach"},
            "geometry": {
                "type": "LineString",
                "coordinates": river_coords
            }
        }]
    }
    create_geojson(basin_dir / "river.geojson", river_geojson)
    
    # 4. Landuse (10: Forest, 50: Built-up, 60: Bare rock, 80: River)
    landuse = np.full((ny, nx), 10, dtype=np.int16) # Forest
    landuse[np.abs(Y - meander) < 0.12] = 80 # River channel
    landuse[np.abs(Y - meander) > 0.6] = 60  # Rock slopes
    # Settlements clustered along lower valley
    landuse[(X > 0.6) & (np.abs(Y - meander) < 0.25)] = 50
    create_geotiff(basin_dir / "landuse.tif", landuse, (min_lon, min_lat, max_lon, max_lat))
    
    # 5. Population density
    pop = np.zeros((ny, nx), dtype=np.float32)
    pop[landuse == 50] = np.random.uniform(50, 200, np.sum(landuse == 50))
    pop[landuse == 10] = np.random.uniform(0, 5, np.sum(landuse == 10))
    create_geotiff(basin_dir / "population.tif", pop, (min_lon, min_lat, max_lon, max_lat))
    
    # 6. Scenario Config
    config = {
        "scenario_id": "chenab-jk-worstcase",
        "description": "Catastrophic breach scenario for Baglihar / Chenab Dam in Jammu & Kashmir mountain gorge.",
        "basin": {
            "name": "Chenab River Basin",
            "aoi_boundary": "datasets/chenab/aoi.geojson",
            "state": "Jammu and Kashmir",
            "country": "India"
        },
        "inputs": {
            "dem": "datasets/chenab/dem.tif",
            "river_network": "datasets/chenab/river.geojson",
            "land_use": "datasets/chenab/landuse.tif",
            "population": "datasets/chenab/population.tif"
        },
        "dam": {
            "name": "Baglihar Dam (Chenab)",
            "location": [33.15, 75.35],
            "height_m": 143.0,
            "storage_volume_mcm": 1960.0,
            "dam_type": "concrete_gravity",
            "crest_length_m": 317.0
        },
        "breach": {
            "failure_type": "instantaneous",
            "breach_width_m": 120.0,
            "breach_formation_time_hr": 0.25,
            "reservoir_level_pct": 98.0,
            "breach_model": "froehlich_2008"
        },
        "run_settings": {
            "grid_resolution_m": 30.0,
            "manning_n": 0.035,
            "simulation_duration_hr": 24.0,
            "target_crs": "EPSG:32643"
        }
    }
    with open(basin_dir / "scenario_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"Created Chenab Scenario Config: {basin_dir / 'scenario_config.json'}")

def generate_kosi():
    """
    Kosi River Basin (Bihar / Eastern Himalayan Foothills)
    Wide alluvial floodplain, flat terrain, wide shallow inundation footprint.
    Location: 26.85 N, 86.95 E
    """
    basin_dir = BASE_DIR / "kosi"
    basin_dir.mkdir(parents=True, exist_ok=True)
    
    min_lon, min_lat, max_lon, max_lat = 86.70, 26.65, 87.20, 27.05
    nx, ny = 120, 80
    
    # 1. AOI Boundary
    aoi_poly = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"name": "Kosi River Basin Study Area", "state": "Bihar"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat]
                ]]
            }
        }]
    }
    create_geojson(basin_dir / "aoi.geojson", aoi_poly)
    
    # 2. DEM: Alluvial Plain (Elevation 60m to 180m, gentle slope)
    x = np.linspace(0, 1, nx)
    y = np.linspace(-1, 1, ny)
    X, Y = np.meshgrid(x, y)
    # Gentle slope from north (upstream 160m) to south (downstream 65m)
    base_elev = 160.0 - X * 95.0
    # Wide shallow braided floodplain depression
    braided_valley = ((Y) ** 2) * 18.0
    dem = base_elev + braided_valley + np.random.normal(0, 1.5, (ny, nx))
    dem = np.clip(dem, 50.0, 250.0).astype(np.float32)
    create_geotiff(basin_dir / "dem.tif", dem, (min_lon, min_lat, max_lon, max_lat))
    
    # 3. River Centerline (Braided Kosi Channel)
    river_lons = np.linspace(87.15, 86.75, 50)
    river_lats = 26.85 + 0.05 * np.cos(np.linspace(0, 3.0 * np.pi, 50))
    river_coords = [[round(float(lo), 5), round(float(la), 5)] for lo, la in zip(river_lons, river_lats)]
    river_geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"river_name": "Kosi River", "reach": "Kosi Barrage Downstream Reach"},
            "geometry": {
                "type": "LineString",
                "coordinates": river_coords
            }
        }]
    }
    create_geojson(basin_dir / "river.geojson", river_geojson)
    
    # 4. Landuse (40: Cropland / Agriculture, 30: Grassland, 50: Dense Rural Settlement, 80: Braided Water)
    landuse = np.full((ny, nx), 40, dtype=np.int16) # Cropland
    landuse[np.abs(Y) < 0.20] = 80 # Braided channels
    landuse[np.abs(Y) > 0.65] = 30 # Grassland / wetlands
    # Dense rural villages in floodplain
    landuse[(X > 0.4) & (np.abs(Y) > 0.25) & (np.abs(Y) < 0.55)] = 50
    create_geotiff(basin_dir / "landuse.tif", landuse, (min_lon, min_lat, max_lon, max_lat))
    
    # 5. Population density (High density in Bihar plains)
    pop = np.zeros((ny, nx), dtype=np.float32)
    pop[landuse == 50] = np.random.uniform(200, 600, np.sum(landuse == 50))
    pop[landuse == 40] = np.random.uniform(20, 80, np.sum(landuse == 40))
    create_geotiff(basin_dir / "population.tif", pop, (min_lon, min_lat, max_lon, max_lat))
    
    # 6. Scenario Config
    config = {
        "scenario_id": "kosi-bihar-monsoon-breach",
        "description": "Monsoon flood overtopping breach simulation for Kosi River Barrage / Embankment in North Bihar.",
        "basin": {
            "name": "Kosi River Basin",
            "aoi_boundary": "datasets/kosi/aoi.geojson",
            "state": "Bihar",
            "country": "India"
        },
        "inputs": {
            "dem": "datasets/kosi/dem.tif",
            "river_network": "datasets/kosi/river.geojson",
            "land_use": "datasets/kosi/landuse.tif",
            "population": "datasets/kosi/population.tif"
        },
        "dam": {
            "name": "Kosi Barrage / Dam",
            "location": [26.85, 86.95],
            "height_m": 42.0,
            "storage_volume_mcm": 850.0,
            "dam_type": "earthfill_barrage",
            "crest_length_m": 1150.0
        },
        "breach": {
            "failure_type": "overtopping",
            "breach_width_m": 250.0,
            "breach_formation_time_hr": 0.50,
            "reservoir_level_pct": 105.0,
            "breach_model": "froehlich_2008"
        },
        "run_settings": {
            "grid_resolution_m": 30.0,
            "manning_n": 0.030,
            "simulation_duration_hr": 24.0,
            "target_crs": "EPSG:32645"
        }
    }
    with open(basin_dir / "scenario_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"Created Kosi Scenario Config: {basin_dir / 'scenario_config.json'}")

def generate_tehri():
    """
    Tehri Dam Basin (Uttarakhand)
    Deep Himalayan gorge, extreme hydraulic head (260.5m).
    Location: 30.3783 N, 78.4803 E
    """
    basin_dir = BASE_DIR / "tehri"
    basin_dir.mkdir(parents=True, exist_ok=True)
    
    min_lon, min_lat, max_lon, max_lat = 78.20, 30.15, 78.75, 30.55
    nx, ny = 120, 80
    
    # 1. AOI Boundary
    aoi_poly = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"name": "Tehri Bhagirathi Basin Study Area", "state": "Uttarakhand"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat]
                ]]
            }
        }]
    }
    create_geojson(basin_dir / "aoi.geojson", aoi_poly)
    
    # 2. DEM: Deep Himalayan V-Gorge (Elevation 350m to 2400m)
    x = np.linspace(0, 1, nx)
    y = np.linspace(-1, 1, ny)
    X, Y = np.meshgrid(x, y)
    base_elev = 2200.0 - X * 1800.0
    v_gorge = (np.abs(Y) ** 1.7) * 800.0
    dem = base_elev + v_gorge + np.random.normal(0, 8, (ny, nx))
    dem = np.clip(dem, 320.0, 2800.0).astype(np.float32)
    create_geotiff(basin_dir / "dem.tif", dem, (min_lon, min_lat, max_lon, max_lat))
    
    # 3. River Centerline (Bhagirathi / Ganga Reach)
    river_lons = np.linspace(78.68, 78.25, 50)
    river_lats = 30.38 + 0.06 * np.sin(np.linspace(0, 2.0 * np.pi, 50))
    river_coords = [[round(float(lo), 5), round(float(la), 5)] for lo, la in zip(river_lons, river_lats)]
    river_geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"river_name": "Bhagirathi River", "reach": "Tehri Dam to Rishikesh Reach"},
            "geometry": {
                "type": "LineString",
                "coordinates": river_coords
            }
        }]
    }
    create_geojson(basin_dir / "river.geojson", river_geojson)
    
    # 4. Landuse
    landuse = np.full((ny, nx), 10, dtype=np.int16) # Dense riverine forest
    landuse[np.abs(Y) < 0.10] = 80 # River channel
    landuse[np.abs(Y) > 0.50] = 60 # Rocky gorge walls
    landuse[(X > 0.7) & (np.abs(Y) < 0.25)] = 50 # Rishikesh / downstream towns
    create_geotiff(basin_dir / "landuse.tif", landuse, (min_lon, min_lat, max_lon, max_lat))
    
    # 5. Population
    pop = np.zeros((ny, nx), dtype=np.float32)
    pop[landuse == 50] = np.random.uniform(100, 350, np.sum(landuse == 50))
    create_geotiff(basin_dir / "population.tif", pop, (min_lon, min_lat, max_lon, max_lat))
    
    # 6. Scenario Config
    config = {
        "scenario_id": "tehri-bhagirathi-overtopping",
        "description": "Extreme PMF overtopping dam failure scenario for Tehri Dam on Bhagirathi River.",
        "basin": {
            "name": "Bhagirathi River Basin (Tehri)",
            "aoi_boundary": "datasets/tehri/aoi.geojson",
            "state": "Uttarakhand",
            "country": "India"
        },
        "inputs": {
            "dem": "datasets/tehri/dem.tif",
            "river_network": "datasets/tehri/river.geojson",
            "land_use": "datasets/tehri/landuse.tif",
            "population": "datasets/tehri/population.tif"
        },
        "dam": {
            "name": "Tehri Dam",
            "location": [30.3783, 78.4803],
            "height_m": 260.5,
            "storage_volume_mcm": 3540.0,
            "dam_type": "rockfill",
            "crest_length_m": 575.0
        },
        "breach": {
            "failure_type": "overtopping",
            "breach_width_m": 160.0,
            "breach_formation_time_hr": 0.75,
            "reservoir_level_pct": 100.0,
            "breach_model": "froehlich_2008"
        },
        "run_settings": {
            "grid_resolution_m": 30.0,
            "manning_n": 0.042,
            "simulation_duration_hr": 24.0,
            "target_crs": "EPSG:32644"
        }
    }
    with open(basin_dir / "scenario_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"Created Tehri Scenario Config: {basin_dir / 'scenario_config.json'}")

if __name__ == "__main__":
    generate_chenab()
    generate_kosi()
    generate_tehri()
    print("All multi-basin datasets successfully generated!")
