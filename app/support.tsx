import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { safety } from '@/safety';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

/**
 * Shown instead of a scorecard when a conversation sounds like more than practice, and when the
 * user asks for it after stopping. Only the first says why the practice ended.
 */
export default function Support() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const chosen = reason === 'chosen';
  const pasted = reason === 'pasted';
  return (
    <Screen footer={<Button label="Back to home" variant="secondary" onPress={() => router.dismissTo('/')} />}>
      <Text style={type.title} accessibilityRole="header">
        {chosen || pasted ? 'Take a moment.' : 'Let’s stop here.'}
      </Text>
      <Text style={type.body}>
        {pasted
          ? 'Nothing you wrote was turned into a practice or saved.'
          : chosen
          ? 'You ended the practice, and nothing from it was scored or saved.'
          : 'It sounded like this might be about more than practice. The roleplay has ended, and nothing from it was scored or saved.'}
      </Text>
      <Text style={type.body}>
        If things feel heavy right now, talking to someone can help. These services are free and confidential.
      </Text>
      {safety.resources.map((resource) => (
        <View key={resource.name} style={styles.resource}>
          <Text style={type.heading}>{resource.name}</Text>
          <Text style={type.body}>{resource.detail}</Text>
          {resource.url ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${resource.name}`}
              onPress={() => void Linking.openURL(resource.url!)}
              style={styles.link}>
              <Text style={styles.linkText}>{resource.url.replace('https://', '')}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Text style={type.caption}>{safety.disclaimer}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resource: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  link: { minHeight: MIN_TARGET, justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
});
