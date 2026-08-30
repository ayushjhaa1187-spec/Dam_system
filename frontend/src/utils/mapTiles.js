import L from 'leaflet';

/**
 * Creates a robust dark/satellite basemap tile layer with graceful fallback.
 */
export function createBasemapLayer(mapInstance, mode = 'satellite') {
  // Mode can be 'satellite' or 'dark'
  if (mode === 'satellite') {
    const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const satLayer = L.tileLayer(satelliteUrl, {
      maxZoom: 18,
      attribution: '&copy; Esri &bull; Earthstar Geographics &bull; Google Earth Engine',
    });

    satLayer.on('tileerror', () => {
      console.warn('Satellite tile error, switching to Dark Matter fallback.');
      if (mapInstance && !mapInstance._fallbackLayerActive) {
        mapInstance._fallbackLayerActive = true;
        mapInstance.removeLayer(satLayer);
        const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; CARTO &copy; OpenStreetMap',
        });
        darkLayer.addTo(mapInstance);
      }
    });

    return satLayer;
  }

  // Dark matter mode
  const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  return L.tileLayer(darkUrl, {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
}

