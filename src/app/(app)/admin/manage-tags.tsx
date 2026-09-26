import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PageScreen } from '@/components/page-screen';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createTag, deleteTag, fetchTags, renameTag, type Tag } from '@/lib/tags';
import { useErrorState, useToast } from '@/lib/toast';
import { useConfirm } from '@/lib/confirm';

export default function ManageTagsScreen() {
  const confirm = useConfirm();
  const theme = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLoadError] = useErrorState();
  const [newLabel, setNewLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [, setFormError] = useErrorState();
  // The tag being renamed (one at a time) and its draft name.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const { showSuccess } = useToast();

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
  }, [setLoadError]);

  useEffect(() => {
    // Standard fetch-on-mount; `load` is also the manual refresh after
    // adding, renaming or deleting a tag.
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
    confirm({
      title: 'Delete tag?',
      message: `"${tag.label}" will be removed from every location and every user's preferences.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteTag(tag.id);
          await load();
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : 'Could not delete tag.');
        }
      },
    });
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditLabel(tag.label);
  }

  async function handleRename(tag: Tag) {
    if (editLabel.trim() === tag.label) {
      setEditingId(null);
      return;
    }
    setFormError(null);
    setIsRenaming(true);
    try {
      await renameTag(tag.id, editLabel);
      setEditingId(null);
      showSuccess('Tag renamed.');
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not rename this tag.');
    } finally {
      setIsRenaming(false);
    }
  }

  return (
    <PageScreen title="Manage tags" isLoading={isLoading}>
      <View style={styles.addRow}>
        <View style={styles.addInput}>
          <ThemedTextInput
            placeholder="New tag name"
            value={newLabel}
            onChangeText={setNewLabel}
            accessibilityLabel="New tag name"
          />
        </View>
        <ThemedButton label="Add" onPress={handleAdd} loading={isSaving} disabled={isSaving || !newLabel.trim()} />
      </View>

      {!isLoading && tags.length === 0 && <EmptyState icon="sell" message="No tags yet" />}

      {!isLoading && (
        <View>
          {tags.map((tag, index) => (
            <View
              key={tag.id}
              style={[
                styles.tagRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
              ]}>
              {editingId === tag.id ? (
                <View style={styles.editArea}>
                  <ThemedTextInput
                    value={editLabel}
                    onChangeText={setEditLabel}
                    autoFocus
                    autoCapitalize="sentences"
                    accessibilityLabel={`New name for ${tag.label}`}
                    onSubmitEditing={() => handleRename(tag)}
                    returnKeyType="done"
                  />
                  <View style={styles.editActions}>
                    <ThemedButton label="Cancel" variant="text" onPress={() => setEditingId(null)} disabled={isRenaming} />
                    <ThemedButton
                      label="Save"
                      onPress={() => handleRename(tag)}
                      loading={isRenaming}
                      disabled={isRenaming || !editLabel.trim()}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <ThemedText style={styles.tagLabel}>{tag.label}</ThemedText>
                  <ThemedButton label="Edit" variant="text" onPress={() => startEdit(tag)} />
                  <ThemedButton label="Delete" variant="textDanger" onPress={() => confirmDelete(tag)} />
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </PageScreen>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addInput: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  tagLabel: {
    flex: 1,
  },
  editArea: {
    flex: 1,
    gap: Spacing.two,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});
