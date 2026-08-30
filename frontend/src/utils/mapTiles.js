import L from 'leaflet';

/**
 * Creates a bright/satellite basemap tile layer with graceful fallback.
 */
export function createBasemapLayer(mapInstance, mode = 'satellite') {
  if (mode === 'satellite') {
    const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const satLayer = L.tileLayer(satelliteUrl, {
      maxZoom: 18,
      attribution: '&copy; Esri &bull; Earthstar Geographics &bull; Google Earth Engine',
    });

    satLayer.on('tileerror', () => {
      console.warn('Satellite tile error, switching to Positron bright fallback.');
      if (mapInstance && !mapInstance._fallbackLayerActive) {
        mapInstance._fallbackLayerActive = true;
        mapInstance.removeLayer(satLayer);
        const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; CARTO &copy; OpenStreetMap',
        });
        lightLayer.addTo(mapInstance);
      }
    });

    return satLayer;
  }

  // Bright / Positron mode
  const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  return L.tileLayer(lightUrl, {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
}
