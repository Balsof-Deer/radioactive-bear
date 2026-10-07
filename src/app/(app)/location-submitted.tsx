import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Tile } from '@/components/tile';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = [
  { title: 'Private for 24 hours', body: 'Only you and admins can see it.' },
  { title: 'Community review', body: 'It opens up so other students can see and review it.' },
  { title: 'Approved', body: 'Once an admin signs off, or once the community review period passes.' },
];

// Shown after adding a location (replacing the form, so Back doesn't return
// to it): what happens to the submission next.
export default function LocationSubmittedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const lineHeight = Typography.bodyLarge.lineHeight * fontScale;
  const badgeSize = lineHeight * 1.4;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Tile color={theme.primary} size={lineHeight * 3.4}>
            <SymbolView name={{ android: 'check', web: 'check' }} size={lineHeight * 1.6} tintColor={theme.accent} />
          </Tile>
          <ThemedText type="title" accessibilityRole="header">
            Location submitted
          </ThemedText>

          <View style={[styles.steps, { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant }]}>
            {STEPS.map((step, index) => {
              const isCurrent = index === 0;
              return (
                <View
                  key={step.title}
                  style={[
                    styles.step,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.outlineVariant },
                  ]}>
                  <View
                    style={[
                      styles.stepNumber,
                      {
                        width: badgeSize,
                        height: badgeSize,
                        backgroundColor: isCurrent ? theme.accent : 'transparent',
                        borderColor: isCurrent ? theme.accent : theme.onSurface,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: isCurrent ? theme.onAccent : theme.onSurface }}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.stepText}>
                    <ThemedText type="heading">{step.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {step.body}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <ThemedButton label="Done" onPress={() => router.back()} />
            {id && (
              <ThemedButton label="View your spot" variant="text" onPress={() => router.replace(`/location/${id}`)} />
            )}
          </View>
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
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  steps: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  stepNumber: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    gap: Spacing.half,
  },
  actions: {
    marginTop: 'auto',
    gap: Spacing.one,
  },
});
