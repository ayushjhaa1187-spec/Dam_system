import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, LayoutDashboard, PlusCircle, Activity, Map, Download, Sparkles } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to HydroShield',
    icon: Sparkles,
    badge: 'Overview',
    description: 'HydroShield is an operational HADR decision-support platform designed for catastrophic dam breaks, glacial lake outbursts (GLOF), and Himalayan flash flood routing.',
    bullets: [
      'Multi-scale physics: DualSPHysics 3D particle near-field coupled to Delft3D flexible-mesh 2D shallow water equations.',
      'Copernicus Sentinel-1 SAR & Sentinel-2 optical surveillance for near-real-time flood detection.',
      '6 top views and comprehensive GIS analytics for complete scenario lifecycle management.',
    ],
  },
  {
    title: 'Screen 1: Mission Control & Case Studies',
    icon: LayoutDashboard,
    badge: 'Dashboard',
    description: 'Explore Indian river dam breach case studies (Chenab River, Tehri Dam, Rishi Ganga 2021 GLOF benchmark, Bhakra Dam, Hirakud Dam).',
    bullets: [
      'Load pre-calibrated historical or hypothetical emergency scenarios.',
      'Inspect real-time telemetry connectivity and data provenance.',
      'Access your recent simulation runs with one click.',
    ],
  },
  {
    title: 'Screen 2: Create Scenario Wizard',
    icon: PlusCircle,
    badge: 'Wizard',
    description: 'Build custom dam failure or landslide lake outburst flood scenarios with a step-by-step wizard.',
    bullets: [
      'Step 1: Dam Identity & Structural Parameters',
      'Step 2: Reservoir Volume & Hydraulic Head',
      'Step 3: River Reach & Manning’s Roughness (n)',
      'Step 4: Breach Trigger Model (Instantaneous / Overtopping / Piping)',
    ],
  },
  {
    title: 'Screen 3: Geospatial Data Studio',
    icon: Activity,
    badge: 'Data Studio',
    description: 'Ingest high-resolution terrain DEMs, river centerline shapefiles, reservoir capacity tables, and live GEE satellite feeds with 3D isometric layer stacking.',
    bullets: [
      'Interactive 3D isometric perspective stack with co-registered WGS84 layers.',
      'Automated EPSG:4326 reprojection and validation pipeline.',
      'Direct Google Earth Engine SAR synchronization.',
    ],
  },
  {
    title: 'Screen 4: Dual Solver Comparison',
    icon: Map,
    badge: 'Comparison',
    description: 'Side-by-side synchronized spatial co-registration between 3D Lagrangian Smooth Particle Hydrodynamics and 2D Eulerian Delft3D Flexible Mesh.',
    bullets: [
      'Synchronized dual map viewports with independent depth and velocity legends.',
      'Overlaid hydrographs and inundated area growth curves.',
      'Statistical Critical Success Index (CSI) and true positive detection rate.',
    ],
  },
  {
    title: 'Screen 5: HADR Decision Brief & Export Hub',
    icon: Download,
    badge: 'Reports',
    description: 'Comprehensive HADR damage estimation, evacuation prioritization, uncertainty analysis, and standardized GIS downloads.',
    bullets: [
      '120-Page Executive Publication Dossier with all 7 verified technical chapters.',
      'One-click downloads: ESRI Shapefile ZIP, Google Earth KML, and analytical CSV.',
      'NDRF emergency logistics dispatch directives.',
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-blue-700 uppercase tracking-wider font-semibold">
                {step.badge} &bull; Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </span>
              <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            {step.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar & Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200">
          <div className="flex space-x-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
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
