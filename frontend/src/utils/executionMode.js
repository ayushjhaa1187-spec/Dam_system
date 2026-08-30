/**
 * executionMode.js
 * Global execution mode types and UI badge for FloodLab.
 *
 * Every result must display which mode produced it so judges can never
 * mistake a local prototype calculation for a real solver run.
 */
import React from "react";

// --- Mode Enum ---
export const EXECUTION_MODES = {
  DEMO_FIXTURE:      "DEMO_FIXTURE",
  LOCAL_CALCULATION: "LOCAL_CALCULATION",
  BACKEND_API:       "BACKEND_API",
  REAL_SOLVER:       "REAL_SOLVER",
};

// --- Mode Metadata ---
const MODE_META = {
  DEMO_FIXTURE: {
    label: "DEMO FIXTURE",
    sublabel: "Static illustrative data",
    dot: "#94a3b8",
    bg: "rgba(30,41,59,0.9)",
    border: "#475569",
    text: "#cbd5e1",
  },
  LOCAL_CALCULATION: {
    label: "LOCAL CALCULATION",
    sublabel: "Empirical breach hydrograph \u00b7 Froehlich 2008",
    dot: "#f59e0b",
    bg: "rgba(78,42,10,0.9)",
    border: "#d97706",
    text: "#fcd34d",
  },
  BACKEND_API: {
    label: "BACKEND API",
    sublabel: "FastAPI empirical adapter (server-side)",
    dot: "#38bdf8",
    bg: "rgba(8,47,73,0.9)",
    border: "#0284c7",
    text: "#7dd3fc",
  },
  REAL_SOLVER: {
    label: "REAL SOLVER",
    sublabel: "Verified DualSPHysics / Delft3D FM run",
    dot: "#34d399",
    bg: "rgba(6,46,28,0.9)",
    border: "#059669",
    text: "#6ee7b7",
  },
};

/**
 * Returns one of EXECUTION_MODES based on the provenance field in a result.
 */
export function getModeFromResult(simulationResult) {
  if (!simulationResult) return EXECUTION_MODES.LOCAL_CALCULATION;
  const level = (
    simulationResult?.provenance?.level ||
    simulationResult?.scientific_metadata?.validation_status ||
    ""
  ).toUpperCase();
  if (level.includes("REAL_SOLVER") || level.includes("DUALSPH") || level.includes("DELFT3D")) {
    return EXECUTION_MODES.REAL_SOLVER;
  }
  if (level.includes("BACKEND") || level.includes("MODELLED")) {
    return EXECUTION_MODES.BACKEND_API;
  }
  return EXECUTION_MODES.LOCAL_CALCULATION;
}

/**
 * Small colored pill badge indicating the current execution mode.
 * @param {{ mode: string, compact?: boolean, showSublabel?: boolean }} props
 */
export function ExecutionModeBadge({ mode, compact = false, showSublabel = false }) {
  const m = MODE_META[mode] || MODE_META.LOCAL_CALCULATION;
  const dotStyle = {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: m.dot,
    flexShrink: 0,
    display: "inline-block",
  };

  if (compact) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: m.bg, border: `1px solid ${m.border}`, borderRadius: 6,
        padding: "2px 8px", fontSize: 10, fontFamily: "monospace",
        fontWeight: 700, color: m.text, whiteSpace: "nowrap",
      }}>
        <span style={dotStyle} />
        {m.label}
      </span>
    );
  }

  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", gap: 2,
      background: m.bg, border: `1px solid ${m.border}`, borderRadius: 8,
      padding: "6px 12px", fontFamily: "monospace",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: m.text }}>
        <span style={dotStyle} />
        {m.label}
      </span>
      {showSublabel && (
        <span style={{ fontSize: 9, color: m.text, opacity: 0.75, paddingLeft: 13 }}>
          {m.sublabel}
        </span>
      )}
    </div>
  );
}

/**
 * Full-width attention banner shown at top of dashboard screens.
 * Only rendered for LOCAL_CALCULATION and DEMO_FIXTURE modes.
 */
export function ExecutionModeBanner({ mode, backendStatus }) {
  if (mode === EXECUTION_MODES.REAL_SOLVER) return null;
  if (mode === EXECUTION_MODES.BACKEND_API && backendStatus === "ONLINE") return null;
  const m = MODE_META[mode] || MODE_META.LOCAL_CALCULATION;
  const isOffline = backendStatus === "OFFLINE";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10,
      padding: "8px 16px", marginBottom: 12, fontFamily: "monospace",
      fontSize: 11, color: m.text, gap: 8, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
        <strong>Current mode: {m.label}</strong>
        <span style={{ opacity: 0.7 }}>
          &middot; Backend: {isOffline ? "OFFLINE" : "CHECKING"} &middot; Source: {m.sublabel}
        </span>
      </div>
      <span style={{ fontSize: 9, opacity: 0.65, whiteSpace: "nowrap" }}>
        Scientific solver: Not connected in this deployment
      </span>
    </div>
  );
}
