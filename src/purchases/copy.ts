import paywallData from '@data/paywall.yaml';
import { z } from 'zod';

import type { PaywallContext } from './types';

const reasonCopy = z.strictObject({ headline: z.string(), body: z.string(), score: z.string() });

export const paywallCopySchema = z.strictObject({
  session_limit: reasonCopy,
  custom_scenario: reasonCopy,
  features: z.array(z.string()).min(1),
  plans: z.array(z.strictObject({ id: z.string(), label: z.string(), price: z.string(), note: z.string().optional() })),
});

const copy = paywallCopySchema.parse(paywallData);

function fill(text: string, context: PaywallContext): string {
  return text.replace('{{scenario_title}}', context.scenarioTitle).replace('{{score_line}}', context.scoreLine ?? '');
}

export function paywallCopy(context: PaywallContext) {
  const forReason = copy[context.reason];
  return {
    headline: fill(forReason.headline, context),
    body: fill(forReason.body, context),
    score: context.scoreLine ? fill(forReason.score, context) : null,
    features: copy.features,
    plans: copy.plans,
  };
}
