import type { Difficulty } from './schema';

export const DIFFICULTIES: Record<Difficulty, { name: string; description: string }> = {
  L1: { name: 'Cooperative', description: 'Busy but reasonable. Agrees once the ask is clear.' },
  L2: { name: 'Defensive', description: 'Justifies, deflects blame once, needs a second ask.' },
  L3: { name: 'Deflecting', description: 'Changes the subject and questions your standing.' },
};
