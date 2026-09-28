# Safety

HardTalk asks people to rehearse conversations they find hard. Some of them will be hard for reasons that have nothing to do with work. This file lists what the app does about that, where the code is, and what it cannot do.

HardTalk is a practice tool. It is not therapy, and it is not HR or legal advice. That line is on the home screen and the support screen, from `data/safety.yaml`.

## The persona pushes back, within limits

The persona prompt (`data/prompts/persona.yaml`) allows professional pushback only: deflecting, justifying, questioning priorities. It forbids insults, threats, slurs, swearing at the user, and sexual or personal remarks, and caps intensity at the chosen level. L3 is deflecting, not hostile. The guardrail block sits after the scenario text so it overrides it, and `src/voice/__tests__/personaPrompt.test.ts` checks every level's prompt carries it.

## Stopping is always one word away

- A request to stop ends the session at once. That is any comma clause made only of "stop" and filler ("Stop.", "Stop, you're scaring me.", "I'm sorry, I need to stop.", "Can you stop?"), or any sentence that opens with "stop" typed without commas ("stop im scared", "Stop right now", "Stop thank you"). It is checked on the device for every finished user line, so it does not depend on the model noticing. The word lists are in `data/safety.yaml`. "stop" followed by a verb ("stop blocking the release") or by "you" ("Can I stop you there?") is roleplay.
- "pause" is also how people push back ("Can we pause, and look at what's in the sprint?"), so a clause that only says "pause" stops the session only when everything around it is a lead-in ("Hold on,") or a short trailer ("…, I'm scared", "…, I'm not okay"). A bare "stop" inside pushback ("No, stop, that's not what I said.", "Wait, stop, let me finish.") does stop the session; the tests list those as accepted false stops.
- The persona is also told to drop character on the same request, or on distress, and say one fixed, out-of-character line: "Let's pause the practice here." The app looks for that line anywhere in the persona's reply and hangs up itself, unscored, rather than trusting the agent to end the call.
- A stopped session is never scored or saved. "End conversation" does the same. The stopped screen has a "Talk to someone" button that opens the crisis lines, because a stop may have been distress.
- Stopping while the call is still connecting cannot leak a live call: the session ends immediately and the call is never opened (`src/voice/__tests__/elevenlabs.test.ts`).

## Distress ends the roleplay, and is never scored

There are three layers, because no single one is enough.

1. **On the device, every line** (`data/safety.yaml`, `src/safety/rules.ts`). Text is normalised first ("wanna", "my self", "dont", "cannot", extra spaces). Then:
   - Explicit disclosures (thoughts or plans of suicide or self-harm, methods, "I'd rather be dead", assault, rape, sexual harassment, threats, panic attacks) are checked sentence by sentence and always count. This list only grows. Its few exceptions are complete harmless phrases ("cut myself some slack", "shoot myself in the foot", "beat me to it"), never a test of the next word alone.
   - Words that are usually harm but also appear in workplace idioms ("hit me", "killing myself", "touched me", "I was pushed") count unless the whole line, word for word, is one of a closed list of idiom templates: "Hit me up on Slack when it merges.", "The layoffs hit me too.", "I'm killing myself to hit this deadline." One extra clause or sentence and the line is checked, so nothing can hide behind an idiom: "He threw a stapler at me. It really hurt me." counts.
   - Most workplace idioms that reuse these words are not on the list, so they pause the practice. That is the trade the design makes; the tests name the known ones as accepted false positives.

   The tests hold every line a review round or the builder's own probing found the filter getting wrong, in both directions, plus generated lines that put a person in front of every idiom, or the harm in the sentence before it, and require distress each time (`src/safety/__tests__/rules.test.ts`).
2. **On the server, every line in live mode** (`POST /safety/check`). The app sends each finished user line in the background. The server runs the same rules, then asks Claude (`data/prompts/safety-classifier.yaml`) whether a line the rules passed is real distress, for the paraphrases no list will ever cover. A refusal or an unreadable answer counts as distress. A flag ends the roleplay and blocks scoring; if it arrives after the conversation was scored, the saved attempt is deleted and the free session it used is given back. If the model check itself fails (no network, a bad key, a server error), the server says so rather than answering "no distress", and the session shows that the extra check is offline while the on-device rules keep running. `/health` reports `safetyModel: true` when a key is set; it does not prove the key works.
3. **The persona and the grader.** The persona is told to stop on distress, and the grader sets `safety_flag`. `/grade` refuses to score a transcript the rules flag, or that the grader flags. Both return `{ safety: true }`, and the app shows the support screen instead of a scorecard (`server/__tests__/app.test.ts`).

When a line is flagged, the call ends and a calm support screen (`app/support.tsx`) lists crisis lines for the US, UK and Ireland and India, plus a worldwide directory. Nothing from the conversation is scored or saved.

## Data

- Saved transcripts and scores are stored only on the device (AsyncStorage). There are no accounts and no cloud sync. "Delete my practice history" on the home screen removes all of them after a second tap.
- In live mode the conversation itself leaves the device to be run and graded: audio and text go to ElevenLabs, and the text transcript goes to Anthropic through `/server`.
- The app never records or saves audio. In live mode, audio streams to the ElevenLabs agent for the conversation. ElevenLabs keeps call audio and transcripts by default; `docs/DEVICE.md` says how to turn off audio saving and shorten retention on the agent. Grading sends the text transcript to Anthropic's API.
- `/server` holds every provider key. The app only receives short-lived voice tokens. The RevenueCat key in the app is RevenueCat's public SDK key, which is designed to ship in apps.

## What this does not do

- None of the three layers is a clinical tool. The on-device rules miss phrasings they have not seen; the server's model check only runs in live mode, with a key; and all of them can mistake an unusual idiom for distress, which ends a practice session that did not need to end. Stopping by mistake is the error the design accepts.
- In mock mode, only the on-device rules run.
- The support screen lists services; it does not contact anyone.
- There is no age gate. HardTalk is written for working adults.
