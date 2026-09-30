import { StyleSheet, View } from 'react-native';

import { stepStates } from './skillSteps';
import { colors, scoreStrokes } from './theme';

export function SkillBar({ score, previous }: { score: number; previous?: number }) {
  return (
    <View style={styles.row} accessible={false}>
      {stepStates(score, previous).map((state, index) => (
        <View
          key={index}
          style={[
            styles.step,
            (state === 'scored' || state === 'gained') && { backgroundColor: scoreStrokes[score] },
            state === 'kept' && styles.kept,
            state === 'lost' && styles.lost,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.track },
  kept: { backgroundColor: colors.kept },
  lost: { borderColor: colors.borderStrong, borderWidth: 2, borderStyle: 'dashed' },
});
