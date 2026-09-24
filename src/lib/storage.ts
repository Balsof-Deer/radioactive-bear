import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

const LOCATION_PHOTOS_BUCKET = 'location-photos';

function extensionFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

export async function uploadLocationPhoto(locationId: string, localUri: string): Promise<string> {
  const file = new File(localUri);
  const bytes = await file.bytes();
  const path = `${locationId}/${Crypto.randomUUID()}.${extensionFromUri(localUri)}`;

  const { error } = await supabase.storage
    .from(LOCATION_PHOTOS_BUCKET)
    .upload(path, bytes, { contentType: `image/${extensionFromUri(localUri)}` });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function getLocationPhotoUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(LOCATION_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
