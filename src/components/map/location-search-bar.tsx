import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { LocationListItem } from '@/components/map/location-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocationSearch } from '@/hooks/use-location-search';
import type { NearbyLocation } from '@/lib/locations';

type LocationSearchBarProps = {
  onSelect: (location: NearbyLocation) => void;
};

export function LocationSearchBar({ onSelect }: LocationSearchBarProps) {
  const [query, setQuery] = useState('');
  const { results, isSearching, error } = useLocationSearch(query);
  const showDropdown = query.trim().length > 0;

  function handleSelect(location: NearbyLocation) {
    setQuery('');
    onSelect(location);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.inputRow}>
        <ThemedTextInput
          placeholder="Search locations"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        {isSearching && <ActivityIndicator size="small" />}
        {query.length > 0 && !isSearching && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => setQuery('')}>
            <ThemedText type="smallBold">{'×'}</ThemedText>
          </Pressable>
        )}
      </ThemedView>

      {showDropdown && (
        <ThemedView style={styles.dropdown}>
          {error && (
            <ThemedText themeColor="danger" type="small" style={styles.dropdownMessage}>
              {error}
            </ThemedText>
          )}
          {!error && !isSearching && results.length === 0 && (
            <ThemedText themeColor="textSecondary" type="small" style={styles.dropdownMessage}>
              No locations match &quot;{query.trim()}&quot;.
            </ThemedText>
          )}
          <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
            {results.map((location) => (
              <LocationListItem key={location.id} location={location} onPress={handleSelect} />
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.one,
    borderRadius: Spacing.two,
    elevation: 4,
  },
  dropdownMessage: {
    padding: Spacing.three,
  },
  resultsList: {
    maxHeight: 280,
  },
});
