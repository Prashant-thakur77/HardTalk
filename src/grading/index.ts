import { config } from '@/config';
import { getRecording } from '@/mock/recordings';

import type { Grade } from './rubric.schema';
import type { Turn } from './transcript';

export interface GradeRequest {
  scenarioId: string;
  attempt: number;
  turns: Turn[];
}

export async function gradeConversation(request: GradeRequest): Promise<Grade> {
  if (config.mock) return getRecording(request.scenarioId, request.attempt).grade;
  throw new Error('Live grading is not wired yet. Run with EXPO_PUBLIC_MOCK=1.');
}
