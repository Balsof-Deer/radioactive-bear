import type { StyleSpecification } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useState } from 'react';

import { MAP_STYLE_URL, WARM_MAP_BASE_STYLE_URL } from '@/constants/map';
import type { ThemePalette } from '@/constants/theme';

// The "warm parchment" map: OpenFreeMap's minimal Positron style, fetched
// once and recoloured to the app palette (layers matched by their ids in
// Positron). Falls back to the regular map style if the fetch fails.

type WarmMapColors = {
  land: string;
  park: string;
  water: string;
  building: string;
  roadMinor: string;
  roadMajor: string;
  roadCasing: string;
  rail: string;
  boundary: string;
  label: string;
  labelMuted: string;
  labelHalo: string;
};

function warmColors(palette: ThemePalette, isDark: boolean): WarmMapColors {
  return isDark
    ? {
        land: palette.surface,
        park: '#1d2b21',
        water: '#1b2a2c',
        building: '#1f2420',
        roadMinor: '#2a302b',
        roadMajor: '#343b35',
        roadCasing: '#2a302b',
        rail: '#343b35',
        boundary: '#4a514b',
        label: palette.onSurface,
        labelMuted: palette.onSurfaceVariant,
        labelHalo: palette.surface,
      }
    : {
        land: palette.surface, // oat
        park: '#e3ecdf', // collegiate green quads
        water: '#d5e1e0',
        building: '#f3e9df',
        roadMinor: '#fbf3ec',
        roadMajor: '#ffffff',
        roadCasing: palette.outlineVariant,
        rail: palette.outlineVariant,
        boundary: '#c9bcae',
        label: palette.onSurface, // espresso
        labelMuted: palette.onSurfaceVariant, // walnut
        labelHalo: palette.surface,
      };
}

type Layer = StyleSpecification['layers'][number] & { paint?: Record<string, unknown> };

// Picks a colour for a Positron layer by its id; applied to the paint
// property matching the layer's type, so a fill never gets a line colour.
function colourFor(id: string, colors: WarmMapColors): string | null {
  if (id === 'background') return colors.land;
  if (id === 'park' || id === 'landcover_wood') return colors.park;
  if (id === 'water' || id === 'waterway') return colors.water;
  if (id === 'building') return colors.building;
  if (id === 'landuse_residential' || id === 'road_area_pier' || id.startsWith('landcover_')) return colors.land;
  if (id.includes('casing')) return colors.roadCasing;
  // The dash layers draw gaps over the rail line, so they take the land colour.
  if (id.includes('dashline')) return colors.land;
  if (id.startsWith('railway')) return colors.rail;
  if (id.startsWith('boundary')) return colors.boundary;
  if (id.startsWith('highway_major') || id.startsWith('highway_motorway') || id.startsWith('tunnel_motorway')) {
    return colors.roadMajor;
  }
  if (id.startsWith('highway') || id.startsWith('aeroway') || id === 'road_pier') return colors.roadMinor;
  return null;
}

function recolour(base: StyleSpecification, colors: WarmMapColors): StyleSpecification {
  const layers = base.layers.map((layer) => {
    const typed = layer as Layer;
    if (typed.type === 'symbol') {
      const isMinorLabel = typed.id.startsWith('highway') || typed.id.startsWith('waterway');
      return {
        ...typed,
        paint: {
          ...typed.paint,
          'text-color': isMinorLabel ? colors.labelMuted : colors.label,
          'text-halo-color': colors.labelHalo,
        },
      };
    }
    const colour = colourFor(typed.id, colors);
    if (!colour) return typed;
    if (typed.type === 'background') return { ...typed, paint: { ...typed.paint, 'background-color': colour } };
    if (typed.type === 'line') return { ...typed, paint: { ...typed.paint, 'line-color': colour } };
    if (typed.type === 'fill') {
      const outline = typed.id === 'building' ? { 'fill-outline-color': colors.roadCasing } : {};
      return { ...typed, paint: { ...typed.paint, 'fill-color': colour, ...outline } };
    }
    return typed;
  });
  return { ...base, layers } as StyleSpecification;
}

let basePromise: Promise<StyleSpecification> | null = null;

function fetchBaseStyle(): Promise<StyleSpecification> {
  if (!basePromise) {
    basePromise = fetch(WARM_MAP_BASE_STYLE_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Map style request failed (${response.status})`);
        return response.json() as Promise<StyleSpecification>;
      })
      .catch((err) => {
        // Allow a retry next time Explore opens.
        basePromise = null;
        throw err;
      });
  }
  return basePromise;
}

// The recoloured style, the plain style URL while loading or on failure.
export function useWarmMapStyle(palette: ThemePalette, isDark: boolean): string | StyleSpecification {
  const [base, setBase] = useState<StyleSpecification | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBaseStyle()
      .then((style) => {
        if (!cancelled) setBase(style);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => (base ? recolour(base, warmColors(palette, isDark)) : MAP_STYLE_URL),
    [base, palette, isDark]
  );
}
