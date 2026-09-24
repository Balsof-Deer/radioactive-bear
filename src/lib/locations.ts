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

export type NewLocationInput = {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
};

export async function createLocation(input: NewLocationInput): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error('You must be signed in to add a location.');
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: input.name,
      description: input.description || null,
      address: input.address || null,
      latitude: input.latitude,
      longitude: input.longitude,
      submitted_by: userId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export type LocationEditInput = {
  name: string;
  description: string;
  address: string;
};

export async function updateLocation(locationId: string, input: LocationEditInput): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({
      name: input.name,
      description: input.description || null,
      address: input.address || null,
    })
    .eq('id', locationId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function addLocationPhotoRecord(locationId: string, storagePath: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error('You must be signed in to add a photo.');
  }

  const { error } = await supabase.from('location_photos').insert({
    location_id: locationId,
    storage_path: storagePath,
    uploaded_by: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchLocationById(locationId: string): Promise<NearbyLocation> {
  const { data, error } = await supabase
    .from('locations_with_status')
    .select(NEARBY_LOCATION_COLUMNS)
    .eq('id', locationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as NearbyLocation;
}

export type LocationPhoto = {
  id: string;
  storage_path: string;
};

export async function fetchLocationPhotos(locationId: string): Promise<LocationPhoto[]> {
  const { data, error } = await supabase
    .from('location_photos')
    .select('id, storage_path')
    .eq('location_id', locationId)
    .order('created_at');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function searchLocations(query: string): Promise<NearbyLocation[]> {
  const { data, error } = await supabase
    .from('locations_with_status')
    .select(NEARBY_LOCATION_COLUMNS)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NearbyLocation[];
}

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
