import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { detectDistress, isStopRequest, safetyConfigSchema } from '../rules';

const config = safetyConfigSchema.parse(
  YAML.parse(readFileSync(join(__dirname, '../../../data/safety.yaml'), 'utf8')),
);

describe('isStopRequest', () => {
  it.each(['stop', 'Stop.', 'pause', 'Please stop.', 'Can we stop?', "Let's pause here.", 'I want to stop the roleplay', 'ok stop now', 'No, stop.', 'Wait, stop.'])(
    'stops on %j',
    (line) => expect(isStopRequest(line, config)).toBe(true),
  );

  it.each([
    'Stop blocking the release.',
    'No, stop adding scope.',
    'We need to stop adding scope mid-sprint.',
    "Don't stop now, we're close.",
    'Can we pause the migration until billing ships?',
    'The deadline is Friday.',
    '',
  ])('keeps the roleplay going on %j', (line) => expect(isStopRequest(line, config)).toBe(false));
});

describe('detectDistress', () => {
  it.each([
    'Honestly I want to kill myself when this happens.',
    "I don't want to be alive anymore.",
    'I have been thinking about suicide.',
    "I think I'm having a panic attack.",
    'My manager grabbed me last week.',
    'I’d be better off dead.',
    "I've been cutting myself again.",
    'Sometimes I think about hurting myself.',
  ])('flags %j', (line) => expect(detectDistress(line, config)).toBe(true));

  it.each([
    'This deadline is killing me.',
    "I'd kill for one quiet sprint.",
    "I'm dying to ship this.",
    "I'm not okay with adding scope on day six.",
    'That PR is dead in the water until security signs off.',
    'We need to hit Friday.',
    'Hit me up on Slack when it merges.',
    "I'd be hurting myself and the team's delivery if I took it on.",
    'I need to cut myself some slack this sprint.',
    "I'm killing myself to hit this deadline.",
    'They hit me with a new requirement on day six.',
    'I wanted to die of embarrassment in that demo.',
  ])('does not flag the workplace idiom %j', (line) => expect(detectDistress(line, config)).toBe(false));
});

describe('data/safety.yaml', () => {
  it('ships a disclaimer and crisis resources with links', () => {
    expect(config.disclaimer).toMatch(/not therapy/);
    expect(config.resources.filter((resource) => resource.url).length).toBeGreaterThanOrEqual(3);
  });
});
