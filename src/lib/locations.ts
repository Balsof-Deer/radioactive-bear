import { supabase } from '@/lib/supabase';

export type LocationStatus =
  | 'pending_private'
  | 'pending_public'
  | 'approved_community'
  | 'approved_admin'
  | 'rejected';

export type NearbyLocation = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  submitted_by: string;
  average_rating: number | null;
  review_count: number;
  status: LocationStatus;
};

const NEARBY_LOCATION_COLUMNS =
  'id,name,description,address,latitude,longitude,submitted_by,average_rating,review_count,status';

export async function fetchNearbyLocations(
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): Promise<NearbyLocation[]> {
  const { data, error } = await supabase
    .rpc('locations_within_radius', {
      center_lat: centerLat,
      center_lng: centerLng,
      radius_meters: radiusMeters,
    })
    .select(NEARBY_LOCATION_COLUMNS);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NearbyLocation[];
}
