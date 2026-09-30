import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
import { peopleIn } from '@/scenarios/people';
import type { Scenario } from '@/scenarios/schema';
import { getTrack, tracks } from '@/tracks';
import type { TrackId } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { RoomCard } from '@/ui/RoomCard';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';
import { TrackTabs } from '@/ui/TrackTabs';

type Field = Exclude<keyof CustomScenarioForm, 'track'>;
type Mode = 'paste' | 'describe';

const MODES = [
  { value: 'paste', label: 'Paste the real thing', description: 'A job posting, your pitch, the motion.' },
  { value: 'describe', label: 'Describe it', description: 'Five short answers.' },
] as const;

const FIELDS: { key: Field; label: string; placeholder: string }[] = [
  { key: 'title', label: 'What is the conversation?', placeholder: 'e.g. Ask my lead for a raise' },
  { key: 'personaName', label: 'Who is it with?', placeholder: 'e.g. Dana' },
  { key: 'personaRole', label: 'Their role', placeholder: 'e.g. Engineering lead' },
  { key: 'userGoal', label: 'What do you need from them?', placeholder: 'e.g. A clear answer before the review cycle' },
  { key: 'pushback', label: 'What pushback do you expect?', placeholder: 'e.g. Budgets are frozen until next year' },
];

/**
 * Pro: practise your own conversation. Paste the real thing and a panel is drafted for it, or
 * describe it in five answers. Either way it is saved as a scenario graded on the track's rubrics.
 */
export default function NewCustomScenario() {
  const pro = usePro();
  const { reduceMotion } = usePreferences();
  const [mode, setMode] = useState<Mode>('paste');
  const [track, setTrack] = useState<TrackId>('interview');
  const [source, setSource] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<Scenario | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
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
      setDraftError(error instanceof Error ? error.message : String(error));
    } finally {
      setDrafting(false);
    }
  };

  const saveDescribed = async () => {
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

  const footer =
    mode === 'describe' ? (
      <>
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
          <ChoiceGroup<Mode> label="How do you want to set it up?" choices={MODES} selected={mode} onSelect={setMode} horizontal />
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
                onChangeText={setSource}
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
                  onPress={() => setSource(sampleFor(track).source.trim())}
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
  mockNote: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: colors.onNotice, backgroundColor: colors.notice, borderRadius: radius, padding: space.sm },
  link: { minHeight: MIN_TARGET, justifyContent: 'center', alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
