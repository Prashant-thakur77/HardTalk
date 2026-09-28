import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, MIN_TARGET, radius, space, type } from './theme';

export interface Choice<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

interface ChoiceGroupProps<T extends string | number> {
  label: string;
  choices: readonly Choice<T>[];
  selected: T;
  onSelect: (value: T) => void;
  horizontal?: boolean;
}

/** A radio group: visible selection ring, 3:1 boundaries, and radio semantics for screen readers. */
export function ChoiceGroup<T extends string | number>({
  label,
  choices,
  selected,
  onSelect,
  horizontal = false,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.group}>
      <Text style={type.heading} accessibilityRole="header">
        {label}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={horizontal ? styles.row : styles.column}>
        {choices.map((choice) => {
          const checked = choice.value === selected;
          return (
            <Pressable
              key={String(choice.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              aria-checked={checked}
              accessibilityLabel={choice.description ? `${choice.label}. ${choice.description}` : choice.label}
              onPress={() => onSelect(choice.value)}
              style={[styles.choice, horizontal && styles.grow, checked && styles.checked]}>
              <View style={styles.titleRow}>
                <View style={[styles.ring, checked && styles.ringChecked]}>
                  {checked ? <View style={styles.dot} /> : null}
                </View>
                <Text style={[styles.label, checked && styles.labelChecked]}>{choice.label}</Text>
              </View>
              {choice.description ? <Text style={type.caption}>{choice.description}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  column: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  grow: { flex: 1 },
  choice: {
    minHeight: MIN_TARGET,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: space.md - 2,
    gap: space.xs,
    justifyContent: 'center',
  },
  checked: { borderColor: colors.primary, borderWidth: 2.5, backgroundColor: colors.quote },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  ring: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringChecked: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  label: { fontSize: 17, fontWeight: '600', color: colors.text },
  labelChecked: { color: colors.primary },
});
