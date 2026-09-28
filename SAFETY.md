# Safety

HardTalk asks people to rehearse conversations they find hard. Some of them will be hard for reasons that have nothing to do with work. This file lists what the app does about that, where the code is, and what it cannot do.

HardTalk is a practice tool. It is not therapy, and it is not HR or legal advice. That line is on the home screen and the support screen, from `data/safety.yaml`.

## The persona pushes back, within limits

The persona prompt (`data/prompts/persona.yaml`) allows professional pushback only: deflecting, justifying, questioning priorities. It forbids insults, threats, slurs, swearing at the user, and sexual or personal remarks, and caps intensity at the chosen level. L3 is deflecting, not hostile. The guardrail block sits after the scenario text so it overrides it, and `src/voice/__tests__/personaPrompt.test.ts` checks every level's prompt carries it.

## Stopping is always one word away

- Saying or typing a sentence that is only a request to stop ("Stop.", "Stop it.", "Sam, can we pause here?", "Sorry, I need to stop the practice now.") ends the session at once. It is checked on the device for every finished user line, so it does not depend on the model noticing. Lines that are part of the roleplay, like "stop blocking the release" or "can we pause it?" (about the export), do not trigger it. Rules: `src/safety/rules.ts`.
- The persona is also told to drop character on the same request, or on distress, and say one fixed, out-of-character line: "Let's pause the practice here." The app looks for that line anywhere in the persona's reply and hangs up itself, unscored, rather than trusting the agent to end the call.
- A stopped session is never scored or saved. "End conversation" does the same. The stopped screen has a "Talk to someone" button that opens the crisis lines, because a stop may have been distress.
- Stopping while the call is still connecting cannot leak a live call: the session ends immediately and the call is never opened (`src/voice/__tests__/elevenlabs.test.ts`).

## Distress ends the roleplay, and is never scored

There are three layers, because no single one is enough.

1. **On the device, every line** (`data/safety.yaml`, `src/safety/rules.ts`). Text is normalised first ("wanna", "my self", "cannot", extra spaces), then checked sentence by sentence:
   - Explicit disclosures (thoughts or plans of suicide or self-harm, methods, "I wish I was dead", assault, rape, sexual harassment, panic) always count, and nothing can cancel them.
   - Words that are usually harm but also appear in workplace idioms ("hit me", "killing myself", "touched me") count unless that exact occurrence is covered by a known idiom that starts the sentence or follows a comma. So "Can you hit me back after standup?" continues, but "My manager hit me back when I pushed his hand away" stops the session.

   The tests hold every line a review round or the builder's own probing found the filter getting wrong, in both directions (`src/safety/__tests__/rules.test.ts`).
2. **On the server, every line in live mode** (`POST /safety/check`). The app sends each finished user line in the background. The server runs the same rules, then asks Claude (`data/prompts/safety-classifier.yaml`) whether a line the rules passed is real distress, for the paraphrases no list will ever cover. A refusal or an unreadable answer counts as distress. A flag ends the roleplay and blocks scoring, even if it arrives after the session ended.
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
