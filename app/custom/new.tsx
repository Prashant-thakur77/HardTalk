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
import { getTrack, tracks } from '@/tracks';
import { Button } from '@/ui/Button';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';
import { TrackTabs } from '@/ui/TrackTabs';

type Field = Exclude<keyof CustomScenarioForm, 'track'>;

const FIELDS: { key: Field; label: string; placeholder: string }[] = [
  { key: 'title', label: 'What is the conversation?', placeholder: 'e.g. Ask my lead for a raise' },
  { key: 'personaName', label: 'Who is it with?', placeholder: 'e.g. Dana' },
  { key: 'personaRole', label: 'Their role', placeholder: 'e.g. Engineering lead' },
  { key: 'userGoal', label: 'What do you need from them?', placeholder: 'e.g. A clear answer before the review cycle' },
  { key: 'pushback', label: 'What pushback do you expect?', placeholder: 'e.g. Budgets are frozen until next year' },
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
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  if (!pro) return <Redirect href="/" />;

  const save = async () => {
    const parsed = customScenarioFormSchema.safeParse(form);
    if (!parsed.success) {
      const byField: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        byField[field] ??= issue.message;
      }
      setErrors(byField);
      return;
    }
    const scenario = buildCustomScenario(parsed.data);
    await saveCustomScenario(scenario);
    router.replace({ pathname: '/scenario/[id]', params: { id: scenario.id } });
  };

  const missing = FIELDS.filter((field) => errors[field.key]).length;

  return (
    <Screen
      footer={
        <>
          {missing > 0 ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {missing === 1 ? 'One answer is missing, marked in red.' : `${missing} answers are missing, marked in red.`}
            </Text>
          ) : null}
          <Button label="Save scenario" onPress={() => void save()} />
        </>
      }>
      <PurchaseNotice />
      <View style={styles.field}>
        <Text style={styles.label}>What kind of practice?</Text>
        <TrackTabs
          tracks={tracks}
          selected={form.track}
          onSelect={(track) => setForm((current) => ({ ...current, track }))}
        />
        <Text style={type.caption}>{getTrack(form.track).tagline}</Text>
      </View>
      {FIELDS.map((field) => {
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
      })}
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
  invalid: { borderColor: colors.danger, borderWidth: 2 },
  fieldError: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  error: { ...type.body, color: colors.danger, fontWeight: '600' },
});
