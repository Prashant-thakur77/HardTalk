# Running HardTalk live on a phone

Mock mode (`pnpm dev`) needs none of this. Live mode uses your microphone, an ElevenLabs voice agent as the persona and Claude as the grader. It runs in a development build, because Expo Go cannot load the WebRTC modules the voice connection needs.

## 1. Accounts and keys

- An Anthropic API key for the grader.
- An ElevenLabs account with Agents enabled, and an API key.

Keys go in `server/.env` only. The app talks to `/server`, which mints a short-lived voice token and runs grading, so no key is ever bundled into the app.

## 2. Create the persona agent in ElevenLabs

In the ElevenLabs dashboard, create a blank agent and set:

- LLM: Gemini 2.5 Flash (a different model family from the Claude grader, on purpose).
- System prompt: anything short, for example "You are a workplace roleplay partner." HardTalk replaces it at the start of every session with the prompt built from `data/prompts/persona.yaml` and the chosen scenario and level.
- First message: leave empty. The scenario's opening line is sent per session.
- Tools: enable the built-in "End conversation" system tool, so the persona can hang up when the stop condition is met.
- Security → Overrides: allow overriding the system prompt, the first message, the TTS speed (the pace setting) and text-only mode (typed practice).
- Privacy: turn off audio saving and set the conversation retention period as short as your plan allows. HardTalk never stores audio itself, but ElevenLabs keeps call audio and transcripts by default.
- Voice: any voice you like. A calm, natural voice works best.

Copy the agent ID.

## 3. Configure and start the server

```sh
cp server/.env.example server/.env
# fill in ANTHROPIC_API_KEY, ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID
pnpm start:server
```

The server prints which services are on. `curl localhost:8787/health` should show `"grading":true,"voice":true`.

## 4. Point the app at the server

The phone has to reach your computer over the network, so `localhost` will not work. Find your LAN address and create `.env.local` in the repo root:

```sh
EXPO_PUBLIC_MOCK=0
EXPO_PUBLIC_SERVER_URL=http://<your-computer-ip>:8787
```

## 5. Build and run

With a phone connected over USB and developer mode on:

```sh
pnpm android     # or: pnpm ios (needs Xcode)
```

This compiles the development build and installs it. After the first build, `pnpm start:live` starts the bundler for the installed build.

On the Android emulator, enable "Virtual microphone uses host audio input" in the emulator settings, or use a real device.

## Troubleshooting

- "Voice is not configured on this server": `ELEVENLABS_API_KEY` or `ELEVENLABS_AGENT_ID` is missing in `server/.env`.
- "Could not start a voice session (502)": the server could not get a token from ElevenLabs. Check the key and agent ID in the server log.
- The persona ignores the scenario: prompt overrides are not enabled on the agent (step 2).
- Typed mode or the pace setting fails to start: the text-only or TTS speed override is not enabled (step 2).
- The persona never hangs up: the End conversation tool is not enabled. HardTalk still ends the session after six of your turns.
