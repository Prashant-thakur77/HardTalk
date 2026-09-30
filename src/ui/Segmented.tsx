import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, MIN_TARGET, space, type } from './theme';

export interface Segment<T extends string | number> {
  value: T;
  /** Optional short line on top, such as "L2". */
  label?: string;
  /** The segment's name, such as "Probing". */
  name: string;
  /** Read by screen readers with the choice; shown only for the selected segment. */
  description?: string;
}

interface SegmentedProps<T extends string | number> {
  label: string;
  segments: readonly Segment<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** A compact radio group: equal segments in one row, and only the chosen one explained. */
export function Segmented<T extends string | number>({ label, segments, selected, onSelect }: SegmentedProps<T>) {
  const chosen = segments.find((segment) => segment.value === selected);
  return (
    <View style={styles.group}>
      <Text style={type.heading} accessibilityRole="header">
        {label}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {segments.map((segment) => {
          const checked = segment.value === selected;
          return (
            <Pressable
              key={String(segment.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              aria-checked={checked}
              accessibilityLabel={[segment.label ? `${segment.label} · ${segment.name}` : segment.name, segment.description]
                .filter(Boolean)
                .join('. ')}
              onPress={() => onSelect(segment.value)}
              style={[styles.segment, checked && styles.checked]}>
              {segment.label ? <Text style={[styles.top, checked && styles.onChecked]}>{segment.label}</Text> : null}
              <Text style={[styles.name, checked && styles.onChecked]}>{segment.name}</Text>
            </Pressable>
          );
        })}
      </View>
      {chosen?.description ? <Text style={type.caption}>{chosen.description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.xs },
  segment: {
    flex: 1,
    minHeight: MIN_TARGET + 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  top: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center' },
  onChecked: { color: colors.onPrimary },
});
