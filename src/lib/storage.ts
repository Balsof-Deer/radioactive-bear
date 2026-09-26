import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

import { prepareImageForUpload } from '@/lib/image-privacy';
import { supabase } from '@/lib/supabase';

const LOCATION_PHOTOS_BUCKET = 'location-photos';

export async function uploadLocationPhoto(locationId: string, localUri: string): Promise<string> {
  // Removes location/EXIF metadata and uses the real image type.
  const image = prepareImageForUpload(await new File(localUri).bytes());
  const path = `${locationId}/${Crypto.randomUUID()}.${image.extension}`;

  const { error } = await supabase.storage
    .from(LOCATION_PHOTOS_BUCKET)
    .upload(path, image.bytes, { contentType: image.contentType });

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
