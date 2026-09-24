import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DismissKeyboardView } from '@/components/dismiss-keyboard-view';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { createTag, deleteTag, fetchTags, type Tag } from '@/lib/tags';

export default function ManageTagsScreen() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setTags(await fetchTags());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load tags.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleAdd() {
    setFormError(null);
    setIsSaving(true);
    try {
      await createTag(newLabel);
      setNewLabel('');
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add tag.');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(tag: Tag) {
    Alert.alert('Delete tag?', `"${tag.label}" will be removed from every location and every user's preferences.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTag(tag.id);
            await load();
          } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Could not delete tag.');
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <DismissKeyboardView>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedView style={styles.headerRow}>
              <ThemedText type="subtitle">Manage tags</ThemedText>
              <ThemedButton label="Back" variant="secondary" onPress={() => router.back()} />
            </ThemedView>

            <ThemedView style={styles.addRow}>
              <ThemedTextInput
                placeholder="New tag name"
                value={newLabel}
                onChangeText={setNewLabel}
                style={styles.addInput}
              />
              <ThemedButton label="Add" onPress={handleAdd} loading={isSaving} disabled={isSaving} />
            </ThemedView>
            {formError && (
              <ThemedText themeColor="danger" type="small">
                {formError}
              </ThemedText>
            )}

            {isLoading && <ActivityIndicator style={styles.loading} />}
            {loadError && (
              <ThemedText themeColor="danger" type="small">
                {loadError}
              </ThemedText>
            )}

            {!isLoading &&
              tags.map((tag) => (
                <ThemedView key={tag.id} type="backgroundElement" style={styles.tagRow}>
                  <ThemedText>{tag.label}</ThemedText>
                  <ThemedButton label="Delete" variant="secondary" onPress={() => confirmDelete(tag)} />
                </ThemedView>
              ))}
          </ScrollView>
        </DismissKeyboardView>
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addInput: {
    flex: 1,
  },
  loading: {
    alignSelf: 'flex-start',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
