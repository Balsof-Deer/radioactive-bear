import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ReviewForm } from '@/components/review-form';
import { StarRating } from '@/components/star-rating';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Shape, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_LABEL } from '@/lib/location-status';
import {
  addLocationPhotoRecord,
  fetchLocationById,
  fetchLocationPhotos,
  updateLocation,
  type NearbyLocation,
} from '@/lib/locations';
import {
  createReview,
  deleteReview,
  fetchRatingCategories,
  fetchReviews,
  updateReview,
  type RatingCategory,
  type ReviewFormValues,
  type ReviewWithRatings,
} from '@/lib/reviews';
import { deleteLocation } from '@/lib/admin';
import { getLocationPhotoUrl, uploadLocationPhoto } from '@/lib/storage';
import { fetchLocationTagIds, fetchTags, setLocationTags, type Tag } from '@/lib/tags';

const MAX_PHOTOS = 5;

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useSession();

  const [location, setLocation] = useState<NearbyLocation | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewWithRatings[]>([]);
  const [categories, setCategories] = useState<RatingCategory[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [locationTagIds, setLocationTagIds] = useState<string[]>([]);
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingReview, setEditingReview] = useState<ReviewWithRatings | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationEditError, setLocationEditError] = useState<string | null>(null);
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [loc, photos, cats, rev, tags, locTagIds] = await Promise.all([
        fetchLocationById(id),
        fetchLocationPhotos(id),
        fetchRatingCategories(),
        fetchReviews(id),
        fetchTags(),
        fetchLocationTagIds(id),
      ]);
      setLocation(loc);
      setCategories(cats);
      setReviews(rev);
      setAllTags(tags);
      setLocationTagIds(locTagIds);
      const urls = await Promise.all(photos.map((photo) => getLocationPhotoUrl(photo.storage_path)));
      setPhotoUrls(urls.filter((url): url is string => !!url));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load this location.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // react-hooks/set-state-in-effect flags this as "setState in effect,"
    // but this is the standard fetch-on-mount pattern: `load` guards
    // against races/unmount internally and is also reused as a manual
    // refresh after submitting/deleting a review.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const isAdmin = profile?.role === 'admin';
  const myUserId = session?.user.id;
  const isOwner = !!myUserId && location?.submitted_by === myUserId;
  const canEditLocation =
    !!location && (isAdmin || (isOwner && location.status !== 'approved_admin' && location.status !== 'rejected'));
  const canAddPhotos = !!location && (isAdmin || isOwner);

  function openNewReviewForm() {
    setEditingReview(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditReviewForm(review: ReviewWithRatings) {
    setEditingReview(review);
    setFormError(null);
    setIsFormOpen(true);
  }

  async function handleSubmitReview(values: ReviewFormValues) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingReview) {
        await updateReview(editingReview.id, values);
      } else {
        await createReview(id, values);
      }
      setIsFormOpen(false);
      setEditingReview(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save your review.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditLocation() {
    if (!location) return;
    setEditName(location.name);
    setEditDescription(location.description ?? '');
    setEditAddress(location.address ?? '');
    setEditTagIds(locationTagIds);
    setLocationEditError(null);
    setIsEditingLocation(true);
  }

  function toggleEditTag(tagId: string) {
    setEditTagIds((prev) => (prev.includes(tagId) ? prev.filter((tagId_) => tagId_ !== tagId) : [...prev, tagId]));
  }

  async function handleSaveLocation() {
    if (!editName.trim()) {
      setLocationEditError('Give the location a name.');
      return;
    }
    setIsSavingLocation(true);
    setLocationEditError(null);
    try {
      await updateLocation(id, {
        name: editName.trim(),
        description: editDescription.trim(),
        address: editAddress.trim(),
      });
      await setLocationTags(id, editTagIds);
      setIsEditingLocation(false);
      await load();
    } catch (err) {
      setLocationEditError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setIsSavingLocation(false);
    }
  }

  async function handleAddPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const remaining = MAX_PHOTOS - photoUrls.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled || !result.assets) return;

    setIsAddingPhotos(true);
    setPhotoError(null);
    try {
      for (const asset of result.assets) {
        const storagePath = await uploadLocationPhoto(id, asset.uri);
        await addLocationPhotoRecord(id, storagePath);
      }
      await load();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not add photos.');
    } finally {
      setIsAddingPhotos(false);
    }
  }

  function confirmDeleteLocation() {
    if (!location) return;
    Alert.alert(
      'Delete location?',
      `"${location.name}" and all of its reviews and photos will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteError(null);
            try {
              await deleteLocation(id);
              router.back();
            } catch (err) {
              setDeleteError(err instanceof Error ? err.message : 'Could not delete this location.');
            }
          },
        },
      ]
    );
  }

  function confirmDelete(review: ReviewWithRatings) {
    Alert.alert('Delete review?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(review.id);
            await load();
          } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Could not delete this review.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (loadError || !location) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorHeader}>
            <BackButton />
          </View>
          <ThemedView style={styles.centered}>
            <ThemedText themeColor="danger" style={styles.centerText}>
              {loadError ?? 'Location not found.'}
            </ThemedText>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.content}>
          <ThemedView style={styles.backButtonWrapper}>
            <BackButton />
          </ThemedView>

          {!isEditingLocation && (
            <>
              <ThemedText type="title" style={styles.name}>
                {location.name}
              </ThemedText>
              <ThemedText themeColor={LOCATION_STATUS_COLOR[location.status]} type="small">
                {LOCATION_STATUS_LABEL[location.status]}
              </ThemedText>
              {location.status === 'rejected' && location.admin_rejection_reason && (
                <ThemedText themeColor="danger" type="small">
                  Reason: {location.admin_rejection_reason}
                </ThemedText>
              )}
              {location.address && <ThemedText themeColor="textSecondary">{location.address}</ThemedText>}
              {location.description && <ThemedText>{location.description}</ThemedText>}
              {locationTagIds.length > 0 && (
                <ThemedView style={styles.tagBadgeRow}>
                  {allTags
                    .filter((tag) => locationTagIds.includes(tag.id))
                    .map((tag) => (
                      <ThemedView key={tag.id} type="backgroundElement" style={styles.tagBadge}>
                        <ThemedText type="small">{tag.label}</ThemedText>
                      </ThemedView>
                    ))}
                </ThemedView>
              )}
              {canEditLocation && (
                <ThemedButton
                  label="Edit location"
                  variant="secondary"
                  onPress={openEditLocation}
                  style={styles.editLocationButton}
                />
              )}
              {isAdmin && (
                <ThemedButton
                  label="Delete location"
                  variant="secondary"
                  onPress={confirmDeleteLocation}
                  style={styles.editLocationButton}
                />
              )}
              {deleteError && (
                <ThemedText themeColor="danger" type="small">
                  {deleteError}
                </ThemedText>
              )}
            </>
          )}

          {isEditingLocation && (
            <ThemedView type="backgroundElement" style={styles.editLocationForm}>
              <ThemedText type="smallBold">Name</ThemedText>
              <ThemedTextInput value={editName} onChangeText={setEditName} placeholder="Name" />
              <ThemedText type="smallBold">Description</ThemedText>
              <ThemedTextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description (optional)"
                multiline
                style={styles.editLocationMultiline}
              />
              <ThemedText type="smallBold">Address</ThemedText>
              <ThemedTextInput
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Address (optional)"
              />
              <ThemedText type="smallBold">Amenities</ThemedText>
              <TagPicker tags={allTags} selectedTagIds={editTagIds} onToggle={toggleEditTag} />
              {locationEditError && (
                <ThemedText themeColor="danger" type="small">
                  {locationEditError}
                </ThemedText>
              )}
              <ThemedButton
                label="Save changes"
                onPress={handleSaveLocation}
                loading={isSavingLocation}
                disabled={isSavingLocation}
              />
              <ThemedButton
                label="Cancel"
                variant="secondary"
                onPress={() => setIsEditingLocation(false)}
                disabled={isSavingLocation}
              />
            </ThemedView>
          )}

          <ThemedView style={styles.ratingRow}>
            <StarRating value={location.average_rating ?? 0} />
            <ThemedText themeColor="textSecondary" type="small">
              {location.review_count > 0
                ? `${location.average_rating?.toFixed(1)} · ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
                : 'No reviews yet'}
            </ThemedText>
          </ThemedView>

          {photoUrls.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}>
              {photoUrls.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          )}

          {canAddPhotos && photoUrls.length < MAX_PHOTOS && (
            <ThemedButton
              label={isAddingPhotos ? 'Adding photos...' : `Add photos (${photoUrls.length}/${MAX_PHOTOS})`}
              variant="secondary"
              onPress={handleAddPhotos}
              loading={isAddingPhotos}
              disabled={isAddingPhotos}
            />
          )}

          {photoError && (
            <ThemedText themeColor="danger" type="small">
              {photoError}
            </ThemedText>
          )}

          {!isFormOpen && <ThemedButton label="Write a review" onPress={openNewReviewForm} />}

          {isFormOpen && (
            <ReviewForm
              categories={categories}
              initialValues={
                editingReview
                  ? {
                      overallRating: editingReview.overall_rating,
                      body: editingReview.body ?? '',
                      categoryScores: Object.fromEntries(
                        editingReview.category_scores.map((score) => [score.category_id, score.score])
                      ),
                    }
                  : undefined
              }
              isSubmitting={isSubmitting}
              error={formError}
              onSubmit={handleSubmitReview}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingReview(null);
              }}
            />
          )}

          <ThemedView style={styles.reviewsSection}>
            <ThemedText type="smallBold">Reviews</ThemedText>
            {reviews.length === 0 && (
              <ThemedText themeColor="textSecondary" type="small">
                Be the first to review this place.
              </ThemedText>
            )}
            {reviews.map((review) => {
              // Only the author may edit; admins may also delete (enforced by RLS).
              const isMine = !!myUserId && review.user_id === myUserId;
              const canDelete = isMine || isAdmin;
              return (
                <ThemedView key={review.id} type="backgroundElement" style={styles.reviewCard}>
                  <ThemedView type="backgroundElement" style={styles.reviewHeader}>
                    <ThemedText type="smallBold">{review.user_id === null ? 'Deleted user' : (review.reviewer_display_name ?? 'Student')}</ThemedText>
                    <StarRating value={review.overall_rating} />
                  </ThemedView>
                  {review.body && <ThemedText type="small">{review.body}</ThemedText>}
                  <ThemedText themeColor="textSecondary" type="small">
                    {new Date(review.created_at).toLocaleDateString()}
                  </ThemedText>
                  {canDelete && (
                    <ThemedView type="backgroundElement" style={styles.reviewActions}>
                      {isMine && (
                        <ThemedButton label="Edit" variant="secondary" onPress={() => openEditReviewForm(review)} />
                      )}
                      <ThemedButton label="Delete" variant="secondary" onPress={() => confirmDelete(review)} />
                    </ThemedView>
                  )}
                </ThemedView>
              );
            })}
          </ThemedView>
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
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  errorHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  backButtonWrapper: {
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  name: {
    fontSize: 28,
    lineHeight: 34,
  },
  tagBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  tagBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
  editLocationButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  editLocationForm: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
  },
  editLocationMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  photoRow: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: Spacing.two,
  },
  reviewsSection: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  reviewCard: {
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Shape.extraLarge,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
