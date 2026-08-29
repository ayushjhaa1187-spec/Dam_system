import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, LayoutDashboard, PlusCircle, Activity, Map, Download, Sparkles } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to FLOODLAB (HydroBreach)',
    icon: Sparkles,
    badge: 'Overview',
    description: 'HydroBreach is an operational HADR decision-support platform designed for catastrophic dam breaks, glacial lake outbursts (GLOF), and Himalayan flash flood routing.',
    bullets: [
      'Multi-scale physics: DualSPHysics 3D particle near-field coupled to Delft3D flexible-mesh 2D shallow water equations.',
      'Copernicus Sentinel-1 SAR & Sentinel-2 optical surveillance for near-real-time flood detection.',
      '5 distinct product screens for complete scenario lifecycle management.',
    ],
  },
  {
    title: 'Screen 1: Home & Case Studies',
    icon: LayoutDashboard,
    badge: 'Screen 1',
    description: 'Explore Indian river dam breach case studies (Tehri Dam, Rishi Ganga 2021 GLOF benchmark, Bhakra Dam, Hirakud Dam).',
    bullets: [
      'Load pre-calibrated historical or hypothetical emergency scenarios.',
      'Inspect real-time telemetry connectivity and data provenance.',
      'Access your recent simulation runs with one click.',
    ],
  },
  {
    title: 'Screen 2: Create Scenario Wizard',
    icon: PlusCircle,
    badge: 'Screen 2',
    description: 'Build custom dam failure or landslide lake outburst flood scenarios with a step-by-step wizard.',
    bullets: [
      'Step 1: Dam Identity & Structural Parameters',
      'Step 2: Reservoir Volume & Hydraulic Head',
      'Step 3: River Reach & Manning’s Roughness (n)',
      'Step 4: SCS-CN Inflow Hydrology & Breach Model (Froehlich / MacDonald / Ritter)',
      'Upload custom GeoTIFF / KML / GeoJSON / Shapefile ZIP layers with automatic CRS verification and autosave recovery.',
    ],
  },
  {
    title: 'Screen 3: Run Monitor',
    icon: Activity,
    badge: 'Screen 3',
    description: 'Track simulation solver execution in real time with step-by-step progress and live streaming logs.',
    bullets: [
      'Phase tracker: Breach mechanics -> 3D SPH -> 2D Delft3D-FM -> Exposure & Loss -> GIS outputs.',
      'Log severity filter (INFO, WARNING, ERROR) and auto-scroll.',
      'Compute metadata: RAM usage, active particles, solver convergence, and input hash reproducibility.',
    ],
  },
  {
    title: 'Screen 4: Results Map',
    icon: Map,
    badge: 'Screen 4',
    description: 'Fullscreen interactive geospatial exploration with multi-layer overlays and synchronized time sliders.',
    bullets: [
      'Toggle Modelled Inundation, SPH 3D Particles, Observed Sentinel-1 SAR, Difference layer, Settlements & Evacuation Routes.',
      'Colorblind-safe high-contrast palettes (Viridis, Cividis, Magma, Plasma).',
      'Click Probe / Location Inspector: Click anywhere on the map to query depth, velocity, arrival time, and hazard rating.',
    ],
  },
  {
    title: 'Screen 5: Impact & Export',
    icon: Download,
    badge: 'Screen 5',
    description: 'Comprehensive HADR damage estimation, evacuation prioritization, uncertainty analysis, and standardized GIS downloads.',
    bullets: [
      'District-wise exposure, displaced persons, structure damage, and NDRF logistics table.',
      'Uncertainty ensemble bounds (P10/P50/P90) and parameter sensitivity ranking.',
      'Download GeoJSON, Google Earth KML, ESRI Shapefile ZIP, GeoTIFF Rasters, CSV, Decision-Maker PDF, and ZIP Run Packages.',
    ],
  },
];

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                {step.badge} &bull; Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </span>
              <h3 className="text-base font-bold text-slate-100">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            {step.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar & Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <div className="flex space-x-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1 shadow-md shadow-cyan-500/20"
            >
              <span>{currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
