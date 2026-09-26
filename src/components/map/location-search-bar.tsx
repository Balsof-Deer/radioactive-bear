import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { Loading } from '@/components/loading';
import { LocationListItem } from '@/components/map/location-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useLocationSearch } from '@/hooks/use-location-search';
import { useTheme } from '@/hooks/use-theme';
import type { NearbyLocation } from '@/lib/locations';
import { useErrorToast } from '@/lib/toast';

type LocationSearchBarProps = {
  onSelect: (location: NearbyLocation) => void;
};

export function LocationSearchBar({ onSelect }: LocationSearchBarProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const [query, setQuery] = useState('');
  // Same height as the floating icon buttons beside it (44 at default).
  const fieldHeight = Typography.bodyLarge.lineHeight * fontScale * 2;
  const { results, isSearching, error } = useLocationSearch(query);
  useErrorToast(error);
  const showDropdown = query.trim().length > 0;

  function handleSelect(location: NearbyLocation) {
    setQuery('');
    onSelect(location);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { minHeight: fieldHeight, backgroundColor: theme.surfaceContainer }]}>
        <SymbolView name={{ android: 'search', web: 'search' }} size={fieldHeight * 0.45} tintColor={theme.textTertiary} />
        <ThemedTextInput
          placeholder="Search spots"
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search spots by name"
          style={styles.input}
        />
        {isSearching && <Loading scale={0.9} />}
        {query.length > 0 && !isSearching && (
          <IconButton icon="close" label="Clear search" onPress={() => setQuery('')} scale={1.6} />
        )}
      </View>

      {showDropdown && (
        <ThemedView type="backgroundElement" style={styles.dropdown}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  // Spec floating search field: white, radius 10, floating shadow.
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    boxShadow: Elevation.level2,
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
    borderRadius: Radius.lg,
    boxShadow: Elevation.level2,
    overflow: 'hidden',
  },
  dropdownMessage: {
    padding: Spacing.three,
  },
  resultsList: {
    maxHeight: 280,
  },
});
