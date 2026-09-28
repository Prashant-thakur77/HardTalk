# Safety

HardTalk asks people to rehearse conversations they find hard. Some of them will be hard for reasons that have nothing to do with work. This file lists what the app does about that, where the code is, and what it cannot do.

HardTalk is a practice tool. It is not therapy, and it is not HR or legal advice. That line is on the home screen and the support screen, from `data/safety.yaml`.

## The persona pushes back, within limits

The persona prompt (`data/prompts/persona.yaml`) allows professional pushback only: deflecting, justifying, questioning priorities. It forbids insults, threats, slurs, swearing at the user, and sexual or personal remarks, and caps intensity at the chosen level. L3 is deflecting, not hostile. The guardrail block sits after the scenario text so it overrides it, and `src/voice/__tests__/personaPrompt.test.ts` checks every level's prompt carries it.

## Stopping is always one word away

- Saying or typing just "stop" or "pause" (or "can we stop", "let's pause here") ends the session at once. It is checked on the device for every finished user line, so it does not depend on the model noticing. Lines that are part of the roleplay, like "stop blocking the release", do not trigger it. Rules: `src/safety/rules.ts`, tests with both kinds of line in `src/safety/__tests__/rules.test.ts`.
- The persona is also told to drop character on the same request, or on distress, and say one fixed, out-of-character line: "Let's pause the practice here." The app matches that exact line and hangs up itself, unscored, rather than trusting the agent to end the call. An in-character wrap-up that merely sounds similar is not matched.
- A stopped session is never scored or saved. "End conversation" does the same. The stopped screen has a "Talk to someone" button that opens the crisis lines, because a stop the persona caught may have been distress.
- Stopping while the call is still connecting cannot leak a live call: the session ends immediately and the call is never opened (`src/voice/__tests__/elevenlabs.test.ts`).

## Distress ends the roleplay, and is never scored

- A short list of strong distress signals (self-harm, suicide, panic, physical or sexual harassment) lives in `data/safety.yaml`. It is deliberately narrow: "this deadline is killing me", "hit me up on Slack" and "cut myself some slack" do not trip it. The tests list what does and does not.
- On the device, a matching user line ends the call and opens a calm support screen (`app/support.tsx`) with crisis lines for the US, UK and Ireland, India, and a worldwide directory. Nothing from the conversation is scored or saved.
- On the server, `/grade` refuses to score any transcript with a matching user line, and also refuses when the grader itself sets `safety_flag`. Both return `{ safety: true }`, and the app shows the support screen instead of a scorecard (`server/__tests__/app.test.ts`).

## Data

- Saved transcripts and scores are stored only on the device (AsyncStorage). There are no accounts and no cloud sync. "Delete my practice history" on the home screen removes all of them after a second tap.
- In live mode the conversation itself leaves the device to be run and graded: audio and text go to ElevenLabs, and the text transcript goes to Anthropic through `/server`.
- The app never records or saves audio. In live mode, audio streams to the ElevenLabs agent for the conversation. ElevenLabs keeps call audio and transcripts by default; `docs/DEVICE.md` says how to turn off audio saving and shorten retention on the agent. Grading sends the text transcript to Anthropic's API.
- `/server` holds every provider key. The app only receives short-lived voice tokens. The RevenueCat key in the app is RevenueCat's public SDK key, which is designed to ship in apps.

## What this does not do

- The distress check is a keyword list, not a clinical tool. It will miss distress phrased in ways it has not seen, which is why the persona and the grader are also told to watch for it.
- The support screen lists services; it does not contact anyone.
- There is no age gate. HardTalk is written for working adults.
