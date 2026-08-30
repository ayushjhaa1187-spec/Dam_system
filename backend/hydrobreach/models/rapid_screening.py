"""
HydroBreach - Rapid Screening Solver
Produces preliminary inundation extent based on HAND / elevation thresholds.
"""

import numpy as np
from typing import Dict, Any

class RapidScreeningSolver:
    @classmethod
    def run_screening(cls, dem_grid: np.ndarray, peak_q: float, cell_size_m: float) -> Dict[str, Any]:
        """
        Calculates a fast, threshold-based inundation mapping.
        DEM grid should be a 2D numpy array.
        """
        # Very simple empirical relation: max depth roughly scales with Q^0.3
        max_h_est = 0.5 * (peak_q ** 0.3)
        
        # HAND-like thresholding (assuming DEM is already relative to nearest stream or we just threshold)
        # For simplicity in this MVP, we just assume any elevation below min(dem) + max_h_est is flooded.
        min_elev = np.min(dem_grid)
        flood_level = min_elev + max_h_est
        
        inundated_mask = dem_grid <= flood_level
        
        # Calculate inundation area
        area_m2 = np.sum(inundated_mask) * (cell_size_m ** 2)
        
        return {
            "label": "RAPID SCREENING - NOT A DELFT3D OR SPH RESULT",
            "peak_discharge_used_m3s": peak_q,
            "estimated_flood_level_m": flood_level,
            "inundated_area_km2": area_m2 / 1e6,
            "inundated_mask": inundated_mask,
            "max_depth_est": max_h_est
        }
