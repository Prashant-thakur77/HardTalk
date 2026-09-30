import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { usePreferences } from '@/a11y/preferences';
import { config } from '@/config';
import { usePro } from '@/purchases';
import {
  buildCustomScenario,
  customScenarioFormSchema,
  saveCustomScenario,
  type CustomScenarioForm,
} from '@/scenarios/custom';
import { MAX_SOURCE_CHARS, MIN_SOURCE_CHARS } from '@/scenarios/draft';
import { draftScenario, sampleFor } from '@/scenarios/drafting';
import { isDistressLine, NotScoredForSafety } from '@/safety';
import { peopleIn } from '@/scenarios/people';
import type { Scenario } from '@/scenarios/schema';
import { getTrack, tracks } from '@/tracks';
import { trackIdSchema, type TrackId } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { Segmented } from '@/ui/Segmented';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { RoomCard } from '@/ui/RoomCard';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';
import { TrackTabs } from '@/ui/TrackTabs';

type Field = Exclude<keyof CustomScenarioForm, 'track'>;
type Mode = 'paste' | 'describe';

const MODES = [
  { value: 'paste', label: 'Paste it', description: 'Paste a job posting, your pitch or the motion, and a panel is built for it.' },
  { value: 'describe', label: 'Describe it', description: 'Answer five short questions instead.' },
] as const;

const FIELDS: { key: Field; label: string; placeholder: string }[] = [
  { key: 'title', label: 'What is the conversation?', placeholder: 'e.g. Ask for a raise, or defend my thesis' },
  { key: 'personaName', label: 'Who is it with?', placeholder: 'e.g. Dana' },
  { key: 'personaRole', label: 'Their role', placeholder: 'e.g. Engineering lead, or angel investor' },
  { key: 'userGoal', label: 'What do you need from them?', placeholder: 'e.g. A clear yes, or a second meeting' },
  { key: 'pushback', label: 'What pushback do you expect?', placeholder: 'e.g. Budgets are frozen, or we have seen this before' },
];

/**
 * Pro: practise your own conversation. Paste the real thing and a panel is drafted for it, or
 * describe it in five answers. Either way it is saved as a scenario graded on the track's rubrics.
 */
export default function NewCustomScenario() {
  const pro = usePro();
  const { reduceMotion } = usePreferences();
  const [mode, setMode] = useState<Mode>('paste');
  const params = useLocalSearchParams<{ track?: string }>();
  const [track, setTrack] = useState<TrackId>(() => trackIdSchema.catch('interview').parse(params.track));
  const [source, setSource] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<Scenario | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  // Set when what was written reads like real distress: nothing is drafted or saved, the text
  // stays so a false alarm can be reworded, and support is one tap away.
  const [safetyHold, setSafetyHold] = useState(false);
  const holdForSafety = () => {
    setSafetyHold(true);
    AccessibilityInfo.announceForAccessibility('This wasn’t turned into a practice. Support is one tap away.');
  };
  const [form, setForm] = useState<Omit<CustomScenarioForm, 'track'>>({
    title: '',
    personaName: '',
    personaRole: '',
    userGoal: '',
    pushback: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  if (!pro) return <Redirect href="/" />;

  const open = async (scenario: Scenario) => {
    await saveCustomScenario(scenario);
    router.replace({ pathname: '/scenario/[id]', params: { id: scenario.id } });
  };

  const build = async () => {
    setDrafting(true);
    setDraftError(null);
    try {
      setDraft(await draftScenario(track, source));
    } catch (error) {
      if (error instanceof NotScoredForSafety) {
        holdForSafety();
        return;
      }
      setDraftError(error instanceof Error ? error.message : String(error));
    } finally {
      setDrafting(false);
    }
  };

  const saveDescribed = async () => {
    if (Object.values(form).some((answer) => isDistressLine(answer))) {
      holdForSafety();
      return;
    }
    const parsed = customScenarioFormSchema.safeParse({ ...form, track });
    if (!parsed.success) {
      const byField: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) byField[issue.path[0] as Field] ??= issue.message;
      setErrors(byField);
      return;
    }
    await open(buildCustomScenario(parsed.data));
  };

  const sourceLength = source.trim().length;
  const missing = FIELDS.filter((field) => errors[field.key]).length;

  const hold = safetyHold ? (
    <View style={styles.hold}>
      <Text style={styles.holdTitle}>This wasn’t turned into a practice</Text>
      <Text style={type.body}>
        Some of it reads like someone may be in real distress, so nothing was drafted or saved. If it’s about you,
        support is one tap away. If it’s a topic (a mental-health product, say), reword it and try again.
      </Text>
      <Button
        label="Talk to someone"
        variant="secondary"
        onPress={() => router.push({ pathname: '/support', params: { reason: 'pasted' } })}
        hint="Free, confidential support lines"
      />
    </View>
  ) : null;

  const footer =
    mode === 'describe' ? (
      <>
        {hold}
        {missing > 0 ? (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {missing === 1 ? 'One answer is missing, marked in red.' : `${missing} answers are missing, marked in red.`}
          </Text>
        ) : null}
        <Button label="Save scenario" onPress={() => void saveDescribed()} />
      </>
    ) : draft ? (
      <>
        <Button label="Save and open the brief" onPress={() => void open(draft)} />
        <Pressable accessibilityRole="button" accessibilityLabel="Start over" onPress={() => setDraft(null)} style={styles.link}>
          <Text style={styles.linkText}>Start over</Text>
        </Pressable>
      </>
    ) : (
      <>
        {hold}
        {draftError ? (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {draftError}
          </Text>
        ) : null}
        {config.mock ? (
          <Text style={styles.mockNote}>
            Mock mode builds the sample panel for this track, whatever you paste. Live mode builds it from your text.
          </Text>
        ) : null}
        <Button
          label={drafting ? 'Building your panel…' : 'Build my panel'}
          onPress={() => void build()}
          disabled={drafting || sourceLength < MIN_SOURCE_CHARS}
          hint="Drafts the people, their questions and your goal from what you pasted"
        />
      </>
    );

  return (
    <Screen footer={footer}>
      <PurchaseNotice />
      {draft ? (
        <>
          <Text style={styles.eyebrow}>Your panel is ready</Text>
          <Text style={type.title} accessibilityRole="header">
            {draft.title}
          </Text>
          <Text style={type.body}>{draft.summary}</Text>
          <View style={styles.goalCard}>
            <Text style={styles.eyebrow}>Your goal</Text>
            <Text style={styles.goalText}>{draft.user_goal}</Text>
          </View>
          <RoomCard people={peopleIn(draft, 'L1')} reduceMotion={reduceMotion} />
          <MockBanner message="Mock mode: this is the recorded draft for the sample text. Live mode drafts a panel from whatever you paste." />
        </>
      ) : (
        <>
          <Segmented<Mode>
            label="How do you want to set it up?"
            segments={MODES.map((option) => ({ value: option.value, name: option.label, description: option.description }))}
            selected={mode}
            onSelect={(next) => {
              setMode(next);
              setSafetyHold(false);
            }}
          />
          <View style={styles.field}>
            <Text style={styles.label}>What kind of practice?</Text>
            <TrackTabs tracks={tracks} selected={track} onSelect={setTrack} />
          </View>
          {mode === 'paste' ? (
            <View style={styles.field}>
              <Text style={styles.label} nativeID="label-source">
                {getTrack(track).paste_label}
              </Text>
              <TextInput
                accessibilityLabel={getTrack(track).paste_label}
                accessibilityLabelledBy="label-source"
                value={source}
                onChangeText={(text) => {
                  setSource(text);
                  setSafetyHold(false);
                }}
                maxLength={MAX_SOURCE_CHARS}
                multiline
                placeholder="Paste it here. Names of real people are replaced with invented ones."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.source]}
              />
              <Text style={type.caption}>
                {sourceLength < MIN_SOURCE_CHARS
                  ? `At least ${MIN_SOURCE_CHARS} characters, so there is enough to draft from.`
                  : `${sourceLength} of ${MAX_SOURCE_CHARS} characters.`}
              </Text>
              {config.mock ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Use the sample: ${sampleFor(track).label}`}
                  onPress={() => {
                    setSource(sampleFor(track).source.trim());
                    setSafetyHold(false);
                  }}
                  style={styles.link}>
                  <Text style={styles.linkText}>Use the sample: {sampleFor(track).label}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            FIELDS.map((field) => {
              const error = errors[field.key];
              return (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label} nativeID={`label-${field.key}`}>
                    {field.label}
                  </Text>
                  <TextInput
                    accessibilityLabel={field.label}
                    accessibilityLabelledBy={`label-${field.key}`}
                    accessibilityHint={error}
                    aria-invalid={Boolean(error)}
                    value={form[field.key]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textMuted}
                    onChangeText={(value) => {
                      setForm((current) => ({ ...current, [field.key]: value }));
                      setSafetyHold(false);
                      if (error) setErrors((current) => ({ ...current, [field.key]: undefined }));
                    }}
                    style={[styles.input, error && styles.invalid]}
                    multiline={field.key === 'userGoal' || field.key === 'pushback'}
                  />
                  {error ? <Text style={styles.fieldError}>{error}</Text> : null}
                </View>
              );
            })
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { ...type.body, fontWeight: '600' },
  eyebrow: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  goalCard: { gap: 2, backgroundColor: colors.quote, borderRadius: 14, padding: space.md },
  goalText: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.text },
  input: {
    minHeight: MIN_TARGET,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    borderRadius: radius,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 16,
    color: colors.text,
  },
  source: { minHeight: 180, maxHeight: 320, textAlignVertical: 'top' },
  invalid: { borderColor: colors.danger, borderWidth: 2 },
  fieldError: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  error: { ...type.body, color: colors.danger, fontWeight: '600' },
  hold: { gap: space.sm, borderRadius: radius, borderWidth: 1.5, borderColor: colors.warning, backgroundColor: colors.surface, padding: space.md },
  holdTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  mockNote: { fontSize: 14, lineHeight: 19, color: colors.textMuted, textAlign: 'center' },
  link: { minHeight: MIN_TARGET, justifyContent: 'center', alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
