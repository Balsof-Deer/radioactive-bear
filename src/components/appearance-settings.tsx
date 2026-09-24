import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ColorPicker, { HueCircular, Panel1 } from 'reanimated-color-picker';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_PRESETS, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference, type ThemeMode } from '@/lib/theme-preference';

const MODES: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

type AppearanceSettingsProps = {
  // Lets the parent pause its own scrolling while the color wheel is
  // open, so dragging around the wheel doesn't scroll the page instead.
  onPickingChange: (isPicking: boolean) => void;
};

export function AppearanceSettings({ onPickingChange }: AppearanceSettingsProps) {
  const theme = useTheme();
  const { mode, setMode, accent, setAccent } = useThemePreference();
  const [isPicking, setIsPicking] = useState(false);
  const [draft, setDraft] = useState(accent);

  const isCustom = !ACCENT_PRESETS.some((preset) => preset.value.toLowerCase() === accent.toLowerCase());

  function openPicker() {
    setDraft(accent);
    setIsPicking(true);
    onPickingChange(true);
  }

  function closePicker() {
    setIsPicking(false);
    onPickingChange(false);
  }

  function applyDraft() {
    setAccent(draft);
    closePicker();
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold">Appearance</ThemedText>
      <ThemedView type="backgroundElement" style={styles.segmented}>
        {MODES.map((option) => {
          const selected = option.value === mode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMode(option.value)}
              style={[styles.segment, selected && { backgroundColor: theme.tint }]}>
              <ThemedText
                type="smallBold"
                style={selected ? { color: theme.onTint } : undefined}
                themeColor={selected ? undefined : 'textSecondary'}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      <ThemedText type="smallBold">Accent color</ThemedText>
      <View style={styles.swatchRow}>
        {ACCENT_PRESETS.map((preset) => {
          const selected = preset.value.toLowerCase() === accent.toLowerCase();
          return (
            <Pressable
              key={preset.value}
              accessibilityRole="button"
              accessibilityLabel={preset.label}
              accessibilityState={{ selected }}
              onPress={() => setAccent(preset.value)}
              style={[
                styles.swatch,
                { backgroundColor: preset.value, borderColor: selected ? theme.text : 'transparent' },
              ]}
            />
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Custom color"
          accessibilityState={{ selected: isCustom }}
          onPress={openPicker}
          style={[
            styles.swatch,
            styles.customSwatch,
            {
              backgroundColor: isCustom ? accent : theme.backgroundElement,
              borderColor: isCustom ? theme.text : theme.backgroundSelected,
            },
          ]}>
          {!isCustom && <ThemedText type="smallBold">+</ThemedText>}
        </Pressable>
      </View>

      {isPicking && (
        <ThemedView type="backgroundElement" style={styles.pickerCard}>
          <ColorPicker value={draft} onCompleteJS={(colors) => setDraft(colors.hex)} style={styles.picker}>
            <HueCircular containerStyle={styles.hueContainer}>
              <Panel1 style={styles.panel} />
            </HueCircular>
          </ColorPicker>

          <View style={styles.previewRow}>
            <View style={[styles.previewSwatch, { backgroundColor: draft }]} />
            <ThemedText type="small">{draft.toUpperCase()}</ThemedText>
          </View>

          <ThemedButton label="Use this color" onPress={applyDraft} />
          <ThemedButton label="Cancel" variant="secondary" onPress={closePicker} />
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Spacing.five,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  customSwatch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCard: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  picker: {
    width: '80%',
    alignSelf: 'center',
  },
  hueContainer: {
    justifyContent: 'center',
  },
  panel: {
    width: '70%',
    height: '70%',
    alignSelf: 'center',
    borderRadius: Spacing.three,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  previewSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
