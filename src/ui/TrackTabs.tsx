import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Track, TrackId } from '@/tracks/schema';

import { colors, MIN_TARGET, space } from './theme';

interface TrackTabsProps {
  tracks: Track[];
  selected: TrackId;
  onSelect: (id: TrackId) => void;
}

/** One tab per practice track. Wraps onto a second row on narrow screens, so no tab is hidden. */
export function TrackTabs({ tracks, selected, onSelect }: TrackTabsProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="Practice tracks">
      {tracks.map((track) => {
        const active = track.id === selected;
        return (
          <Pressable
            key={track.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            aria-selected={active}
            accessibilityLabel={`${track.name}. ${track.tagline}`}
            onPress={() => onSelect(track.id)}
            style={({ pressed }) => [styles.tab, active && styles.active, pressed && styles.pressed]}>
            <Text style={[styles.label, active && styles.activeLabel]}>{track.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tab: {
    minHeight: MIN_TARGET,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  label: { fontSize: 16, fontWeight: '700', color: colors.text },
  activeLabel: { color: colors.onPrimary },
});
