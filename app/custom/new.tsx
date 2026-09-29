import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { usePro } from '@/purchases';
import {
  buildCustomScenario,
  customScenarioFormSchema,
  saveCustomScenario,
  type CustomScenarioForm,
} from '@/scenarios/custom';
import { tracks } from '@/tracks';
import type { TrackId } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

const FIELDS: { key: Exclude<keyof CustomScenarioForm, 'track'>; label: string; placeholder: string }[] = [
  { key: 'title', label: 'What is the conversation?', placeholder: 'Ask my lead for a raise' },
  { key: 'personaName', label: 'Who is it with?', placeholder: 'Dana' },
  { key: 'personaRole', label: 'Their role', placeholder: 'Engineering lead' },
  { key: 'userGoal', label: 'What do you need from them?', placeholder: 'A clear answer before the review cycle' },
  { key: 'pushback', label: 'What pushback do you expect?', placeholder: 'Budgets are frozen until next year' },
];

/**
 * Pro: write your own scenario, in any track. The persona, levels and scorecard work exactly as
 * built-ins, graded on that track's rubrics.
 */
export default function NewCustomScenario() {
  const pro = usePro();
  const [form, setForm] = useState<CustomScenarioForm>({
    track: 'workplace',
    title: '',
    personaName: '',
    personaRole: '',
    userGoal: '',
    pushback: '',
  });
  const [error, setError] = useState<string | null>(null);
  if (!pro) return <Redirect href="/" />;

  const save = async () => {
    const parsed = customScenarioFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form.');
      return;
    }
    const scenario = buildCustomScenario(parsed.data);
    await saveCustomScenario(scenario);
    router.replace({ pathname: '/scenario/[id]', params: { id: scenario.id } });
  };

  return (
    <Screen footer={<Button label="Save scenario" onPress={() => void save()} />}>
      <ChoiceGroup<TrackId>
        label="What kind of practice?"
        choices={tracks.map((track) => ({ value: track.id, label: track.name, description: track.tagline }))}
        selected={form.track}
        onSelect={(track) => setForm((current) => ({ ...current, track }))}
      />
      {FIELDS.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={styles.label} nativeID={`label-${field.key}`}>
            {field.label}
          </Text>
          <TextInput
            accessibilityLabel={field.label}
            accessibilityLabelledBy={`label-${field.key}`}
            value={form[field.key]}
            placeholder={field.placeholder}
            placeholderTextColor={colors.textMuted}
            onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
            style={styles.input}
            multiline={field.key === 'userGoal' || field.key === 'pushback'}
          />
        </View>
      ))}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { ...type.body, fontWeight: '600' },
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
  error: { ...type.body, color: colors.danger, fontWeight: '600' },
});
