# Accessibility

The whole loop (pick a scenario, have the conversation, read the scorecard, retry) can be done with a screen reader on and no audio, by typing. This file maps what the app does to WCAG 2.2, and says what is partial or missing.

| What | How | WCAG 2.2 | Status |
| --- | --- | --- | --- |
| Text-only mode | "Type" on the brief screen: same persona, same levels, same grader, no microphone and no persona audio. Mock mode prefills the recorded line. | 1.2.1 Audio-only (prerecorded); 2.1.1 Keyboard | Covered |
| Live captions | Every line from every speaker is shown as a caption during the session, labelled with who said it (on a panel, each person by name). In mock mode they stream word by word; live, each line appears when it is spoken. | 1.2.4 Captions (live) | Covered (live captions appear per line, not per word) |
| Full transcript | The scorecard ends with the whole conversation, both speakers. | 1.2.1 | Covered |
| Screen reader labels and roles | Every control has `accessibilityLabel` and `accessibilityRole`; choice groups are `radiogroup`/`radio` with `checked` state; scores read as "Clarity: 3 out of 4, was 2". | 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value | Covered |
| Turn changes announced | "Your turn" is announced with `announceForAccessibility`; in text mode the persona's line is read out first. The status line is an Android live region. | 4.1.3 Status Messages | Covered |
| Persona quiet while the screen reader talks | Announcements lower the persona's volume to 0 and restore it when iOS reports the announcement finished (Android: estimated from length). In mock mode, where the device reads persona lines aloud, the same call silences it. | 1.4.2 Audio Control | Partial on Android |
| Persona faces | The drawn faces are decorative and hidden from screen readers; each person's name, role, stance and question topics are always in text beside them, and a stance is shown in words, not only colour. | 1.1.1 Non-text Content; 1.4.1 Use of Color | Covered |
| Track tabs | The four tracks are a `tablist` of `tab`s with `selected` state, each labelled with its name and tagline. | 4.1.2 Name, Role, Value | Covered |
| Haptics | A light tap when it becomes your turn, a success buzz when the session ends (`expo-haptics`). | Supports 1.3.3 Sensory Characteristics by adding a non-visual cue | Covered |
| Persona speaking pace | Slower / Normal / Faster on the brief screen, saved on the device, sent to the voice as a speed override. | 1.4.2 Audio Control (partial analogue) | Covered |
| Reduce Motion | With the OS setting on, captions appear a whole line at a time, faces stop blinking and talking, the speaking ring holds still, and the confetti for a better retry does not play. | 2.3.3 Animation from Interactions | Covered |
| Text contrast | Every text colour on every background it is drawn on is at least 4.5:1, checked by `src/ui/__tests__/contrast.test.ts`. | 1.4.3 Contrast (Minimum) | Covered |
| Control boundaries | Unselected choices and inputs use a 3:1 border; selected ones add a filled radio dot, not just colour. | 1.4.11 Non-text Contrast; 1.4.1 Use of Color | Covered |
| Touch targets | Buttons, choices and links are at least 48 pt tall. | 2.5.8 Target Size (Minimum) | Covered |
| Text size | System font scaling is never disabled; layouts are single-column and scroll. | 1.4.4 Resize Text | Covered; not yet checked at the largest iOS accessibility size on a device |
| Errors | Mic denied, connection lost, grading failed: each says what happened, in plain words, with a way forward. Form errors name the missing field. | 3.3.1 Error Identification | Covered |

## Not covered yet

- Not tested end to end with VoiceOver or TalkBack on a physical device. The labels, roles and announcements are in the code and checked in the web build's accessibility tree, but no screen-reader session on a phone has been recorded.
- Live captions show each line once the speaker finishes it, not word by word.
- Dark mode and high-contrast system themes are not supported; the app always renders its light theme.
