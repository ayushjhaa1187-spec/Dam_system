import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Leaflet for JSDOM
global.L = {
  map: () => ({
    setView: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
  }),
  tileLayer: () => ({
    addTo: vi.fn().mockReturnThis(),
  }),
  polyline: () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  }),
  polygon: () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  }),
  circle: () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  }),
  marker: () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  }),
  divIcon: () => ({}),
};
