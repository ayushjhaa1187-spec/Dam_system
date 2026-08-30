"""
FastAPI Chat Router for HydroBreach / FloodLab AI Assistant.
Answers user queries on dam breaks, SPH vs Delft3D hydrodynamics, HADR zoning,
satellite monitoring, and current simulation context using Gemini AI.
"""

import os
import json
import logging
import urllib.request
import urllib.error
from typing import List, Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from floodlab.config.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_api_key():
    return get_settings().gemini_api_key or os.getenv("AI_API_KEY") or ""


SYSTEM_PROMPT = """You are "HydroBot AI" (JalRakshak AI), the AI assistant for HydroBreach / FloodLab.
HydroBreach is an Indian dam break, river blockage flash flood simulation, and HADR decision-support platform.

YOUR DOMAIN EXPERTISE:
1. Hydrodynamic Solvers:
   - SPH (Smoothed Particle Hydrodynamics): Mesh-free Lagrangian solver with Wendland C2 kernel, Tait EOS,
     and Monaghan viscosity. Ideal for steep initial surge shock fronts, wave runup, and debris flows.
   - Delft3D Flexible Mesh / 2D SWE: Finite volume Eulerian 2D Shallow Water Equations with wetting/drying front
     tracking, Manning friction (n), and bed slope reconstruction.
   - Scenario Comparison: Critical Success Index (CSI >= 0.70 benchmark threshold), Probability of Detection (POD),
     False Alarm Ratio (FAR), and mean depth difference (Δh).
2. Empirical Breach Mechanics:
   - Froehlich (2008): Parametric breach width B_avg = 0.27 * V_w^0.32 * H_w^0.04, formation time t_f,
     and peak discharge Q_p = 0.607 * V_w^0.295 * H_w^1.24.
   - MacDonald & Langridge-Monopolis (1984): Volume of eroded embankment material.
   - Von Thun & Gillette (1990): Erosion rates for cohesive vs erodible embankments.
   - Ritter & Stoker: Analytical instantaneous gravity dam failure.
   - Costa & Schuster / Walder: Landslide Dam Outburst Flood (LDOF) for natural blockages.
3. HADR Hazard & Damage Assessment:
   - Hazard Rating: HR = d * (v + 0.5) + DF (NDMA/CWC/Defra standard), where d is depth (m),
     v is velocity (m/s), DF is debris factor.
   - Tactical Evacuation Zoning:
     * Red Zone (< 30 min arrival, high velocity): Forced immediate evacuation & motorboat deployment.
     * Orange Zone (30-120 min): Pre-emptive evacuation to shelters.
     * Yellow Zone (> 120 min): Advisory monitoring & standby.
   - Economic loss curves in ₹ Crores (INR).
4. Satellite Surveillance (GEE Sentinel-1 SAR):
   - Sentinel-1 C-band SAR backscatter change detection for natural dam/lake formations.
   - Adaptive Otsu water thresholding.
   - Impounded water volume estimation: V = (1/3) * A * h_depth.
   - Early Warning System (EWS) 1-click simulation trigger.
5. Indian Benchmark Scenarios:
   - Rishi Ganga & Dhauliganga (Uttarakhand 2021 Disaster Benchmark).
   - Bhakra Dam (Sutlej River, HP / Punjab).
   - Tehri Dam (Bhagirathi River, Uttarakhand).
   - Hirakud Dam (Mahanadi River, Odisha).

RESPONSE GUIDELINES:
- Provide clear, professional, scientifically rigorous, and helpful answers for engineers and responders.
- Format equations clearly using markdown or standard math notation.
- If live app context is provided, tailor your response to that context.
- Keep responses structured with headings and bullet points.
"""


class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant or model")
    content: str = Field(..., description="The message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's question")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Current simulation or app context")


class ChatResponse(BaseModel):
    reply: str
    model: str = "gemini-3.6-flash"
    status: str = "success"


def _call_gemini_api(user_message: str, history: List[ChatMessage], context: Optional[Dict[str, Any]]) -> str:
    api_key = _get_api_key()
    if not api_key:
        return _fallback_response(user_message, context)

    contents = []

    augmented_system = SYSTEM_PROMPT
    if context:
        augmented_system += f"\n\nLIVE APP CONTEXT:\n{json.dumps(context, indent=2)}"

    for item in history[-8:]:
        role = "user" if item.role in ["user", "human"] else "model"
        contents.append({"role": role, "parts": [{"text": item.content}]})

    if not contents:
        full_user_prompt = f"[System Context: {augmented_system}]\n\nUser Question: {user_message}"
        contents.append({"role": "user", "parts": [{"text": full_user_prompt}]})
    else:
        contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {"contents": contents, "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024, "topP": 0.95}}

    candidate_models = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]

    for model_name in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
        except urllib.error.HTTPError as e:
            logger.warning("Gemini model %s error %s: %s", model_name, e.code, e.read().decode()[:100])
            continue
        except Exception as e:
            logger.warning("Gemini model %s failed: %s", model_name, e)
            continue

    return _fallback_response(user_message, context)


def _fallback_response(user_message: str, context: Optional[Dict[str, Any]]) -> str:
    msg_lower = user_message.lower()

    if any(k in msg_lower for k in ["rishi ganga", "2021", "chamoli"]):
        return (
            "### 🌊 Rishi Ganga 2021 Disaster Benchmark\n\n"
            "On **7 February 2021**, a massive rock and ice avalanche from Ronti Peak (~5,600m) "
            "triggered a catastrophic flash flood in the Rishi Ganga and Dhauliganga valleys in Uttarakhand.\n\n"
            "- **Mechanism**: Landslide/avalanche dam blockage followed by sudden outburst flood (LDOF).\n"
            "- **Peak Discharge ($Q_p$)**: Estimated between 4,500 – 6,000 m³/s.\n"
            "- **Impacted Infrastructure**: Destroyed the 13.2 MW Rishi Ganga Small Hydro Project and Tapovan HEP.\n"
            "- **HydroBreach Modeling**: Coupled WCSPH debris flow and Delft3D 2D SWE down to Joshimath."
        )
    elif any(k in msg_lower for k in ["sph", "delft", "difference", "compare"]):
        return (
            "### 🔬 SPH vs Delft3D Comparison\n\n"
            "HydroBreach integrates two complementary simulation engines:\n\n"
            "1. **Smoothed Particle Hydrodynamics (SPH - DualSPHysics)**:\n"
            "   - **Type**: Mesh-free Lagrangian particle physics.\n"
            "   - **Strengths**: Captures 3D violent dam break shock waves and debris avalanches.\n\n"
            "2. **Delft3D Flexible Mesh / 2D SWE**:\n"
            "   - **Type**: Finite volume Eulerian 2D Shallow Water Equations.\n"
            "   - **Strengths**: High efficiency for long-reach floodplain routing (50–100 km).\n\n"
            "3. **Verification**: Co-registered using the **Critical Success Index (CSI)**:\n"
            "   $$\\text{CSI} = \\frac{A}{A + B + C} \\ge 0.70$$"
        )
    elif any(k in msg_lower for k in ["hazard", "evacuation", "red zone", "hadr"]):
        return (
            "### ⚠️ HADR Hazard Rating & Evacuation Zoning\n\n"
            "HydroBreach evaluates life safety hazard using the **Defra / CWC Standard Formula**:\n\n"
            "$$\\text{HR} = d \\cdot (v + 0.5) + \\text{DF}$$\n\n"
            "- **$d$**: Inundation water depth (meters)\n"
            "- **$v$**: Flood flow velocity (m/s)\n"
            "- **$\\text{DF}$**: Debris Factor ($0.0$ for clear water, $1.0$ for mountain debris)\n\n"
            "#### Tactical HADR Evacuation Zones:\n"
            "- 🔴 **Red Zone (Forced Evacuation)**: Wave arrival lead time $< 30\\text{ min}$ or $\\text{HR} \\ge 2.0$.\n"  # noqa: E501
            "- 🟠 **Orange Zone (Pre-emptive Shelter)**: Wave arrival $30 - 120\\text{ min}$.\n"
            "- 🟡 **Yellow Zone (Standby Advisory)**: Wave arrival $> 120\\text{ min}$."
        )
    elif any(k in msg_lower for k in ["gee", "satellite", "sentinel", "lake"]):
        return (
            "### 🛰️ Google Earth Engine Sentinel-1 SAR Monitoring\n\n"
            "HydroBreach uses Sentinel-1 C-band SAR imagery to monitor high-risk Himalayan valleys:\n\n"
            "- **All-Weather Capability**: Penetrates cloud cover and monsoonal storms.\n"
            "- **Adaptive Otsu Thresholding**: Automatically separates water backscatter "
            "(low dB $\\approx -16\\text{ to } -22\\text{ dB}$) from surrounding terrain.\n"
            "- **Volume Estimation**: $V = \\frac{1}{3} \\cdot A \\cdot h_{\\text{depth}}$ using DEM cross-sections.\n"
            "- **EWS Alert Trigger**: Instantly initiates a coupled outburst flood simulation."
        )
    elif any(k in msg_lower for k in ["froehlich", "breach", "discharge"]):
        return (
            "### 📉 Froehlich (2008) Dam Breach Equations\n\n"
            "Froehlich's regression equations calibrated against historical dam failures:\n\n"
            "- **Average Breach Width**: $B_{\\text{avg}} = 0.27 \\cdot V_w^{0.32} \\cdot H_w^{0.04}$\n"
            "- **Breach Formation Time**: $t_f = \\frac{0.0179 \\cdot V_w^{0.36}}{H_w^{0.33}}$ (hours)\n"
            "- **Peak Outflow Discharge**: $Q_p = 0.607 \\cdot V_w^{0.295} \\cdot H_w^{1.24}$ (m³/s)"
        )
    else:
        curr_dam = context.get("name", "Indian Dam Scenario") if context else "Indian River & Dam Scenario"
        return (
            f"### 🌊 HydroBot AI Assistant\n\n"
            f"I am active and monitoring **{curr_dam}**.\n\n"
            "I can assist you with:\n"
            "- **Dam Breach Analysis**: Froehlich, MacDonald, Von Thun, Ritter & Stoker.\n"
            "- **Hydrodynamics**: SPH particle physics vs Delft3D Flexible Mesh 2D SWE.\n"
            "- **HADR Response**: Hazard Ratings ($HR = d(v+0.5)+DF$) and evacuation maps.\n"
            "- **Satellite Surveillance**: Sentinel-1 SAR lake detection & volume calculation.\n"
            "- **Indian Benchmarks**: Rishi Ganga 2021, Tehri, Bhakra, and Hirakud dams.\n\n"
            "What would you like to analyze or simulate?"
        )


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Chat endpoint for HydroBreach / FloodLab AI Assistant.
    """
    reply_text = _call_gemini_api(req.message, req.history or [], req.context)
    return ChatResponse(reply=reply_text, model="gemini-3.6-flash", status="success")
