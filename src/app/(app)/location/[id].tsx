import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Loading } from '@/components/loading';
import { PhotoGallery } from '@/components/photo-gallery';
import { ReviewForm } from '@/components/review-form';
import { StudySpecs } from '@/components/study-specs';
import { TagPicker } from '@/components/tag-picker';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Tile } from '@/components/tile';
import { MaxContentWidth, Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRating } from '@/lib/rating';
import { useSession } from '@/lib/auth-context';
import { LOCATION_STATUS_COLOR, LOCATION_STATUS_CONTAINER, LOCATION_STATUS_LABEL } from '@/lib/location-status';
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
import { useErrorState } from '@/lib/toast';
import { useConfirm } from '@/lib/confirm';

const MAX_PHOTOS = 5;

export default function LocationDetailScreen() {
  const confirm = useConfirm();
  // review=1 (from the Explore spot sheet) opens straight into a new review.
  const { id, review: startWithReview } = useLocalSearchParams<{ id: string; review?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  // Set when the review form should scroll into view once it appears
  // (arriving via the review shortcut, or tapping Write a review).
  const shouldScrollToForm = useRef(startWithReview === '1');
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyMediumBold.lineHeight * fontScale;
  const { session, profile } = useSession();

  const [location, setLocation] = useState<NearbyLocation | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewWithRatings[]>([]);
  const [categories, setCategories] = useState<RatingCategory[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [locationTagIds, setLocationTagIds] = useState<string[]>([]);
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useErrorState();

  const [editingReview, setEditingReview] = useState<ReviewWithRatings | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(startWithReview === '1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setFormError] = useErrorState();

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [, setLocationEditError] = useErrorState();
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  const [, setPhotoError] = useErrorState();
  const [, setDeleteError] = useErrorState();

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
  }, [id, setLoadError]);

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
    shouldScrollToForm.current = true;
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
    confirm({
      title: 'Delete location?',
      message: `"${location.name}" and all of its reviews and photos will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setDeleteError(null);
        try {
          await deleteLocation(id);
          router.back();
        } catch (err) {
          setDeleteError(err instanceof Error ? err.message : 'Could not delete this location.');
        }
      },
    });
  }

  function confirmDelete(review: ReviewWithRatings) {
    confirm({
      title: 'Delete review?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteReview(review.id);
          await load();
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : 'Could not delete this review.');
        }
      },
    });
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <Loading />
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
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {loadError ? "Couldn't load this location." : 'This location could not be found.'}
            </ThemedText>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const tags = allTags.filter((tag) => locationTagIds.includes(tag.id));
  const hasRating = location.review_count > 0 && location.average_rating !== null;
  const canManage = canEditLocation || canAddPhotos || isAdmin;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.header}>
            <BackButton />
          </View>

          <PhotoGallery urls={photoUrls} placeName={location.name} />

          {!isEditingLocation && (
            <View style={styles.intro}>
              <View style={styles.titleRow}>
                <View style={styles.titleGroup}>
                  <ThemedText type="title">{location.name}</ThemedText>
                  <View style={[styles.statusPill, { backgroundColor: theme[LOCATION_STATUS_CONTAINER[location.status]] }]}>
                    <ThemedText type="label" themeColor={LOCATION_STATUS_COLOR[location.status]}>
                      {LOCATION_STATUS_LABEL[location.status]}
                    </ThemedText>
                  </View>
                </View>
                <View
                  accessible
                  accessibilityLabel={
                    hasRating
                      ? `Average rating ${formatRating(location.average_rating)} out of 5 from ${location.review_count} review${location.review_count === 1 ? '' : 's'}`
                      : 'No reviews yet'
                  }
                  style={styles.ratingSummary}>
                  <Tile color={theme.primary} size={lineHeight * 3.6}>
                    <ThemedText type="title" style={{ color: theme.onPrimary }}>
                      {hasRating ? formatRating(location.average_rating) : 'New'}
                    </ThemedText>
                  </Tile>
                  <ThemedText type="label" themeColor="textSecondary">
                    {hasRating
                      ? `${location.review_count} review${location.review_count === 1 ? '' : 's'}`
                      : 'No reviews yet'}
                  </ThemedText>
                </View>
              </View>

              {location.status === 'rejected' && location.admin_rejection_reason && (
                <View style={[styles.callout, { backgroundColor: theme.statusBusyContainer }]}>
                  <ThemedText type="smallBold" themeColor="statusBusy">
                    Not approved
                  </ThemedText>
                  <ThemedText type="small" themeColor="statusBusy">
                    {location.admin_rejection_reason}
                  </ThemedText>
                </View>
              )}

              {location.address && (
                <ThemedText type="small" themeColor="textSecondary">
                  {location.address}
                </ThemedText>
              )}
              {location.description && <ThemedText>{location.description}</ThemedText>}

              {tags.length > 0 && (
                <View style={styles.tagRow}>
                  {tags.map((tag) => (
                    <View key={tag.id} style={[styles.tag, { backgroundColor: theme.primaryContainer }]}>
                      <ThemedText type="label" style={{ color: theme.onPrimaryContainer }}>
                        {tag.label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {isEditingLocation && (
            <View style={styles.section}>
              <ThemedText type="subtitle">Edit location</ThemedText>
              <ThemedText type="heading">Name</ThemedText>
              <ThemedTextInput value={editName} onChangeText={setEditName} placeholder="Name" />
              <ThemedText type="heading">Description</ThemedText>
              <ThemedTextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description (optional)"
                multiline
                style={styles.multiline}
              />
              <ThemedText type="heading">Address</ThemedText>
              <ThemedTextInput value={editAddress} onChangeText={setEditAddress} placeholder="Address (optional)" />
              <ThemedText type="heading">Amenities</ThemedText>
              <TagPicker tags={allTags} selectedTagIds={editTagIds} onToggle={toggleEditTag} />
              <View style={styles.buttonRow}>
                <ThemedButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setIsEditingLocation(false)}
                  disabled={isSavingLocation}
                  style={styles.flexButton}
                />
                <ThemedButton
                  label="Save changes"
                  onPress={handleSaveLocation}
                  loading={isSavingLocation}
                  disabled={isSavingLocation}
                  style={styles.flexButton}
                />
              </View>
            </View>
          )}

          {categories.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle">Study specs</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Average scores from this spot&apos;s reviews.
              </ThemedText>
              <StudySpecs categories={categories} reviews={reviews} />
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Reviews</ThemedText>
            </View>

            {isFormOpen && (
              <View
                onLayout={(event) => {
                  // Bring a newly opened form into view once.
                  if (shouldScrollToForm.current) {
                    shouldScrollToForm.current = false;
                    scrollRef.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: true });
                  }
                }}>
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
                  onSubmit={handleSubmitReview}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingReview(null);
                  }}
                />
              </View>
            )}

            {reviews.length === 0 && !isFormOpen && (
              <ThemedText type="small" themeColor="textSecondary">
                No reviews yet. Be the first to share what it&apos;s like to study here.
              </ThemedText>
            )}

            {reviews.map((review, index) => {
              // Only the author may edit; admins may also delete (enforced by RLS).
              const isMine = !!myUserId && review.user_id === myUserId;
              const canDelete = isMine || isAdmin;
              const author = review.user_id === null ? 'Deleted user' : (review.reviewer_display_name ?? 'A student');
              return (
                <View
                  key={review.id}
                  style={[styles.review, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      <ThemedText type="heading">{isMine ? 'You' : author}</ThemedText>
                      <ThemedText type="label" themeColor="textSecondary">
                        {new Date(review.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <ThemedText type="heading" accessibilityLabel={`Rated ${formatRating(review.overall_rating)} out of 5`}>
                      {formatRating(review.overall_rating)}
                    </ThemedText>
                  </View>
                  {review.body && <ThemedText>{review.body}</ThemedText>}
                  {canDelete && (
                    <View style={styles.textButtonRow}>
                      {isMine && <ThemedButton label="Edit" variant="text" onPress={() => openEditReviewForm(review)} />}
                      <ThemedButton label="Delete" variant="textDanger" onPress={() => confirmDelete(review)} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {canManage && !isEditingLocation && (
            <View style={styles.section}>
              <ThemedText type="subtitle">Manage this location</ThemedText>
              <View style={styles.manageRow}>
                {canEditLocation && <ThemedButton label="Edit location" variant="text" onPress={openEditLocation} />}
                {canAddPhotos && photoUrls.length < MAX_PHOTOS && (
                  <ThemedButton
                    label={isAddingPhotos ? 'Adding photos' : `Add photos (${photoUrls.length} of ${MAX_PHOTOS})`}
                    variant="text"
                    onPress={handleAddPhotos}
                    loading={isAddingPhotos}
                    disabled={isAddingPhotos}
                  />
                )}
                {isAdmin && <ThemedButton label="Delete location" variant="textDanger" onPress={confirmDeleteLocation} />}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Pinned action bar: the main action as a full-width pill. */}
        {!isFormOpen && !isEditingLocation && (
          <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
            <Pressable
              accessibilityRole="button"
              onPress={openNewReviewForm}
              android_ripple={{ color: withAlpha(theme.onPrimary, 0.16) }}
              style={[styles.fab, { backgroundColor: theme.primary, minHeight: lineHeight * 2.6 }]}>
              <SymbolView
                name={{ android: 'rate_review', web: 'rate_review' }}
                size={lineHeight * 1.2}
                tintColor={theme.onPrimary}
              />
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                Write a review
              </ThemedText>
            </Pressable>
          </View>
        )}
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
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  intro: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  titleGroup: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  statusPill: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  ratingSummary: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  callout: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  review: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  textButtonRow: {
    flexDirection: 'row',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  reviewAuthor: {
    flex: 1,
    gap: Spacing.half,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flexButton: {
    flex: 1,
  },
  manageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
