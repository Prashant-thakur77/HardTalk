import { StyleSheet, View } from 'react-native';

import { colors, scoreColors } from './theme';

/**
 * Four steps for a 1–4 score. After a retry, what you already had is drawn faint and the gain in
 * full colour; a drop shows the lost steps outlined.
 */
export function SkillBar({ score, previous }: { score: number; previous?: number }) {
  return (
    <View style={styles.row} accessible={false}>
      {[1, 2, 3, 4].map((step) => {
        const filled = step <= score;
        const wasFilled = previous !== undefined && step <= previous && !filled;
        const alreadyHad = previous !== undefined && previous < score && step <= previous;
        return (
          <View
            key={step}
            style={[
              styles.step,
              filled && { backgroundColor: scoreColors[score] },
              alreadyHad && { opacity: 0.45 },
              wasFilled && { borderColor: colors.borderStrong, borderWidth: 2, borderStyle: 'dashed' },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.track },
});
