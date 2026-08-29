import math
from typing import List, Dict, Any

class ExposureCalculator:
    def __init__(self):
        # Weights for transparent priority formula
        self.w_time = 0.35
        self.w_hazard = 0.30
        self.w_pop = 0.25
        self.w_critical = 0.10

    def calculate_priority_score(self, arrival_time_hr: float, depth_m: float, velocity_ms: float, pop_exposed: int, critical_assets: int) -> float:
        # Normalize variables roughly (this is a simple transparent implementation)
        # short arrival time (0-12 hrs, inverted so 0 is highest risk, 12 is lowest)
        norm_time = max(0, min(1, 1 - (arrival_time_hr / 12.0)))

        # hazard: depth * velocity (0-10)
        hazard_val = depth_m * velocity_ms
        norm_hazard = max(0, min(1, hazard_val / 10.0))

        # population: 0-5000
        norm_pop = max(0, min(1, pop_exposed / 5000.0))

        # critical assets: 0-5
        norm_assets = max(0, min(1, critical_assets / 5.0))

        score = (
            self.w_time * norm_time +
            self.w_hazard * norm_hazard +
            self.w_pop * norm_pop +
            self.w_critical * norm_assets
        )
        return score

    def evaluate_settlements(self, settlements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for s in settlements:
            arr_time = s.get("arrival_time_hr", 12.0)
            score = self.calculate_priority_score(
                arr_time,
                s.get("max_depth_m", 0.0),
                s.get("max_velocity_ms", 0.0),
                s.get("population_exposed", 0),
                s.get("critical_infrastructure_count", 0)
            )

            if score >= 0.7:
                priority = "Critical"
            elif score >= 0.4:
                priority = "High"
            else:
                priority = "Moderate"

            s["priority_score"] = round(score, 3)
            s["priority_label"] = priority
            s["formula"] = "0.35(short arrival time) + 0.30(depth/velocity hazard) + 0.25(population exposed) + 0.10(critical assets)"
            results.append(s)

        # Sort by priority
        return sorted(results, key=lambda x: x["priority_score"], reverse=True)
