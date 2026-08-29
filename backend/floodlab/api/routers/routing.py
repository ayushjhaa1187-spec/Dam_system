from fastapi import APIRouter
from floodlab.engines.routing.network import EvacuationRouter

router = APIRouter()


@router.post("/evacuation-plan")
async def create_evacuation_plan(body: dict):
    router_engine = EvacuationRouter()
    router_engine.build_network_from_geojson({})
    time_limit = body.get("time_constraint", 120.0)
    route, time = router_engine.find_shortest_safe_route("settlement_a", ["shelter_1"], time_limit)
    return {
        "status": "success",
        "route": route,
        "travel_time": time,
        "margin_of_safety": time_limit - time,
    }
