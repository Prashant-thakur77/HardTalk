import { StyleSheet, View } from 'react-native';

import { colors, scoreStrokes } from './theme';

/** How to read a bar that compares two tries: `since` is "last time" or "your first try". */
export const skillKey = (since: string) =>
  `Faint steps you already had ${since}, solid steps are new, dashed steps were lost.`;

/**
 * Four steps for a 1–4 score. Compared with an earlier try, the steps you kept are faint, the steps
 * you gained are solid, and the steps you lost are dashed; alone, every step you scored is solid.
 */
export function SkillBar({ score, previous }: { score: number; previous?: number }) {
  return (
    <View style={styles.row} accessible={false}>
      {[1, 2, 3, 4].map((step) => {
        const filled = step <= score;
        const kept = previous !== undefined && step <= Math.min(score, previous);
        const lost = previous !== undefined && step > score && step <= previous;
        return (
          <View
            key={step}
            style={[
              styles.step,
              filled && { backgroundColor: scoreStrokes[score] },
              kept && { opacity: 0.45 },
              lost && { borderColor: colors.borderStrong, borderWidth: 2, borderStyle: 'dashed' },
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
