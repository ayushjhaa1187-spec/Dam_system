"""
HydroShield Scenario Runner CLI.
Runs hydrodynamic flood simulations directly from scenario configuration files.

Usage:
    python -m floodlab.runners.scenario_runner --config datasets/chenab/scenario_config.json --output storage/outputs/chenab_run
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from floodlab.services.simulation_runner import run_simulation


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="HydroShield Customizable Simulation Framework - Scenario Runner"
    )
    parser.add_argument(
        "--config", "-c",
        required=True,
        help="Path to scenario configuration file (JSON or YAML)"
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="Output directory to save simulation rasters, vectors, and metrics"
    )
    parser.add_argument(
        "--run-id",
        default=None,
        help="Optional custom run ID"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print result payload strictly as JSON"
    )

    args = parser.parse_args(argv)

    cfg_path = Path(args.config)
    if not cfg_path.exists():
        for cand in [Path.cwd() / cfg_path, Path.cwd().parent / cfg_path, Path(__file__).parents[3] / cfg_path]:
            if cand.exists():
                cfg_path = cand
                break

    if not cfg_path.exists():
        print(f"Error: Config file not found at {args.config}", file=sys.stderr)
        sys.exit(1)

    if not args.json:
        print("=" * 70)
        print("  HydroShield Generic Simulation Framework")
        print(f"  Config: {cfg_path.resolve()}")
        print("=" * 70)

    try:
        def on_progress(pct, frame):
            if not args.json:
                sys.stdout.write(f"\r[Progress: {pct:5.1f}%] T = {frame['time_minutes']:6.1f} min | Inundated: {frame['inundated_area_km2']:6.2f} km²")
                sys.stdout.flush()

        result = run_simulation(
            config=cfg_path,
            output_dir=args.output,
            run_id=args.run_id,
            progress_callback=on_progress if not args.json else None
        )

        if not args.json:
            print("\n" + "=" * 70)
            print("  Simulation Completed Successfully!")
            print("=" * 70)
            print(f"  Scenario ID:       {result.scenario_id}")
            print(f"  Run ID:            {result.run_id}")
            print(f"  Basin:             {result.basin_name}")
            print(f"  Dam:               {result.dam_name}")
            print(f"  Peak Inflow Q:     {result.peak_discharge_m3s:,.1f} m³/s")
            print(f"  Max Flood Depth:   {result.max_flood_depth_m:.2f} m")
            print(f"  Peak Flow Speed:   {result.max_flow_velocity_ms:.2f} m/s")
            print(f"  Inundated Area:    {result.max_inundated_area_km2:.2f} km²")
            print(f"  Population Risk:   {result.exposure.population_at_risk:,} people")
            print(f"  Compute Duration:  {result.execution_time_seconds:.2f} s")
            print(f"  Output Directory:  {result.output_directory}")
            print("-" * 70)
            print("  Exported Output Assets:")
            for k, meta in result.output_rasters.items():
                print(f"    - [{meta.layer_name}] {meta.file_path}")
            for k, fpath in result.output_vectors.items():
                print(f"    - [{k}] {fpath}")
            print("=" * 70)
        else:
            print(result.model_dump_json(indent=2))

    except Exception as e:
        print(f"\n[Simulation Failed]: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
