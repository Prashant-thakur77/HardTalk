import { StyleSheet, Text, View } from 'react-native';

import { usePurchaseNotice } from '@/purchases';

import { colors, radius, space } from './theme';

/** Shows why a purchase, restore or paywall did not work, on the screen the user is on. */
export function PurchaseNotice() {
  const notice = usePurchaseNotice();
  if (!notice) return null;
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{notice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius, borderWidth: 1.5, borderColor: colors.danger, padding: space.sm + 4 },
  text: { color: colors.danger, fontSize: 15, lineHeight: 21, fontWeight: '600' },
});
