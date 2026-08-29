import React, { useState, useEffect } from 'react';
import { Monitor, X, AlertTriangle } from 'lucide-react';

export default function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      // Show warning if viewport width is less than 1024px (tablets / phones)
      if (window.innerWidth < 1024) {
        const dismissed = sessionStorage.getItem('hydrobreach_mobile_warning_dismissed');
        if (!dismissed) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('hydrobreach_mobile_warning_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2.5 text-amber-200 text-xs flex items-center justify-between z-40 backdrop-blur-md">
      <div className="flex items-center space-x-2.5">
        <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Desktop Recommended:</strong> Detailed GIS layer inspection, 2D hydrodynamic wave maps, and cross-section telemetry are optimized for desktop displays (&ge;1024px).
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 text-amber-400 hover:text-amber-100 rounded-md hover:bg-amber-900/60 transition"
        title="Dismiss warning"
        aria-label="Dismiss mobile warning"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
