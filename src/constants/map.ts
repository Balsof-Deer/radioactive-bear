// OpenFreeMap: free, no API key, no account, commercial use permitted.
// https://openfreemap.org
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Minimal style the app recolours into the warm palette (lib/map-style.ts).
export const WARM_MAP_BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const RADIUS_OPTIONS_KM = [1, 5, 10, 25] as const;

export const DEFAULT_RADIUS_KM = 5;

// Street-level zoom: the map opens here, and "show my location" zooms back
// in to it if the map is zoomed out further.
export const STREET_ZOOM = 14;
