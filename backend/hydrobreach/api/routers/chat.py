"""
FastAPI Chat Router for HydroBreach AI Assistant.
Answers user queries on dam breaks, SPH vs Delft3D hydrodynamics, HADR zoning,
satellite monitoring, and current simulation context using Gemini AI.
"""

from floodlab.api.routers.chat import router, ChatRequest, ChatResponse  # noqa: F401
