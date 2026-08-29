/**
 * HydroBreach AI Chatbot Service
 * Integrates Gemini AI API and backend /api/chat with full domain context.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_AI_API_KEY ||
  '';

const SYSTEM_INSTRUCTION = `You are "HydroBot AI" (JalRakshak AI), the specialized AI assistant for HydroBreach / FloodLab.
HydroBreach is an Indian dam break, river blockage flash flood simulation, and Humanitarian Assistance and Disaster Relief (HADR) decision-support platform.

DOMAIN KNOWLEDGE:
1. Hydrodynamic Solvers:
   - SPH (Smoothed Particle Hydrodynamics): Mesh-free Lagrangian particle physics solver with Wendland C2 kernel, Tait EOS, and Monaghan viscosity. Ideal for steep initial surge shock waves, mountain debris flows, and obstacle impact.
   - Delft3D Flexible Mesh / 2D SWE: Finite volume Eulerian 2D Shallow Water Equations with wetting/drying front tracking, Manning friction (n), and bed slope reconstruction.
   - Scenario Verification: Critical Success Index (CSI >= 0.70 benchmark threshold), POD, FAR, and depth error (Δh).
2. Breach Mechanics:
   - Froehlich (2008): B_avg = 0.27 * V_w^0.32 * H_w^0.04, t_f = 0.0179 * V_w^0.36 / H_w^0.33, Q_p = 0.607 * V_w^0.295 * H_w^1.24.
   - MacDonald & Langridge-Monopolis (1984), Von Thun & Gillette (1990), Ritter analytical, Costa & Schuster / Walder LDOF.
3. HADR Hazard & Damage:
   - Hazard Rating: HR = d * (v + 0.5) + DF (NDMA/CWC/Defra standards).
   - Tactical Zones: Red (< 30 min arrival, immediate evacuation), Orange (30-120 min, shelter relocation), Yellow (> 120 min, standby).
   - Economic loss in ₹ Crores (INR).
4. Satellite Monitoring:
   - Google Earth Engine Sentinel-1 SAR backscatter change detection for landslide dams and glacial lakes.
   - Adaptive Otsu water thresholding and DEM impounded volume calculation (V = 1/3 * A * h_depth).
5. Indian Benchmarks:
   - Rishi Ganga 2021 Disaster Benchmark (Chamoli, Uttarakhand).
   - Bhakra Dam (Sutlej River, HP/Punjab).
   - Tehri Dam (Bhagirathi River, Uttarakhand).
   - Hirakud Dam (Mahanadi River, Odisha).

Format formulas, headings, and bullet points cleanly with Markdown.`;

/**
 * Send a chat message with conversation history and live simulation context.
 */
export async function sendChatMessage(message, history = [], context = null) {
  // 1. Try Backend /api/chat endpoint first
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (err) {
    console.warn('Backend /api/chat unreachable, attempting direct Gemini client call:', err.message);
  }

  // 2. Direct Gemini 3.6 Flash / Gemini 3.7 Flash API Call with API Key
  if (GEMINI_API_KEY) {
    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-2.5-flash-lite',
      'gemini-flash-latest'
    ];

    const contents = [];
    let systemText = SYSTEM_INSTRUCTION;
    if (context) {
      systemText += `\n\nCURRENT APP CONTEXT:\n${JSON.stringify(context, null, 2)}`;
    }

    // Add previous history
    const recentHistory = history.slice(-6);
    if (recentHistory.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `[System Context: ${systemText}]\n\nUser Question: ${message}` }],
      });
    } else {
      recentHistory.forEach((h) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      });
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
      },
    };

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        const resp = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          const json = await resp.json();
          const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        }
      } catch (e) {
        console.warn(`Direct call to ${modelName} failed:`, e);
      }
    }
  }

  // 3. Fallback Response Knowledge Base
  return getFallbackReply(message, context);
}

function getFallbackReply(message, context) {
  const q = message.toLowerCase();

  if (q.includes('rishi ganga') || q.includes('2021') || q.includes('chamoli')) {
    return (
      `### 🌊 Rishi Ganga 2021 Disaster Benchmark\n\n` +
      `On **7 February 2021**, a massive rock and ice avalanche triggered a catastrophic flash flood in the Rishi Ganga and Dhauliganga valleys in Chamoli, Uttarakhand.\n\n` +
      `- **Failure Mechanism**: Landslide dam / glacial blockage followed by sudden outburst (LDOF).\n` +
      `- **Peak Outflow Discharge ($Q_p$)**: ~4,500 – 6,000 m³/s.\n` +
      `- **Impact**: Destroyed Rishi Ganga Hydro Project (13.2 MW) and severely damaged Tapovan Vishnugad HEP.\n` +
      `- **HydroBreach Simulation**: Resolved using coupled WCSPH (debris flow shock front) and Delft3D 2D SWE down to Joshimath.`
    );
  }

  if (q.includes('sph') || q.includes('delft') || q.includes('difference') || q.includes('compare')) {
    return (
      `### 🔬 SPH vs Delft3D Solvers\n\n` +
      `HydroBreach couples two specialized simulation engines:\n\n` +
      `1. **Smoothed Particle Hydrodynamics (SPH)**:\n` +
      `   - Mesh-free particle physics solver capturing violent 3D shock waves, steep dam break fronts, and debris impacts.\n\n` +
      `2. **Delft3D Flexible Mesh / 2D SWE**:\n` +
      `   - High-efficiency 2D Shallow Water Equations solver for long-reach (50–100 km) river routing and floodplain inundation.\n\n` +
      `3. **Co-Registration Verification**:\n` +
      `   - Evaluated via **Critical Success Index (CSI)**: $\\text{CSI} = \\frac{A}{A + B + C} \\ge 0.70$.`
    );
  }

  if (q.includes('hazard') || q.includes('evacuation') || q.includes('red zone') || q.includes('hadr')) {
    return (
      `### ⚠️ HADR Hazard Rating & Evacuation Zoning\n\n` +
      `HydroBreach calculates life safety hazard using the **Defra / CWC Standard Formula**:\n\n` +
      `$$\\text{HR} = d \\cdot (v + 0.5) + \\text{DF}$$\n\n` +
      `- **$d$**: Flood depth (m)\n` +
      `- **$v$**: Flow velocity (m/s)\n` +
      `- **$\\text{DF}$**: Debris Factor ($0.0$ to $1.0$)\n\n` +
      `#### Tactical Evacuation Zones:\n` +
      `- 🔴 **Red Zone (< 30 min arrival)**: Forced immediate evacuation; NDRF motorboats deployed.\n` +
      `- 🟠 **Orange Zone (30–120 min)**: Pre-emptive shelter relocation.\n` +
      `- 🟡 **Yellow Zone (> 120 min)**: Advisory monitoring and logistics staging.`
    );
  }

  if (q.includes('froehlich') || q.includes('breach') || q.includes('formula')) {
    return (
      `### 📉 Froehlich (2008) Dam Breach Equations\n\n` +
      `- **Average Breach Width**: $B_{\\text{avg}} = 0.27 \\cdot V_w^{0.32} \\cdot H_w^{0.04}$\n` +
      `- **Formation Time**: $t_f = \\frac{0.0179 \\cdot V_w^{0.36}}{H_w^{0.33}}$ (hours)\n` +
      `- **Peak Outflow Discharge**: $Q_p = 0.607 \\cdot V_w^{0.295} \\cdot H_w^{1.24}$ (m³/s)\n\n` +
      `where $V_w$ is reservoir volume ($m^3$) and $H_w$ is hydraulic head ($m$).`
    );
  }

  const damName = context?.name || 'Selected Indian Dam';
  return (
    `### 🌊 HydroBot AI Assistant\n\n` +
    `I am actively analyzing **${damName}**.\n\n` +
    `You can ask me about:\n` +
    `- **Dam Breach Physics**: Froehlich, MacDonald, Von Thun, Ritter formulas\n` +
    `- **Hydrodynamics**: SPH particle physics vs Delft3D 2D SWE\n` +
    `- **Disaster Response**: NDMA/CWC Hazard Ratings ($HR = d(v+0.5)+DF$), evacuation zones\n` +
    `- **Satellite EWS**: Sentinel-1 SAR change detection and volume estimation\n` +
    `- **Indian Dam Benchmarks**: Rishi Ganga 2021, Tehri, Bhakra, and Hirakud\n\n` +
    `What would you like to explore?`
  );
}
