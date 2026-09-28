import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Platform } from 'react-native';

/** Rough speaking time for a screen reader announcement, used where the OS gives no event. */
const estimateMs = (text: string) => 600 + text.split(' ').length * 380;

/**
 * Announces text to VoiceOver/TalkBack and keeps the persona quiet while it is read, so the
 * two voices never talk over each other. iOS reports when the announcement finishes; Android
 * does not, so its pause is estimated from the length of the text.
 */
export function announce(text: string, setPersonaVolume: (volume: number) => void) {
  void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
    if (!enabled) return;
    setPersonaVolume(0);
    const restore = () => setPersonaVolume(1);
    if (Platform.OS === 'ios') {
      const subscription = AccessibilityInfo.addEventListener('announcementFinished', () => {
        subscription.remove();
        restore();
      });
    } else {
      setTimeout(restore, estimateMs(text));
    }
    AccessibilityInfo.announceForAccessibility(text);
  });
}

/** A light tap when it becomes the user's turn, and a success buzz when the session ends. */
export function turnHaptic(kind: 'your_turn' | 'ended') {
  if (Platform.OS === 'web') return;
  if (kind === 'your_turn') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
