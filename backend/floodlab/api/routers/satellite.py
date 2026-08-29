from fastapi import APIRouter
from floodlab.satellite.gee import GEESentinel1Module

router = APIRouter()


@router.post("/sentinel1")
async def process_sentinel1(body: dict):
    module = GEESentinel1Module()
    return module.execute_workflow(
        body.get("aoi", {}),
        body.get("pre_event", "2023-01-01"),
        body.get("post_event", "2023-01-05")
    )
