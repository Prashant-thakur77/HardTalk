import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, MIN_TARGET, radius, space, type } from './theme';

/**
 * On a practice the user built as a topic after a safety hold (a crisis-line posting, a wellbeing
 * pitch): support stays one tap away for as long as the practice exists.
 */
export function TopicSupport() {
  return (
    <View style={styles.note}>
      <Text style={type.caption}>
        You said this touches a hard topic rather than being about you. If that changes, stop at any time.
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Talk to someone"
        accessibilityHint="Free, confidential support lines"
        onPress={() => router.push({ pathname: '/support', params: { reason: 'topic' } })}
        style={styles.link}>
        <Text style={styles.linkText}>Talk to someone ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { borderRadius: radius, borderWidth: 1.5, borderColor: colors.warning, padding: space.sm + 4 },
  link: { minHeight: MIN_TARGET, justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
