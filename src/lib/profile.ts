import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { extensionFromUri } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const AVATARS_BUCKET = 'avatars';

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName || null })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

// Photos are private: only the owner and admins can read them, through
// short-lived signed URLs (same approach as location photos).
export async function getAvatarUrl(avatarPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(AVATARS_BUCKET).createSignedUrl(avatarPath, 60 * 60);
  if (error) {
    return null;
  }
  return data.signedUrl;
}

// Uploads the new photo under the user's own folder, points the profile
// at it, then removes the previous file.
export async function uploadAvatar(userId: string, localUri: string, previousPath: string | null): Promise<void> {
  const extension = extensionFromUri(localUri);
  const bytes = await new File(localUri).bytes();
  const path = `${userId}/${Crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, bytes, { contentType: `image/${extension}` });
  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: updateError } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId);
  if (updateError) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
    throw new Error(updateError.message);
  }

  if (previousPath) {
    await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
  }
}

export async function removeAvatar(userId: string, currentPath: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', userId);
  if (error) {
    throw new Error(error.message);
  }
  await supabase.storage.from(AVATARS_BUCKET).remove([currentPath]);
}

// Confirms the current password by signing in with it before setting the
// new one, so an unlocked phone alone isn't enough to change it.
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) {
    throw new Error('Your current password is incorrect.');
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}

// Removes the user's photo files through Storage (deleting them in SQL
// would leave the files behind), then deletes the account. Reviews,
// locations and location photos they created stay, anonymised.
export async function deleteMyAccount(userId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage.from(AVATARS_BUCKET).list(userId);
  if (listError) {
    throw new Error(listError.message);
  }
  if (files.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove(files.map((file) => `${userId}/${file.name}`));
    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    throw new Error(error.message);
  }

  // The account no longer exists server-side, so only clear this device.
  await supabase.auth.signOut({ scope: 'local' });
}
