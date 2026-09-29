import answerDirectness from '@data/rubrics/answer_directness.yaml';
import askMade from '@data/rubrics/ask_made.yaml';
import boundaryHeld from '@data/rubrics/boundary_held.yaml';
import claimClarity from '@data/rubrics/claim_clarity.yaml';
import clarity from '@data/rubrics/clarity.yaml';
import empathy from '@data/rubrics/empathy.yaml';
import evidence from '@data/rubrics/evidence.yaml';
import heldPosition from '@data/rubrics/held_position.yaml';
import objectionHandling from '@data/rubrics/objection_handling.yaml';
import ownership from '@data/rubrics/ownership.yaml';
import rebuttal from '@data/rubrics/rebuttal.yaml';
import starStructure from '@data/rubrics/star_structure.yaml';
import steelman from '@data/rubrics/steelman.yaml';

import { rubricSchema, type Dimension, type Rubric } from './rubric.schema';

const loaded = [
  clarity,
  empathy,
  askMade,
  boundaryHeld,
  answerDirectness,
  evidence,
  objectionHandling,
  starStructure,
  ownership,
  claimClarity,
  rebuttal,
  steelman,
  heldPosition,
].map((raw) => rubricSchema.parse(raw));

export const rubrics = Object.fromEntries(loaded.map((rubric) => [rubric.id, rubric])) as Record<
  Dimension,
  Rubric
>;
