"""
HydroBreach - Uncertainty Ensemble Wrapper
Runs multiple dam breach simulations with varied parameters (breach width, formation time, head).
"""

from typing import List
import random
from hydrobreach.models.breach_mechanics import BreachMechanicsEngine, DamBreachInput, BreachResult


class BreachUncertaintyEnsemble:
    """Runs Monte-Carlo style ensembles for breach parameters."""

    @classmethod
    def run_ensemble(
        cls, base_input: DamBreachInput, model_type: str = "auto", num_runs: int = 10
    ) -> List[BreachResult]:
        """
        Vary hydraulic_head, dam_height, and potentially material_cohesion.
        Since we dont have direct width/time inputs to evaluate (they are calculated),
        we vary the inputs that drive them.
        """
        results = []

        for i in range(num_runs):
            # Clone input
            run_input = DamBreachInput(**base_input.dict())

            # Vary head by +/- 10%
            head_variation = random.uniform(0.9, 1.1)
            run_input.hydraulic_head_m = base_input.hydraulic_head_m * head_variation

            # Vary reservoir volume by +/- 5%
            vol_variation = random.uniform(0.95, 1.05)
            run_input.reservoir_volume_m3 = base_input.reservoir_volume_m3 * vol_variation

            res = BreachMechanicsEngine.evaluate(run_input, model_type=model_type)
            res.summary["ensemble_run_id"] = i
            res.summary["head_multiplier"] = head_variation
            res.summary["vol_multiplier"] = vol_variation

            results.append(res)

        return results
