import type { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from './theme';

interface ScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  /** For screens that jump to a section, such as the scorecard's skill summary. */
  scrollRef?: RefObject<ScrollView | null>;
}

export function Screen({ children, footer, scrollRef }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.md, gap: space.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  footer: {
    padding: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
});
