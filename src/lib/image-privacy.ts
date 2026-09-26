// Photos from the picker keep their EXIF metadata, including GPS (the
// Android picker copies it into the file it returns), which would reveal
// where a photo was taken, e.g. someone's home for a profile photo. This
// removes metadata before upload and works out the real image type from
// the file's contents rather than its name.

export type PreparedImage = {
  bytes: Uint8Array;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
};

// JPEG segments that can carry metadata: APP1 (EXIF incl. GPS, and XMP)
// and APP13 (IPTC / Photoshop, which can hold location too).
const JPEG_METADATA_MARKERS = new Set([0xe1, 0xed]);

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return bytes.length > 8 && signature.every((value, index) => bytes[index] === value);
}

function isWebp(bytes: Uint8Array): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  return bytes.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
}

// Copies every JPEG segment except the metadata ones; the compressed image
// data after the start-of-scan marker is copied untouched.
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, 2)]; // SOI
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new Error('Unexpected data in JPEG');
    }
    // Skip fill bytes between segments.
    let markerOffset = offset;
    while (bytes[markerOffset + 1] === 0xff) markerOffset++;
    const marker = bytes[markerOffset + 1];

    if (marker === 0xda) {
      // Start of scan: the rest is image data up to the end marker.
      kept.push(bytes.subarray(markerOffset));
      offset = bytes.length;
      break;
    }
    if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      // Markers without a length field.
      kept.push(bytes.subarray(markerOffset, markerOffset + 2));
      offset = markerOffset + 2;
      continue;
    }

    const length = (bytes[markerOffset + 2] << 8) | bytes[markerOffset + 3];
    const end = markerOffset + 2 + length;
    if (length < 2 || end > bytes.length) {
      throw new Error('Truncated JPEG segment');
    }
    if (!JPEG_METADATA_MARKERS.has(marker)) {
      kept.push(bytes.subarray(markerOffset, end));
    }
    offset = end;
  }

  const total = kept.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let position = 0;
  for (const part of kept) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}

// Drops PNG metadata chunks that can hold location or other personal
// details: eXIf (EXIF) and the text chunks tEXt / zTXt / iTXt.
export function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  const dropped = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt']);
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length; // length + type + data + CRC
    if (end > bytes.length) {
      throw new Error('Truncated PNG chunk');
    }
    if (!dropped.has(type)) {
      kept.push(bytes.subarray(offset, end));
    }
    offset = end;
  }

  const total = kept.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let position = 0;
  for (const part of kept) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}

// Returns the photo without metadata, with its real type. Only JPEG, PNG
// and WebP are accepted (the same types the storage buckets allow).
export function prepareImageForUpload(bytes: Uint8Array): PreparedImage {
  try {
    if (isJpeg(bytes)) {
      return { bytes: stripJpegMetadata(bytes), contentType: 'image/jpeg', extension: 'jpg' };
    }
    if (isPng(bytes)) {
      return { bytes: stripPngMetadata(bytes), contentType: 'image/png', extension: 'png' };
    }
  } catch {
    throw new Error('This photo could not be prepared for upload. Try a different photo.');
  }
  if (isWebp(bytes)) {
    // WebP from the picker is rare; its metadata isn't stripped here.
    return { bytes, contentType: 'image/webp', extension: 'webp' };
  }
  throw new Error('Only JPEG, PNG or WebP photos can be uploaded.');
}
