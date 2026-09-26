import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MAP_STYLE_URL } from '@/constants/map';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addLocationPhotoRecord, createLocation } from '@/lib/locations';
import { uploadLocationPhoto } from '@/lib/storage';
import { fetchTags, setLocationTags, type Tag } from '@/lib/tags';
import { useErrorState } from '@/lib/toast';

const MAX_PHOTOS = 5;

export default function AddLocationScreen() {
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();
  const theme = useTheme();
  const cameraRef = useRef<CameraRef>(null);

  const [center, setCenter] = useState<[number, number]>([Number(lng), Number(lat)]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [, setError] = useErrorState();
  const [didSubmit, setDidSubmit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTags()
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  async function useCurrentLocation() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location access is needed to use your current position.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const next: [number, number] = [position.coords.longitude, position.coords.latitude];
      cameraRef.current?.flyTo({ center: next, zoom: 18, duration: 500 });
      setCenter(next);
    } catch {
      setError('Could not get your current location.');
    } finally {
      setIsLocating(false);
    }
  }

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });

    if (result.canceled || !result.assets) return;
    setPhotos((prev) => [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, MAX_PHOTOS));
  }

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((photoUri) => photoUri !== uri));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Give the location a name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const locationId = await createLocation({
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        latitude: center[1],
        longitude: center[0],
      });

      for (const uri of photos) {
        const storagePath = await uploadLocationPhoto(locationId, uri);
        await addLocationPhotoRecord(locationId, storagePath);
      }

      if (selectedTagIds.length > 0) {
        await setLocationTags(locationId, selectedTagIds);
      }

      setDidSubmit(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (didSubmit) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centeredContent}>
          <ThemedText type="title" style={styles.title}>
            Location submitted
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            It&apos;s visible to just you and admins for the next 24 hours. After that it opens up
            for community review, and becomes fully approved once an admin signs off, or once the
            community review period passes.
          </ThemedText>
          <View style={styles.doneButtonWrapper}>
            <ThemedButton label="Done" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <ThemedText type="subtitle">Add a location</ThemedText>

          <ThemedText themeColor="textSecondary" type="small">
            Pan and zoom to line the pin up exactly, or use your current location.
          </ThemedText>

          <ThemedView style={styles.mapPreview}>
            <Map
              mapStyle={MAP_STYLE_URL}
              style={styles.map}
              onRegionDidChange={(event) => setCenter(event.nativeEvent.center)}>
              <Camera ref={cameraRef} initialViewState={{ center, zoom: 17 }} />
            </Map>

            <View pointerEvents="none" style={styles.centerPinWrapper}>
              <View
                style={[styles.pin, { backgroundColor: theme.tint, borderColor: theme.background }]}
              />
            </View>

            <Pressable
              onPress={useCurrentLocation}
              disabled={isLocating}
              style={[styles.locateButton, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold">{isLocating ? '...' : 'Use current location'}</ThemedText>
            </Pressable>
          </ThemedView>

          <View style={styles.content}>
            <ThemedView style={styles.fields}>
              <ThemedTextInput placeholder="Name" value={name} onChangeText={setName} />
              <ThemedTextInput
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                style={styles.multiline}
              />
              <ThemedTextInput placeholder="Address (optional)" value={address} onChangeText={setAddress} />
            </ThemedView>

            {tags.length > 0 && (
              <ThemedView style={styles.tagsSection}>
                <ThemedText type="smallBold">Amenities</ThemedText>
                <TagPicker tags={tags} selectedTagIds={selectedTagIds} onToggle={toggleTag} />
              </ThemedView>
            )}

            <ThemedView style={styles.photosSection}>
              <ThemedText type="smallBold">
                Photos ({photos.length}/{MAX_PHOTOS})
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}>
                {photos.map((uri) => (
                  <Pressable key={uri} onPress={() => removePhoto(uri)}>
                    <Image source={{ uri }} style={styles.photo} />
                    <ThemedView type="backgroundElement" style={styles.removeBadge}>
                      <ThemedText type="small">Remove</ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <Pressable
                    onPress={pickPhotos}
                    style={[styles.photo, styles.addPhotoButton, { borderColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold">+ Add</ThemedText>
                  </Pressable>
                )}
              </ScrollView>
            </ThemedView>


            <ThemedButton label="Submit" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting} />
            <ThemedButton
              label="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              disabled={isSubmitting}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  doneButtonWrapper: {
    width: '100%',
  },
  mapPreview: {
    height: 280,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  centerPinWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
  },
  locateButton: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  fields: {
    gap: Spacing.two,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsSection: {
    gap: Spacing.two,
  },
  photosSection: {
    gap: Spacing.two,
  },
  photoRow: {
    gap: Spacing.two,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: Spacing.two,
  },
  addPhotoButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: Spacing.half,
    borderBottomLeftRadius: Spacing.two,
    borderBottomRightRadius: Spacing.two,
  },
});
