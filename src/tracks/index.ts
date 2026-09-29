import debate from '@data/tracks/debate.yaml';
import interview from '@data/tracks/interview.yaml';
import pitch from '@data/tracks/pitch.yaml';
import workplace from '@data/tracks/workplace.yaml';

import { trackSchema, type Track, type TrackId } from './schema';

/** The four practice tracks, in the order the home screen shows them. */
export const tracks: Track[] = [workplace, pitch, interview, debate].map((raw) => trackSchema.parse(raw));

export function getTrack(id: TrackId): Track {
  const track = tracks.find((candidate) => candidate.id === id);
  if (!track) throw new Error(`Unknown track "${id}"`);
  return track;
}
