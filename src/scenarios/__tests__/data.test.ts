import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { DIMENSIONS, rubricSchema } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { isStopLine } from '@/safety';
import { scenarios } from '@/scenarios';
import { scenarioSchema } from '@/scenarios/schema';
import { tracks } from '@/tracks';
import { TRACK_IDS, trackSchema } from '@/tracks/schema';

const DATA = join(__dirname, '../../../data');

function yamlFiles(dir: string) {
  return readdirSync(join(DATA, dir))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => ({
      id: basename(file, '.yaml'),
      data: YAML.parse(readFileSync(join(DATA, dir, file), 'utf8')) as unknown,
    }));
}

describe('data/scenarios', () => {
  const files = yamlFiles('scenarios');

  it('ships the three workplace conversations and the pitch, interview and debate ones', () => {
    expect(files.map((file) => file.id).sort()).toEqual([
      'debate-ai-in-exams',
      'decline-extra-project',
      'interview-first-role',
      'interview-internship',
      'mid-sprint-scope-change',
      'pitch-seed-round',
      'pr-blocking-release',
    ]);
  });

  it('gives every built-in persona and panelist a drawn face', () => {
    for (const scenario of scenarios) {
      expect(scenario.persona.face, scenario.id).toBeDefined();
      for (const member of scenario.panel) expect(member.face, `${scenario.id}: ${member.name}`).toBeDefined();
    }
  });

  it('tells the user what everyone in the room will ask about, without giving away the hidden objection', () => {
    const pairs = (text: string) => {
      const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
      return new Set(words.slice(1).map((word, i) => `${words[i]} ${word}`));
    };
    for (const scenario of scenarios) {
      const secret = pairs(scenario.persona.hidden_objection);
      for (const person of [scenario.persona, ...scenario.panel]) {
        expect(person.asks_about?.length, `${scenario.id}: ${person.name}`).toBeGreaterThan(0);
        for (const topic of person.asks_about ?? []) {
          expect([...pairs(topic)].filter((pair) => secret.has(pair)), `${scenario.id}: ${topic}`).toEqual([]);
        }
      }
    }
  });

  it('only judges people on skills their track actually scores', () => {
    for (const scenario of scenarios) {
      const rubrics = tracks.find((track) => track.id === scenario.track)!.rubrics;
      for (const person of [scenario.persona, ...scenario.panel]) {
        for (const id of person.cares_about ?? []) expect(rubrics, `${scenario.id}: ${person.name}`).toContain(id);
      }
    }
  });

  it('gives everyone in a room a voice pitch of their own', () => {
    for (const scenario of scenarios) {
      const pitches = [scenario.persona, ...scenario.panel].map((person) => person.voice?.pitch);
      expect(pitches.every((pitch) => pitch !== undefined), scenario.id).toBe(true);
      expect(new Set(pitches).size, scenario.id).toBe(pitches.length);
    }
  });

  it('rejects two people in one room with the same name', () => {
    const [first] = files;
    const clash = structuredClone(first!.data) as { persona: { name: string }; panel?: unknown[] };
    clash.panel = [{ name: clash.persona.name, role: 'r', stance: 'agrees', view: 'v', tone: 't' }];
    expect(scenarioSchema.safeParse(clash).success).toBe(false);
  });

  for (const file of files) {
    it(`${file.id}.yaml matches the scenario schema and its filename`, () => {
      const scenario = scenarioSchema.parse(file.data);
      expect(scenario.id).toBe(file.id);
    });
  }

  it('level summaries shown to the user never give away the hidden objection', () => {
    const pairs = (text: string) => {
      const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
      return new Set(words.slice(1).map((word, i) => `${words[i]} ${word}`));
    };
    for (const file of files) {
      const scenario = scenarioSchema.parse(file.data);
      const secret = pairs(scenario.persona.hidden_objection);
      for (const level of Object.values(scenario.difficulty_levels)) {
        const shared = [...pairs(level.summary)].filter((pair) => secret.has(pair));
        expect(shared, `${file.id}: ${level.summary}`).toEqual([]);
      }
    }
  });

  it('every file on disk is registered with the app loader', () => {
    expect(scenarios.map((scenario) => scenario.id).sort()).toEqual(files.map((file) => file.id).sort());
  });
});

describe('data/rubrics', () => {
  const files = yamlFiles('rubrics');

  it('has one rubric per scored dimension', () => {
    expect(files.map((file) => file.id).sort()).toEqual([...DIMENSIONS].sort());
  });

  for (const file of files) {
    it(`${file.id}.yaml matches the rubric schema and its filename`, () => {
      const rubric = rubricSchema.parse(file.data);
      expect(rubric.id).toBe(file.id);
    });

    it(`${file.id}.yaml cites a named framework with a source`, () => {
      const rubric = rubricSchema.parse(file.data);
      expect(rubric.framework.name.length).toBeGreaterThan(3);
      expect(rubric.framework.source.length).toBeGreaterThan(20);
    });
  }

  it('every rubric is registered with the app loader', () => {
    expect(Object.keys(rubrics).sort()).toEqual([...DIMENSIONS].sort());
  });

  it('every rubric is used by at least one track', () => {
    const used = new Set(tracks.flatMap((track) => track.rubrics));
    expect([...used].sort()).toEqual([...DIMENSIONS].sort());
  });
});

describe('data/tracks', () => {
  const files = yamlFiles('tracks');

  it('has one file per track, each registered with the app loader', () => {
    expect(files.map((file) => file.id).sort()).toEqual([...TRACK_IDS].sort());
    expect(tracks.map((track) => track.id)).toEqual([...TRACK_IDS]);
  });

  for (const file of files) {
    it(`${file.id}.yaml matches the track schema and its filename`, () => {
      expect(trackSchema.parse(file.data).id).toBe(file.id);
    });
  }

  it('every track has at least one built-in conversation to practise', () => {
    for (const track of tracks) {
      expect(scenarios.some((scenario) => scenario.track === track.id), track.id).toBe(true);
    }
  });

  it("keeps the debate tip true: the ways it suggests to cut in don't stop, the one it warns about does", () => {
    const tip = tracks.find((track) => track.id === 'debate')!.tip!;
    const quoted = [...tip.matchAll(/"([^"]+)"/g)].map(([, phrase]) => phrase!);
    expect(quoted).toEqual(['hang on', 'let me answer that', 'Stop', "Stop, you're twisting it"]);
    expect(isStopLine('Hang on, that is not what I said.')).toBe(false);
    expect(isStopLine('Let me answer that.')).toBe(false);
    expect(isStopLine("Stop, you're twisting it.")).toBe(true);
  });

  it('rejects a track that lists a rubric twice', () => {
    const [first] = files;
    const broken = structuredClone(first!.data) as { rubrics: string[] };
    broken.rubrics = [broken.rubrics[0]!, ...broken.rubrics.slice(0, 3)];
    expect(trackSchema.safeParse(broken).success).toBe(false);
  });
});

describe('schemas reject malformed data', () => {
  it('rejects a scenario missing a difficulty level', () => {
    const [first] = yamlFiles('scenarios');
    const broken = structuredClone(first!.data) as { difficulty_levels: Record<string, unknown> };
    delete broken.difficulty_levels.L3;
    expect(scenarioSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a rubric with an unknown field (typos do not pass silently)', () => {
    const [first] = yamlFiles('rubrics');
    const broken = { ...(first!.data as object), anchor: 'typo' };
    expect(rubricSchema.safeParse(broken).success).toBe(false);
  });
});
