import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { detectDistress, isStopRequest, safetyConfigSchema } from '../rules';

const config = safetyConfigSchema.parse(
  YAML.parse(readFileSync(join(__dirname, '../../../data/safety.yaml'), 'utf8')),
);

describe('isStopRequest', () => {
  it.each([
    'stop',
    'Stop.',
    'pause',
    'Please stop.',
    'Can we stop?',
    "Let's pause here.",
    'I want to stop the roleplay',
    'ok stop now',
    'No, stop.',
    'Wait, stop.',
    'Stop it.',
    'Stop it!',
    'Please stop it.',
    'Just stop it.',
    'Stop this.',
    'Stop this, please.',
    'Can we stop it?',
    'Can we stop this?',
    'Stop it now.',
    // Round 6 probes.
    'Sam, stop.',
    'Stop it, Sam.',
    'Jordan, please stop.',
    'Stop that.',
    'stop pls',
    'Sorry, I need to stop the practice now.',
    'Can we please stop the roleplay now, please?',
    'Please stop now, I mean it.',
    'Stop. I can’t do this, I feel sick.',
    "OK, let's stop there.",
    'Could we stop for a moment?',
    // Round 7 probes (D-063).
    'No, no, no, stop.',
    'Stop, stop, stop, stop.',
    'Hold on, stop.',
    'Hang on, can we stop?',
    'Enough, stop.',
    'OK stop, this is too much.',
    'Stop, Sam, please.',
    'Please, Sam, stop.',
    'Stop, Jordan, please.',
    "Stop, I can't do this.",
    "Stop, I can't do this, I feel sick.",
    'Stop, thank you.',
  ])('stops on %j', (line) => expect(isStopRequest(line, config, ['Sam', 'Jordan', 'Alex'])).toBe(true));

  it('treats the persona’s name, including a two-word custom name, as addressing them', () => {
    expect(isStopRequest('Alex stop', config, ['Alex'])).toBe(true);
    expect(isStopRequest('Alex stop', config)).toBe(false);
    expect(isStopRequest('Dana Smith, stop.', config, ['Dana Smith'])).toBe(true);
  });

  it.each([
    'Stop blocking the release.',
    'No, stop adding scope.',
    'Can we pause it?',
    'Can we pause this?',
    'I need this to stop.',
    'We need to stop adding scope mid-sprint.',
    "Don't stop now, we're close.",
    'Can we pause the migration until billing ships?',
    'The deadline is Friday.',
    '',
    'Stop blocking the release, Sam.',
    'Sam, stop adding scope.',
    'Can we stop the export?',
    "Let's pause and think about the plan.",
    // Round 7 probes (D-064): interrupting the persona is roleplay, not a stop.
    'Can I stop you there?',
    'Sorry, can I stop you there? The release is Friday.',
    'Can I just stop you for a second?',
    "I'd like to stop you there.",
    'Wait, can I stop you there, Sam?',
    // Round 8 probes (D-067): a comma after a pause opener is still pushback.
    "Can we pause, and look at what's already in the sprint?",
    "I'd like to pause, and think about my current load.",
    'We need to pause, the release is blocked.',
    "Let's pause, and look at the numbers.",
    'I want to pause, not cancel it.',
    "No, stop, that's not what I said.",
    'Sam, can we pause, I need to talk about the release.',
    "OK, let's pause, what's actually blocking the merge?",
    'Hang on, let’s pause, you said QA signed off?',
  ])('keeps the roleplay going on %j', (line) => expect(isStopRequest(line, config, ['Sam'])).toBe(false));
});

// Every line below came from a review round that caught the filter getting it wrong.
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
    "I've been cutting myself for weeks and I can't stop.",
    'I keep hurting myself and nobody knows.',
    'I keep thinking about hurting myself tomorrow.',
    'I want to hurt myself so badly right now.',
    "I've been harming myself since the reorg.",
    'My manager hit me on the arm in the meeting.',
    'Sam hit me.',
    "I've thought about killing myself.",
    'He touched me without asking.',
    'I want to kill myself for real this time.',
    "I'm going to kill myself on Friday.",
    "I'm going to kill myself at the weekend.",
    'I want to kill myself with the pills in my drawer.',
    "I'm planning to kill myself over the weekend.",
    'I just hurt myself again last night.',
    'I only hurt myself when it gets this bad.',
    'My manager hit me last week.',
    'He hit me when I said no.',
    'He hit me hard across the face.',
    'I want to hurt myself by taking all my pills.',
    'I keep hurting myself and my arms are covered in scars.',
    'He hit me with a stapler.',
    'My boss keeps hitting me.',
    "I've been thinking about ending it all.",
    'I want to take my own life.',
    // Builder's own probes of the idiom exceptions.
    "I'm hurting myself.",
    "I'm just hurting myself more and more.",
    'He threw a stapler and it hit me.',
    'He threw it at me and it hit me in the face.',
    "I'm thinking of killing myself tonight.",
    'i wanna kill myself',
    "I've been self-harming.",
    'My lead slapped me.',
    'I cut myself off from everyone and I want to die.',
    // Round 6 probes (D-055): disclosures that an idiom must never cancel.
    "I've been thinking about killing myself to make it all stop.",
    'Some nights I think about killing myself to get away from all this.',
    'I keep thinking about killing myself over the project.',
    'I thought about killing myself here in the office last week.',
    'The guy that grabbed me in the lift is my team lead.',
    'My manager hit me back when I pushed his hand away.',
    'What hit me was his fist.',
    'He threw his mug at me and it hit me hard.',
    'The manager that touched me is still on my team.',
    'The colleague that hit me last week is in this meeting.',
    "I'm just hurting myself, every single night.",
    'Hit me up on Slack, he hit me yesterday.',
    "I'm killing myself with pills.",
    // Round 6 probes (D-056): phrasings never caught before.
    'I wanna die.',
    "I don't wanna be alive anymore.",
    'I wish I was dead.',
    'I want to be dead.',
    "I'm going to hang myself tonight.",
    'I almost killed myself last year.',
    'I harmed myself again last night.',
    "I'm going to take all my pills after this call.",
    "I'm going to jump off the roof after this meeting.",
    'Everyone would be better off without me.',
    'I do not want to live anymore.',
    'I cannot breathe.',
    "I'm about to have a panic attack.",
    'He hurt me.',
    'My manager keeps touching me.',
    'He pushed me into the wall.',
    "I'm being sexually harassed by my manager.",
    'I was sexually assaulted at the offsite.',
    'He raped me.',
    'I want to kill my self.',
    'I want to kill  myself.',
    'I want to kill\nmyself.',
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
    "Honestly, I'd just be hurting myself.",
    "If I say yes to this too, I'm only hurting myself.",
    'It hit me last night that we never scoped it.',
    'That news hit me hard.',
    'What you said in the retro really touched me.',
    'Can you hit me back after standup?',
    'The layoffs hit me too.',
    'Honestly, your message touched me.',
    'What grabbed me about your proposal was the timeline.',
    'I cut myself off from the planning thread.',
    "I'm killing myself here.",
    // Round 6 probes (D-057).
    "I've been killing myself for this team for two years.",
    "I'm already killing myself on the migration.",
    "I'm killing myself trying to hit Friday.",
    "I'm killing myself with overtime already.",
    'Hit me on Slack when it merges.',
    'Go on, hit me with your feedback.',
    'Just hit me with it.',
    'The deadline change hit me like a truck.',
    'It touched me that you noticed.',
    'Saying yes would hurt myself and the team.',
    'That comment really hurt me.',
    'Alex pushed me to take it on.',
    'That deadline really hurt me.',
    'I want to end things with this vendor.',
    'Honestly, that really hit me hard.',
    'Sales pushed me into taking the call.',
    "I'm cutting myself some slack today.",
    // Round 7 probes (D-062).
    "I don't want to shoot myself in the foot by saying yes.",
    "I'm trying to cut myself some slack this sprint.",
    "I'm going to cut myself some slack.",
    'I want to cut myself a break.',
    'I still have my sexual harassment training due this week.',
    "What's the point of going on with the review if nothing merges?",
    "Honestly, I'd be killing myself to hit that date.",
    'Dana hit me with a new requirement.',
    'You beat me to it.',
    'Sam beat me to it, he already merged the fix.',
    'The VPN kicked me off the call.',
    'Zoom kicked me out of the meeting twice.',
    'Taking this on on top of billing is a suicide mission.',
    'They shoved me onto the on-call rota.',
    'Can you hit me back?',
    'It hit me that we forgot QA.',
    'Sales pushed me to agree to Thursday.',
    // Round 8 probes (D-068) that a closed idiom now covers.
    "If I take this on, I'd be hurting myself and my team.",
    "I'm killing myself to get the release out.",
    'He pushed me to finish it by Friday.',
    'I need to cut myself off from Slack after six.',
    'It really hit me when you said that.',
    'Hit me back by EOD.',
    "Sam, hit me back once you've looked.",
    'That feedback really hurt me.',
    'Alex beat me to the punch.',
    'You beat me by a day.',
    'Jenkins kicked me out.',
    'They shoved me onto another project.',
    'That idea really grabbed me.',
    'Beats me why the build failed.',
  ])('does not flag the workplace idiom %j', (line) => expect(detectDistress(line, config)).toBe(false));
});

// Lines that pause the practice even though they are workplace idioms. Each one shares its exact
// wording with a real disclosure ("… and it hit me hard"), so the filter accepts the pause.
describe('accepted false positives', () => {
  it.each([
    'Your comment in standup hit me hard.',
    'That touched me.',
    'It hit me hard.',
    "I've been killing myself on this for weeks.",
    "I'm killing myself trying to get this done.",
    'This scope change pushed me to the limit.',
    'QA is having a panic attack about Friday.',
    'Alex is going to have a panic attack when he sees the burndown.',
    'I got hit by a wall of emails this morning.',
  ])(
    'pauses on %j',
    (line) => expect(detectDistress(line, config)).toBe(true),
  );
});

// Generated, not hand-picked: every idiom that covers a harm word must stop covering it the
// moment a person is the one doing it. This is the test that would have caught rounds 4-8.
describe('idioms never cover a person doing the harm', () => {
  const idioms = [
    'hit me back', 'hit me up', 'hit me with it', 'hit me hard', 'hit me', 'hurt me', 'really hurt me',
    'touched me', 'really touched me', 'grabbed me', 'pushed me', 'beat me', 'kicked me', 'shoved me',
  ];
  const people = ['He', 'She', 'My manager', 'My husband', 'The guy in finance', 'Sam'];
  const endings = ['.', ' today.', ' after I pushed him away.', ' last night.', ' against the wall.'];
  const lines = people.flatMap((person) => idioms.flatMap((idiom) => endings.map((end) => `${person} ${idiom}${end}`)));
  const consequences = ['He grabbed my arm and it hurt me.', 'He threw a mug and it hit me.', 'He shoved the desk and that hit me hard.'];

  it.each([...lines, ...consequences])('flags %j', (line) => expect(detectDistress(line, config)).toBe(true));
});

describe('data/safety.yaml', () => {
  it('ships a disclaimer and crisis resources with links', () => {
    expect(config.disclaimer).toMatch(/not therapy/);
    expect(config.resources.filter((resource) => resource.url).length).toBeGreaterThanOrEqual(3);
  });
});
