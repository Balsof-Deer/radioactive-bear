import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { LabeledField } from '@/components/labeled-field';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Elevation, MaxContentWidth, Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addLocationPhotoRecord, createLocation } from '@/lib/locations';
import { uploadLocationPhoto } from '@/lib/storage';
import { useWarmMapStyle } from '@/lib/map-style';
import { fetchTags, setLocationTags, type Tag } from '@/lib/tags';
import { useErrorState } from '@/lib/toast';

const MAX_PHOTOS = 5;

export default function AddLocationScreen() {
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  // The same themed map as Explore, so it matches light and dark mode.
  const mapStyle = useWarmMapStyle(theme, isDark);
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;
  const pinSize = lineHeight * 2.2;
  const photoSize = lineHeight * 4.6;
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

      // The confirmation replaces this form, so Back doesn't return to it.
      router.replace({ pathname: '/location-submitted', params: { id: locationId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.header}>
            <IconButton icon="close" label="Cancel" onPress={() => router.back()} />
            <ThemedText type="label" themeColor="tertiary" style={styles.eyebrow}>
              NEW SPOT
            </ThemedText>
          </View>

          <View style={styles.intro}>
            <ThemedText type="title" accessibilityRole="header">
              Add a location
            </ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Pan and zoom to line the pin up exactly, or use your current location.
            </ThemedText>
          </View>

          <View style={[styles.mapPreview, { borderColor: theme.outlineVariant }]}>
            <Map
              mapStyle={mapStyle}
              style={styles.map}
              onRegionDidChange={(event) => setCenter(event.nativeEvent.center)}>
              <Camera ref={cameraRef} initialViewState={{ center, zoom: 17 }} />
            </Map>

            {/* The pin's tip marks the centre of the map. */}
            <View pointerEvents="none" style={styles.centerPinWrapper}>
              <View style={{ marginBottom: pinSize }}>
                <SymbolView
                  name={{ android: 'location_on', web: 'location_on' }}
                  size={pinSize}
                  tintColor={theme.primary}
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={useCurrentLocation}
              disabled={isLocating}
              android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
              style={[
                styles.locateButton,
                {
                  backgroundColor: theme.surface,
                  minHeight: lineHeight * 2.2,
                  paddingHorizontal: lineHeight * 0.8,
                },
              ]}>
              <SymbolView
                name={{ android: 'my_location', web: 'my_location' }}
                size={lineHeight}
                tintColor={theme.onSurface}
              />
              <ThemedText type="smallBold">{isLocating ? 'Finding you…' : 'Use current location'}</ThemedText>
            </Pressable>
          </View>

          <View style={styles.fields}>
            <LabeledField label="Name">
              <ThemedTextInput
                placeholder="What's it called?"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                accessibilityLabel="Name"
              />
            </LabeledField>
            <LabeledField label="Description (optional)">
              <ThemedTextInput
                placeholder="Where to sit, when it's busy, anything worth knowing"
                value={description}
                onChangeText={setDescription}
                multiline
                accessibilityLabel="Description"
                style={[styles.multiline, { minHeight: lineHeight * 5 }]}
              />
            </LabeledField>
            <LabeledField label="Address (optional)">
              <ThemedTextInput
                placeholder="Street and number"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
                accessibilityLabel="Address"
              />
            </LabeledField>
          </View>

          {tags.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="heading">Amenities</ThemedText>
              <TagPicker tags={tags} selectedTagIds={selectedTagIds} onToggle={toggleTag} />
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <ThemedText type="heading">Photos</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {photos.length} of {MAX_PHOTOS}
              </ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {photos.map((uri, index) => (
                <View key={uri}>
                  <Image
                    source={{ uri }}
                    style={[styles.photo, { width: photoSize, height: photoSize }]}
                    accessibilityLabel={`Photo ${index + 1}`}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    onPress={() => removePhoto(uri)}
                    hitSlop={8}
                    style={[
                      styles.removeButton,
                      {
                        width: lineHeight * 1.5,
                        height: lineHeight * 1.5,
                        backgroundColor: theme.inverseSurface,
                        borderColor: theme.surface,
                      },
                    ]}>
                    <SymbolView
                      name={{ android: 'close', web: 'close' }}
                      size={lineHeight * 0.8}
                      tintColor={theme.inverseOnSurface}
                    />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add photos"
                  onPress={pickPhotos}
                  android_ripple={{ color: withAlpha(theme.onSurface, 0.1) }}
                  style={[
                    styles.photo,
                    styles.addPhotoButton,
                    { width: photoSize, height: photoSize, backgroundColor: theme.surfaceContainerHigh },
                  ]}>
                  <SymbolView
                    name={{ android: 'add_photo_alternate', web: 'add_photo_alternate' }}
                    size={lineHeight * 1.4}
                    tintColor={theme.onSurfaceVariant}
                  />
                  <ThemedText type="label" themeColor="textSecondary">
                    Add
                  </ThemedText>
                </Pressable>
              )}
            </ScrollView>
          </View>

          <View style={[styles.note, { backgroundColor: theme.surfaceContainerHigh }]}>
            <SymbolView
              name={{ android: 'visibility_off', web: 'visibility_off' }}
              size={lineHeight}
              tintColor={theme.onSurfaceVariant}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteText}>
              Only you and admins can see it for the first 24 hours. Then other students can see and review it.
            </ThemedText>
          </View>

          <ThemedButton label="Submit" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    // Lines the icon's glyph up with the content edge below.
    marginLeft: -Spacing.two,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  intro: {
    gap: Spacing.one,
    marginTop: -Spacing.two,
  },
  // A wide map preview whose height follows its width.
  mapPreview: {
    aspectRatio: 1.4,
    borderRadius: Radius.xl,
    borderWidth: 1,
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
  locateButton: {
    position: 'absolute',
    left: Spacing.two + Spacing.one,
    bottom: Spacing.two + Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.full,
    overflow: 'hidden',
    boxShadow: Elevation.level2,
  },
  fields: {
    gap: Spacing.three,
  },
  multiline: {
    textAlignVertical: 'top',
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  photoRow: {
    gap: Spacing.two,
    // Room for the remove buttons, which overhang each photo's corner.
    paddingTop: Spacing.two,
    paddingRight: Spacing.two,
  },
  photo: {
    borderRadius: Radius.md,
  },
  addPhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: -Spacing.two,
    right: -Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two + Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  noteText: {
    flex: 1,
  },
});
