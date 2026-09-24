import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';

// Supabase's documented pattern for Expo: the session is too large for
// SecureStore on its own, so it's AES-encrypted and saved in AsyncStorage,
// while the encryption key lives in SecureStore (Keychain / Keystore).
// A fresh key is generated on every write.

// Encrypted values use their own AsyncStorage key so a session saved
// before encryption was added (plain text under `key`) can be told apart
// and moved over.
const encryptedKey = (key: string) => `${key}.encrypted`;

function encrypt(value: string, keyBytes: Uint8Array): string {
  const cipher = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
  return aesjs.utils.hex.fromBytes(cipher.encrypt(aesjs.utils.utf8.toBytes(value)));
}

function decrypt(hex: string, keyBytes: Uint8Array): string {
  const cipher = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(hex)));
}

async function writeEncrypted(key: string, value: string): Promise<void> {
  const keyBytes = crypto.getRandomValues(new Uint8Array(256 / 8));
  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(keyBytes));
  await AsyncStorage.setItem(encryptedKey(key), encrypt(value, keyBytes));
}

async function readEncrypted(key: string): Promise<string | null> {
  const stored = await AsyncStorage.getItem(encryptedKey(key));
  if (stored !== null) {
    const keyHex = await SecureStore.getItemAsync(key);
    if (keyHex) {
      return decrypt(stored, aesjs.utils.hex.toBytes(keyHex));
    }
    // The key is gone (e.g. app data restored to a new phone without its
    // Keystore), so the value can't be read. Clear it; the user signs in again.
    await AsyncStorage.removeItem(encryptedKey(key));
    return null;
  }

  // One-time move of a session saved before encryption was added.
  const legacy = await AsyncStorage.getItem(key);
  if (legacy !== null) {
    await writeEncrypted(key, legacy);
    await AsyncStorage.removeItem(key);
  }
  return legacy;
}

async function removeEncrypted(key: string): Promise<void> {
  await AsyncStorage.multiRemove([encryptedKey(key), key]);
  await SecureStore.deleteItemAsync(key);
}

// Runs every operation one after another, so two overlapping writes can
// never leave a key in SecureStore that doesn't match the saved value.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation);
  queue = result.catch(() => undefined);
  return result;
}

export const encryptedStorage = {
  getItem: (key: string) => serialize(() => readEncrypted(key)),
  setItem: (key: string, value: string) => serialize(() => writeEncrypted(key, value)),
  removeItem: (key: string) => serialize(() => removeEncrypted(key)),
};
