import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePurchaseNotice } from '@/purchases';

import { colors, radius, space } from './theme';

/** What happened with a purchase, restore or paywall, on the screen the user is on. */
export function PurchaseNotice() {
  const notice = usePurchaseNotice();
  const success = notice?.tone === 'success';

  useEffect(() => {
    if (success) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [success]);

  if (!notice) return null;
  return (
    <View style={[styles.box, success && styles.success]} accessibilityLiveRegion="polite">
      <Text style={[styles.text, success && styles.successText]}>{notice.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius, borderWidth: 1.5, borderColor: colors.danger, padding: space.sm + 4 },
  success: { borderColor: colors.success, backgroundColor: '#EAF5EF' },
  text: { color: colors.danger, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  successText: { color: colors.success },
});
