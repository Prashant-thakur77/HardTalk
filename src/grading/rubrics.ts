import askMade from '@data/rubrics/ask_made.yaml';
import boundaryHeld from '@data/rubrics/boundary_held.yaml';
import clarity from '@data/rubrics/clarity.yaml';
import empathy from '@data/rubrics/empathy.yaml';

import { rubricSchema, type Dimension, type Rubric } from './rubric.schema';

const loaded = [clarity, empathy, askMade, boundaryHeld].map((raw) => rubricSchema.parse(raw));

export const rubrics = Object.fromEntries(loaded.map((rubric) => [rubric.id, rubric])) as Record<
  Dimension,
  Rubric
>;
